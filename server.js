'use strict';

var express = require('express');
var app = express();
var shortId = require('shortid');
var bodyParser = require('body-parser');
var device = require('express-device');
var expressValidator = require('express-validator');
var url = require('url');

// SECTION: Database configuration
var MongoClient = require('mongodb').MongoClient;

var _db;

var connectionString = 'mongodb://localhost:27017/asc';

if (process.env.NODE_ENV === 'test') {
  connectionString = 'mongodb://localhost:27017/link-context-test'
}

MongoClient.connect(connectionString, function (err, db) {
  if (err) {
    console.log('Error: Unable to connect to MongoDB');
  }

  _db = db.collection('links');
});

// SECTION: App config
var SEED = process.env.CONTEXT_SEED || 1;
var PORT = process.env.CONTEXT_PORT || 8000;

if (process.env.NODE_ENV === 'test') {
    PORT = 8001;
}

var DOMAIN = process.env.CONTEXT_DOMAIN || 'localhost';

var BASE_ROUTE = 'http://' + DOMAIN + ':' + PORT + '/';

if (+PORT === 80) {
  BASE_ROUTE = 'http://' + DOMAIN + '/';
}

// SECTION: Main app
shortId.seed(+SEED);
app.use(bodyParser.json());
app.use(expressValidator());
app.use(device.capture({
  emptyUserAgentDeviceType: 'bot',
  unknownUserAgentDeviceType: 'bot'
}));

// new link route
app.get('/v0/new/link/', function (req, res) {
  req.assert('redirect', 'required').notEmpty().isURL();
  req.assert('context', 'required').notEmpty();

  if (req.validationErrors()) {
    return res.status(400).jsonp({error: 'Bad request'});
  }

  var link = BASE_ROUTE + shortId.generate();

  _db.insert({
    link: link,
    redirect: req.query.redirect,
    context: req.query.context
  }, function (err) {
    if (err) {
      return res.status(500).jsonp({error: 'Internal server error.'});
    }

    return res.jsonp({uri: link});
  });
});

// unique link and redirect route
app.get('/:id', function (req, res) {
  req.assert('id', 'required').matches(/[A-Za-z-_0-9]+/);

  if(req.validationErrors()) {
    return res.status(404).jsonp({error: 'Not found.'});
  }

  var search = BASE_ROUTE + req.params.id;

  _db.findOne({link: search}, function (err, result) {
    if (err) {
      return res.status(500).jsonp({error: 'Internal server error.'});
    }

    if (!result || !result.redirect) {
      return res.status(404).jsonp({error: 'Not found.'});
    }

    if (search === result.redirect) {
      return res.status(404).jsonp({error: 'Not found.'});
    }

    if (result.clicks) {
      result.clicks++;
    } else {
      result.clicks = 1;
    }

    var rawData = {
      ip: req.connection.remoteAddress,
      ua: req.headers['user-agent'],
      type: req.device.type
    };

    if (result.raw) {
      result.raw.clicks.push(rawData);
    } else {
      result.raw = {
        clicks: [rawData]
      };
    }

    _db.update({link: search}, result, function (err) {
      if (err) {
        console.log('Error saving clicks ' + JSON.stringify(result));
      }

      return res.redirect(url.format(result.redirect.toString()));
    });
  });
});

// TODO: deprecate/consolidate into the search route
// get by data route
app.get('/v0/link/', function (req, res) {
  req.assert('path', 'required').notEmpty().isURL();

  if (req.validationErrors()) {
    return res.status(400).jsonp({error: 'Bad request'});
  }

  _db.findOne({link: req.query.path}, {_id: 0}, function (err, result) {
    if (err) {
      return res.status(500).jsonp({error: 'Internal server error.'});
    }

    if (!result) {
      return res.jsonp({});
    }

    return res.jsonp(result);
  });
});

// match on context
app.get('/v0/search/', function (req, res) {
  req.assert('context', 'required').notEmpty();

  if (req.validationErrors()) {
    return res.jsonp([]);
  }

  var query = {context: { $regex: req.query.context }};

  _db.find(query, {_id: 0}).toArray(function (err, result) {
    if (err) {
      return res.status(500).jsonp({error: 'Internal server error.'});
    }

    return res.jsonp(result);
  });
});

process.on('message', function (message) {
  if (message === 'shutdown') {
    // TODO: gracefully exit instead of instant termination
    _db.close();
    process.exit(0);
  }
});

module.exports = app.listen(PORT, function () {
  if (process.send) {
    process.send('online');
  }

  console.log('server started on port: ' + PORT);
});
