const mongoose = require('mongoose');
const { AppStat, DeviceStat } = require('./backend/models/Schemas');

mongoose.connect('mongodb://127.0.0.1:27017/backone_dpi').then(async () => {
    console.log('AppStats count:', await AppStat.countDocuments());
    console.log('DeviceStats count:', await DeviceStat.countDocuments());
    process.exit(0);
});
