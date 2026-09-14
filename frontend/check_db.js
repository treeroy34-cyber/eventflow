const mongoose = require('mongoose');
const { exec } = require('child_process');

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

async function checkDatabase() {
    try {
        const srvHost = "cluster0.dwfz1ql.mongodb.net";
        const shards = await resolveAtlasSrv(srvHost);
        console.log("Resolved shards:", shards);

        let uri;
        if (shards && shards.length > 0) {
            const hostList = shards.map(h => `${h}:27017`).join(',');
            uri = `mongodb://tasqrrr315_db_user:JAHgY6Y7u1UAwZPv@${hostList}/eventflow?ssl=true&authSource=admin&retryWrites=true&w=majority`;
        } else {
            uri = "mongodb+srv://tasqrrr315_db_user:JAHgY6Y7u1UAwZPv@cluster0.dwfz1ql.mongodb.net/eventflow?retryWrites=true&w=majority&appName=Cluster0";
        }

        console.log("Connecting with resolved URI...");
        await mongoose.connect(uri);
        console.log("✅ Successfully Connected to MongoDB Atlas!");

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log("\nCollections in DB:", collections.map(c => c.name));

        if (collections.some(c => c.name === 'events')) {
            const events = await db.collection('events').find({}).toArray();
            console.log(`\nFound ${events.length} total events in 'events' collection:`);
            events.forEach((evt, idx) => {
                console.log(`\nEvent #${idx + 1}:`);
                console.log(`  ID: ${evt._id}`);
                console.log(`  Title: ${evt.title}`);
                console.log(`  Status: ${evt.status}`);
                console.log(`  IsPublished: ${evt.isPublished}`);
                console.log(`  Created At: ${evt.createdAt}`);
            });
        } else {
            console.log("Collection 'events' does not exist yet in MongoDB Atlas.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Database check error:", err);
    }
}

checkDatabase();
