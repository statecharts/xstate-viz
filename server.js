require('babel-core/register');
require('babel-polyfill');

let NODE_ENV = 'development';

const Hapi = require('hapi');
const Hoek = require('hoek');
const Inert = require('inert');
const Vision = require('vision');
const WebpackPlugin = require('hapi-webpack-plugin');

// Create a server with a host and port
const server = new Hapi.Server({
  host: process.env.host ? process.env.host : 'localhost',
  port: 8001,
  router: { stripTrailingSlash: true },
  debug: { request: ['info'] },
});

const register_strategies = async () => {
}

const register_routes = async (err) => {
  await server.register(Inert);
  server.route({
    method: 'GET',
    path: '/node_modules/{param*}',
    options: {
      handler: {
        directory: {
          path: './node_modules',
          redirectToSlash: true,
          index: true
        }
      },
    }
  });

  if (!module.parent) {
    // do not use webpack inside mocha / npm test
    await server.register({
      plugin: WebpackPlugin,
      options: './webpack.config.js'
    });
    await server.register({
      plugin: require('good'),
      options: {
        includes: {
          request: ['headers','payload'],
          response: ['payload']
        },
        reporters: {
          console: [
            {
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ error: '*', log: '*', request: '*', response: '*' }]
            },
            {
              module: 'good-console',
              args: [{color: (NODE_ENV === 'development')}],
            },
            'stdout'
          ]
        }
      }
    });
  }

  // Add routes
  server.route({
    method: 'GET',
    path: '/',
    options: {
      handler: (request, h) => {
        return h.view('root', {});
      },
    }
  });
  let routes = [
    Vision,
  ];
  await server.register(routes);

  server.views({
    engines: {
      hbs: require('handlebars')
    },
    relativeTo: __dirname,
    path: './views',
  });

  if (!module.parent) {
    // Start the server, but only if not running inside mocha / npm test
    server.start(async (err) => {
      if (err) {
        throw err;
      }
      console.log('Server running at:', server.info.uri);
    });
  }
}

const initialize = async () => {
  await register_strategies();
  await register_routes();
}

if (!module.parent) {
  // if we're not running inside mocha / npm test, auto initialize the server.
  // inside mocha, we need to do this via a beforeEach in order to assure synchrony.
  initialize();
}

module.exports = {
  server: server,
  initialize: initialize,
}
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
  console.log(error.stack);
});
