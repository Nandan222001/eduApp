const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@react-native-async-storage/async-storage',
        ],
      },
    },
    argv
  );

  // Exclude native-only modules from web bundle
  config.resolve.alias = {
    ...config.resolve.alias,
    'expo-camera': path.resolve(__dirname, 'src/utils/stubs/camera.web.ts'),
    'expo-barcode-scanner': path.resolve(__dirname, 'src/utils/stubs/barcode.web.ts'),
    'expo-local-authentication': path.resolve(__dirname, 'src/utils/stubs/auth.web.ts'),
    'expo-notifications': path.resolve(__dirname, 'src/utils/stubs/notifications.web.ts'),
    'expo-background-fetch': path.resolve(__dirname, 'src/utils/stubs/background.web.ts'),
    'expo-task-manager': path.resolve(__dirname, 'src/utils/stubs/tasks.web.ts'),
    'react-native-image-crop-picker': path.resolve(__dirname, 'src/utils/stubs/imagePicker.web.ts'),
  };

  // Ensure proper MIME types via dev server configuration
  if (config.devServer) {
    const mimeTypeMiddleware = (req, res, next) => {
      // Get the path without query parameters
      const urlPath = req.url.split('?')[0];
      
      // Set proper MIME types for JavaScript bundles
      if (urlPath.match(/\.(bundle|js|mjs|cjs)$/)) {
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
      next();
    };

    config.devServer = {
      ...config.devServer,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
      },
      // Support both old and new webpack-dev-server API
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        devServer.app.use(mimeTypeMiddleware);
        return middlewares;
      },
      onBeforeSetupMiddleware: (devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        devServer.app.use(mimeTypeMiddleware);
      },
    };
  }

  // Enable performance hints
  config.performance = {
    hints: 'warning',
    maxAssetSize: 2000000, // 2MB
    maxEntrypointSize: 2000000, // 2MB
  };

  // Optimize chunks for better code splitting
  if (config.mode === 'production') {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          // Split vendor code into separate chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Get the package name from node_modules path
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              // npm package names are URL-safe, but some servers don't like @ symbols
              return `vendor.${packageName.replace('@', '')}`;
            },
            priority: 10,
            reuseExistingChunk: true,
          },
          // Split react-native-chart-kit separately as it's heavy
          chartKit: {
            test: /[\\/]node_modules[\\/](react-native-chart-kit|react-native-svg)[\\/]/,
            name: 'vendor.chart-kit',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common code used across multiple chunks
          common: {
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
      usedExports: true,
      sideEffects: true,
      minimize: true,
      concatenateModules: true,
    };
  }

  return config;
};
