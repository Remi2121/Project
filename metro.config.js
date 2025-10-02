const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// (optional) only if you still need .xlsx:
config.resolver.assetExts = [...config.resolver.assetExts, 'xlsx'];
module.exports = config;
