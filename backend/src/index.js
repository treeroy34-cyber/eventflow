// Fix: Node.js on Windows sometimes fails SRV DNS lookups used by mongodb+srv://
// This forces IPv4-first resolution which resolves the ECONNREFUSED error
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const checkinRoutes = require('./routes/checkin');
const analyticsRoutes = require('./routes/analytics');
const certificateRoutes = require('./routes/certificates');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');
const paymentRoutes = require('./routes/payment');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, cb) => {
        const allowed = process.env.CLIENT_URL || 'http://localhost:3000';
        if (!origin || process.env.NODE_ENV !== 'production' || origin === allowed) {
            cb(null, true);
        } else {
            cb(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serverless MongoDB Connection Middleware (Vercel & Next.js)
const ensureDbConnected = async () => {
    if (mongoose.connection.readyState === 1) return;
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        dotenv.config({ path: path.join(__dirname, '../.env') });
        mongoUri = process.env.MONGODB_URI;
    }
    if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
        mongoUri = await buildDirectUri(mongoUri);
    }
    if (mongoUri) {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }
};

app.use(async (req, res, next) => {
    try {
        await ensureDbConnected();
        next();
    } catch (err) {
        console.error('DB Middleware Connection Error:', err.message);
        if (mongoose.connection.readyState !== 1) {
            try {
                const { MongoMemoryServer } = eval('require')('mongodb-memory-server');
                const mongod = await MongoMemoryServer.create();
                await mongoose.connect(mongod.getUri());
                console.log('✅ Connected to fallback in-memory MongoDB');
            } catch (fbErr) {
                console.error('Fallback DB failed:', fbErr.message);
            }
        }
        next();
    }
});

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);

// ─── SRS-spec API Alias Routes ───────────────────────────────────────────────
// These match the paths defined in the SRS document exactly.
app.post('/api/login', (req, res, next) => {
    req.url = '/login';
    authRoutes(req, res, next);
});
app.post('/api/signup', (req, res, next) => {
    req.url = '/register';
    authRoutes(req, res, next);
});
app.post('/api/register', (req, res, next) => {
    req.url = '/';
    registrationRoutes(req, res, next);
});

// Health check — useful to confirm the server is alive
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        email: !!process.env.RESEND_API_KEY ? 'resend (live)' : 'console (dev)',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Startup Validation ──────────────────────────────────────────────────────
const checkEnv = () => {
    const warnings = [];
    const errors = [];

    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost:27017')) {
        warnings.push('MONGODB_URI is using local MongoDB — for production, use a MongoDB Atlas URI');
    }
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_your_api_key_here') {
        warnings.push('RESEND_API_KEY not set — emails will be logged to console only (not sent)');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_me')) {
        warnings.push('JWT_SECRET is using the default value — change it for production!');
    }

    if (warnings.length > 0) {
        console.log('\n⚠️  Configuration Warnings:');
        warnings.forEach(w => console.log(`   • ${w}`));
        console.log('   → Edit backend/.env to fix these\n');
    }
};

// ─── SRV Resolution Helper (Windows DNS workaround) ─────────────────────────
const resolveAtlasSrv = (srvHost) => {
    return new Promise((resolve) => {
        const { exec } = require('child_process');
        exec(`nslookup -type=SRV _mongodb._tcp.${srvHost}`, (err, stdout) => {
            if (err) { resolve(null); return; }
            const hosts = [];
            const lines = stdout.split('\n');
            for (const line of lines) {
                const m = line.match(/svr hostname\s*=\s*(.+)/i);
                if (m) hosts.push(m[1].trim().replace(/\.$/, ''));
            }
            resolve(hosts.length > 0 ? hosts : null);
        });
    });
};

