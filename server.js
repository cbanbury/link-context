var Hapi = require('hapi');
var Joi = require('joi');
var shortId = require('shortid');
var url = require('url');

var SEED = 4598;
var PORT = 8000;
var DOMAIN = 'localhost';
var BASE_ROUTE = 'http://' + DOMAIN + ':' + PORT + '/';

shortId.seed(SEED);

var server = new Hapi.Server(DOMAIN, PORT);

// dummy database, replace with something like mongo/redis
var database = [];

// new link route
server.route({
  method: 'GET',
  path: '/create/new/link/',
  config: {
    validate: {
      query: {
        uri: Joi.string().required(),
        data: Joi.string().required()
      }
    }
  },
  handler: function (request, reply) {
    var link = BASE_ROUTE + shortId.generate();

    database.push({
      link: link,
      uri: JSON.parse(request.query.uri),
      data: JSON.parse(request.query.data)
    });

    return reply(link);
  }
});

// unique link and redirect route
server.route({
  method: 'GET',
  path: '/{id}', // TODO regex validation
  handler: function (request, reply) {
    var match = database.filter(function (item) {
      return item.link === BASE_ROUTE + request.params.id;
    });

    if (match.length !== 1) {
      return reply('Error: Sorry, no idea where to send you :(');
    }

    // increment clicks
    match = match[0];

    database.filter(function (item) {
      if (item.link === BASE_ROUTE + request.params.id) {
        if (item.clicks) {
          item.clicks++;
        } else {
          item.clicks = 1;
        }
      }
    });

    console.log(database);

    return reply.redirect(url.format(match.uri.toString()));
  }
});

// get by data route
// TODO: should be JSONP
server.route({
  method: 'GET',
  path: '/link/',
  config: {
    validate: {
      query: {
        path: Joi.string().required()
      }
    }
  },
  handler: function (request, reply) {
    var match = database.filter(function (item) {
      return item.link === request.query.path;
    });

    if (match.length === 0) {
      return reply('Nothing found.');
    }

    if (match.length !== 1) {
      return reply('Unable to uniquely identify link');
    }

    return reply(match[0]);
  }
});


server.start();
