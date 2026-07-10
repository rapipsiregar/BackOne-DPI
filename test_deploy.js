const mongoose = require('mongoose');
const Client = require('ssh2-sftp-client');

async function testConnections() {
    console.log("Testing remote MongoDB connection...");
    try {
        await mongoose.connect('mongodb://mongodb.prod.proit.id:27017/backone-dpi', {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ Successfully connected to remote MongoDB!");
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Failed to connect to remote MongoDB:", error.message);
    }

    console.log("\nTesting SFTP connection...");
    const sftp = new Client();
    try {
        await sftp.connect({
            host: '103.185.47.52',
            port: 2222,
            username: 'adminbackend',
            password: 'htEo7x6LsBQiEHHH',
            readyTimeout: 5000
        });
        console.log("✅ Successfully connected to SFTP!");
        const list = await sftp.list('/');
        console.log(`Found ${list.length} items in root directory.`);
        await sftp.end();
    } catch (error) {
        console.error("❌ Failed to connect to SFTP:", error.message);
    }
}

testConnections();
