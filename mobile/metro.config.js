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
  // Platform-specific extensions for better tree-shaking
  platforms: ['ios', 'android', 'web'],
  // Prioritize platform-specific extensions for tree-shaking
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Exclude native-only modules from web bundle
  blockList: [
    // Will be filtered during runtime based on platform
  ],
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'import', 'react-native'],
};

config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  // Enable minification for production builds
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    ecma: 8,
    keep_classnames: false,
    keep_fnames: false,
    module: true,
    mangle: {
      module: true,
      keep_classnames: false,
      keep_fnames: false,
    },
    compress: {
      ecma: 2017,
      module: true,
      // Enable dead code elimination
      dead_code: true,
      drop_console: process.env.NODE_ENV === 'production',
      passes: 3,
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_methods: true,
      // Additional optimizations for tree-shaking
      side_effects: true,
      unused: true,
      collapse_vars: true,
      reduce_vars: true,
      toplevel: true,
    },
    output: {
      comments: false,
      ascii_only: true,
    },
  },
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
      // Get the path without query parameters
      const urlPath = req.url.split('?')[0];
      
      // Set proper MIME types for web
      // Handle both forward and backward slashes (common on Windows)
      if (urlPath.endsWith('.bundle') || urlPath.endsWith('.js') || urlPath.endsWith('.mjs') || urlPath.endsWith('.cjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (urlPath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (urlPath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (urlPath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (urlPath.endsWith('.map')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (urlPath.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        const ext = urlPath.split('.').pop();
        res.setHeader('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`);
      } else if (urlPath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      } else if (urlPath.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        const ext = urlPath.split('.').pop();
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
