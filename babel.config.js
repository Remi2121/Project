module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin' ,
      'react-native-reanimated/plugin' // ✅ use this instead of reanimated/plugin
    ],
  };
};
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ❌ 'react-native-worklets/plugin',
      'react-native-reanimated/plugin', // keep this LAST
    ],
  };
};
