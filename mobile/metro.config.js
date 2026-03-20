const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx'],
  assetExts: [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'webp',
    'svg',
    'ttf',
    'otf',
    'woff',
    'woff2',
    'eot',
    'mp4',
    'webm',
    'wav',
    'mp3',
    'm4a',
    'aac',
    'oga',
    'pdf',
    'zip',
  ],
};

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.endsWith('.bundle')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (req.url.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (req.url.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (req.url.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (req.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        res.setHeader('Content-Type', 'image/' + req.url.split('.').pop());
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
