const rootMongoose = require('mongoose');
const proxyMongoose = require('../proxy/node_modules/mongoose');

console.log('Root Mongoose === Proxy Mongoose:', rootMongoose === proxyMongoose);
console.log('Root Mongoose version:', rootMongoose.version);
console.log('Proxy Mongoose version:', proxyMongoose.version);
