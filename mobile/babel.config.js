module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@store': './src/store',
            '@utils': './src/utils',
            '@config': './src/config',
            '@types': './src/types',
            '@api': './src/api',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@constants': './src/constants',
            '@theme': './src/theme',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: [
          // Remove console.log in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }],
        ],
      },
    },
    assumptions: {
      // Enable assumptions for better optimization
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
    },
  };
};
