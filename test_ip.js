const mongoose = require('mongoose');
const { DeviceStat, Flow } = require('./backend/models/Schemas');

mongoose.connect('mongodb://127.0.0.1:27017/backone_dpi').then(async () => {
    try {
        const ip = "10.6.30.8";
        const device = await DeviceStat.findOne({ ip_address: ip }).sort({ timestamp: -1 });
        console.log("DeviceStat for IP:", device);
        
        const flowsCount = await Flow.countDocuments({ $or: [{src_ip: ip}, {dst_ip: ip}] });
        console.log("Total flows for IP:", flowsCount);
        
        const recentFlow = await Flow.findOne({ $or: [{src_ip: ip}, {dst_ip: ip}] }).sort({ timestamp: -1 });
        console.log("Most recent flow:", recentFlow);
        
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
