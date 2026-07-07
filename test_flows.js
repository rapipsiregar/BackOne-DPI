const mongoose = require('mongoose');
const { Flow, Threat } = require('./backend/models/Schemas');
const timeRange = new Date(Date.now() - 3600*1000); // last 1 hour

mongoose.connect('mongodb://127.0.0.1:27017/backone_dpi').then(async () => {
    try {
        const flowCount = await Flow.countDocuments();
        console.log("Total flows in DB:", flowCount);
        const threatCount = await Threat.countDocuments();
        console.log("Total threats in DB:", threatCount);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}).catch(e => {
    // If running in in-memory mode, we won't be able to connect via port 27017 easily
    console.error("Could not connect to mongodb, probably using in-memory DB port.");
    process.exit(1);
});