const buildDirectUri = async (srvUri) => {
    const m = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!m) return srvUri;

    const credentials = m[1];
    const srvHost = m[2];
    const db = (m[3] || '/').replace(/^\//, '') || 'eventflow';
    const params = (m[4] || '').replace(/^\?/, '');

    console.log('🔍 Resolving Atlas SRV records via OS nslookup...');
    const shards = await resolveAtlasSrv(srvHost);

    if (!shards || shards.length === 0) {
        console.warn('⚠️  Could not resolve SRV records — using original URI');
        return srvUri;
    }

    const hostList = shards.map(h => `${h}:27017`).join(',');
    const replicaSet = srvHost.split('.')[0];
    const directUri = `mongodb://${credentials}@${hostList}/${db}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
    console.log(`✅ Resolved ${shards.length} Atlas shards — using direct connection`);
    return directUri;
};

// ─── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
    checkEnv();

    let mongoUri = process.env.MONGODB_URI;

    // Auto-start in-memory MongoDB when Atlas URI is not configured
    if (!mongoUri || mongoUri.includes('localhost:27017')) {
        console.log('🧪 Starting in-memory MongoDB (dev mode — data resets on restart)...');
        try {
            const { MongoMemoryServer } = eval('require')('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            console.log('✅ In-memory MongoDB ready');
        } catch (err) {
            console.error('❌ Could not start in-memory MongoDB:', err.message);
            process.exit(1);
        }
    }

    // If using Atlas SRV URI, resolve shards via OS (bypasses Node.js broken SRV)
    if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
        mongoUri = await buildDirectUri(mongoUri);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Atlas connected successfully');
    } catch (err) {
        console.error('❌ MongoDB Atlas connection failed:', err.message);
        console.warn('⚠️ Falling back to in-memory MongoDB so the server can run...');
        try {
            const { MongoMemoryServer } = eval('require')('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const memoryUri = mongod.getUri();
            await mongoose.connect(memoryUri);
            console.log('✅ Fallback in-memory MongoDB connected & ready!');
        } catch (fallbackErr) {
            console.error('❌ Fallback in-memory MongoDB failed:', fallbackErr.message);
        }
    }

    app.listen(PORT, () => {
        console.log(`🚀 EventFlow API → http://localhost:${PORT}`);
        console.log(`🔗 Health check → http://localhost:${PORT}/api/health`);
    });

    // ─── Email Reminder Scheduler ────────────────────────────────────────────
    cron.schedule('*/30 * * * *', async () => {
        try {
            const Event = require('./models/Event');
            const Registration = require('./models/Registration');
            const { sendEventReminder } = require('./services/emailService');
            const now = new Date();

            // 24-hour reminders
            const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const events24h = await Event.find({
                date: {
                    $gte: new Date(in24h.getTime() - 15 * 60 * 1000),
                    $lte: new Date(in24h.getTime() + 15 * 60 * 1000)
                }
            });
            for (const evt of events24h) {
                const regs = await Registration.find({ eventId: evt._id, status: 'REGISTERED' });
                for (const reg of regs) {
                    sendEventReminder({
                        to: reg.email, attendeeName: reg.attendeeName,
                        eventTitle: evt.title, eventDate: evt.date,
                        eventVenue: evt.venue, hoursLeft: 24
                    }).catch(() => { });
                }
            }

            // 1-hour reminders
            const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
            const events1h = await Event.find({
                date: {
                    $gte: new Date(in1h.getTime() - 15 * 60 * 1000),
                    $lte: new Date(in1h.getTime() + 15 * 60 * 1000)
                }
            });
            for (const evt of events1h) {
                const regs = await Registration.find({ eventId: evt._id, status: 'REGISTERED' });
                for (const reg of regs) {
                    sendEventReminder({
                        to: reg.email, attendeeName: reg.attendeeName,
                        eventTitle: evt.title, eventDate: evt.date,
                        eventVenue: evt.venue, hoursLeft: 1
                    }).catch(() => { });
                }
            }
        } catch (err) {
            console.error('Scheduler error:', err.message);
        }
    });

    console.log('⏰ Email reminder scheduler active (runs every 30 min)');
};

startServer();

module.exports = app;
