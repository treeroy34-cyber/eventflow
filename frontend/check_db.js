const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { exec } = require('child_process');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const resolveAtlasSrv = (srvHost) => {
    return new Promise((resolve) => {
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

    console.log('🔍 Resolving Atlas SRV records via OS nslookup...');
    const shards = await resolveAtlasSrv(srvHost);

    if (!shards || shards.length === 0) {
        console.warn('⚠️ Could not resolve SRV records — using original URI');
        return srvUri;
    }

    const hostList = shards.map(h => `${h}:27017`).join(',');
    return `mongodb://${credentials}@${hostList}/${db}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
};

async function testAtlasSrv() {
    let rawUri = process.env.MONGODB_URI;
    const m = rawUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)\/([^?]+)/);
    const user = m[1]; const pass = m[2]; const srvHost = m[3]; const db = m[4];

    const shards = await resolveAtlasSrv(srvHost);
    const hostList = shards.map(h => `${h}:27017`).join(',');
    const directUri = `mongodb://${user}:${encodeURIComponent(pass)}@${hostList}/${db}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

    await mongoose.connect(directUri);
    console.log("✅ Successfully connected to MongoDB Atlas!");
    const dbObj = mongoose.connection.db;
    const collections = await dbObj.listCollections().toArray();
    console.log(`Database '${db}' has ${collections.length} collection(s):`, collections.map(c => c.name));

    await mongoose.disconnect();
    process.exit(0);


}

testAtlasSrv();












