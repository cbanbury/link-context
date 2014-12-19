'use strict'

var Hapi = require('hapi');
var Joi = require('joi');
var shortId = require('shortid');
var url = require('url');

// SECTION: Database configuration
var MongoClient = require('mongodb').MongoClient;

var _db;

MongoClient.connect('mongodb://localhost:27017/asc', function (err, db) {
  if (err) {
    console.log('Error: Unable to connect to MongoDB');
  }

  _db = db.collection('links');
});

// SECTION: App config
var SEED = 1;
var PORT = 8000;
var DOMAIN = 'localhost';

var BASE_ROUTE = 'http://' + DOMAIN + ':' + PORT + '/';

if (PORT === 80) {
  BASE_ROUTE = 'http://' + DOMAIN + '/';
}

// SECTION: Main app
shortId.seed(SEED);

var server = new Hapi.Server(DOMAIN, PORT);

// new link route
server.route({
  method: 'GET',
  path: '/create/new/link/',
  config: {
    validate: {
      query: {
        redirect: Joi.string().required(),
        context: Joi.string().required()
      }
    }
  },
  handler: function (request, reply) {
    var link = BASE_ROUTE + shortId.generate();

    _db.insert({
      link: link,
      redirect: request.query.redirect,
      context: request.query.context
    }, function (err) {
      if (err) {
        return reply('Error: Unable to save link data.');
      }

      return reply(link);
    });
  }
});

// unique link and redirect route
server.route({
  method: 'GET',
  path: '/{id}',
  config: {
      validate: {
        params: {
          id: Joi.string().regex(/[A-Za-z-_0-9]+/).required()
        }
      }
  },
  handler: function (request, reply) {
    console.log('getting a hit! ')
    console.log(request.headers['user-agent']);
    var search = BASE_ROUTE + request.params.id;

    _db.findOne({link: search}, function (err, result) {
      if (err) {
        return reply(500);
      }

      if (!result || !result.redirect) {
        return reply(404);
      }

      if (result.clicks) {
        result.clicks++;
      } else {
        result.clicks = 1;
      }

      _db.update({link: search}, result, function (err) {
        if (err) {
          console.log('Error saving clicks ' + JSON.stringify(result));
        }

        return reply.redirect(url.format(result.redirect.toString()));
      });
    });
  }
});

// TODO: deprecate/consolidate into the search route
// get by data route
server.route({
  method: 'GET',
  path: '/link/',
  config: {
    validate: {
      query: {
        path: Joi.string().required()
      }
    },
    jsonp: 'callback'
  },
  handler: function (request, reply) {
    _db.findOne({link: request.query.path}, {_id: 0}, function (err, result) {
      if (err) {
        return reply(500);
      }

      if (!result) {
        return reply('No context matching requested path.')
      }

      return reply(result);
    });
  }
});

// match on context
server.route({
  method: 'GET',
  path: '/search/',
  config: {
    validate: {
      query: {
        context: Joi.string()
      }
    },
    jsonp: 'callback'
  },
  handler: function (request, reply) {
    if (request.query.context) {
      var query = {context: { $regex: request.query.context }};

      _db.find(query, {_id: 0}).toArray(function (err, result) {
        if (err) {
          return reply(500);
        }

        return reply(result);
      });
    } else {
      return reply([]);
    }
  }
});

process.on('message', function (message) {
  if (message === 'shutdown') {
    // TODO: gracefully exit instead of instant termination
    process.exit(0);
  }
});


server.start(function () {
  if (process.send) process.send('online');
});

module.exports = {
  server: server
};
