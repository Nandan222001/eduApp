const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'mjs', 'cjs'],
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
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  extraNodeModules: {
    '@components': path.resolve(__dirname, 'src/components'),
    '@screens': path.resolve(__dirname, 'src/screens'),
    '@store': path.resolve(__dirname, 'src/store'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@config': path.resolve(__dirname, 'src/config'),
    '@types': path.resolve(__dirname, 'src/types'),
    '@api': path.resolve(__dirname, 'src/api'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@constants': path.resolve(__dirname, 'src/constants'),
    '@theme': path.resolve(__dirname, 'src/theme'),
  },
};

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set proper MIME types for web
      if (req.url.endsWith('.bundle') || req.url.endsWith('.js') || req.url.endsWith('.mjs') || req.url.endsWith('.cjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (req.url.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (req.url.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (req.url.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (req.url.endsWith('.map')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (req.url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        const ext = req.url.split('.').pop();
        res.setHeader('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`);
      } else if (req.url.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      } else if (req.url.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        const ext = req.url.split('.').pop();
        const mimeTypes = {
          woff: 'font/woff',
          woff2: 'font/woff2',
          ttf: 'font/ttf',
          otf: 'font/otf',
          eot: 'application/vnd.ms-fontobject',
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
