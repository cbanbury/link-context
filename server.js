'use strict';

var express = require('express');
var app = express();
var shortId = require('shortid');
var bodyParser = require('body-parser');
var device = require('express-device');
var expressValidator = require('express-validator');
var url = require('url');

var passport = require('passport');
var _ = require('lodash');

// SECTION: Database configuration
var MongoClient = require('mongodb').MongoClient;

var _db;
var _links;
var _users;

var connectionString = 'mongodb://localhost:27017/asc';

if (process.env.NODE_ENV === 'test') {
  connectionString = 'mongodb://localhost:27017/link-context-test'
}

MongoClient.connect(connectionString, function (err, db) {
  if (err) {
    console.log('Error: Unable to connect to MongoDB');
  }

  _db = db;
  _links = db.collection('links');
  _users = db.collection('users');
});

// SECTION: App config
var config = require('./init/00-config');

// whitelist for routes we want to protect like signup
var whitelist = ['127.0.0.1'];

// SECTION: Main app
shortId.seed(+config.seed);
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

  var link = config.host_string + shortId.generate();

  _links.insert({
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

  var search = config.host_string + req.params.id;

  _links.findOne({link: search}, function (err, result) {
    if (err) {
      return res.status(500).jsonp({error: 'Internal server error.'});
    }

    if (!result || !result.redirect) {
      return res.status(404).jsonp({error: 'Not found.'});
    }

    if (search === result.redirect) {
      return res.status(404).jsonp({error: 'Not found.'});
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

    // only count clicks that are not from a bot
    result.clicks = result.raw.clicks.filter(function (item) {
      return item.type !== 'bot';
    }).length;

    _links.update({link: search}, result, function (err) {
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

  _links.findOne({link: req.query.path}, {_id: 0}, function (err, result) {
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

  _links.find(query, {_id: 0}).toArray(function (err, result) {
    if (err) {
      return res.status(500).jsonp({error: 'Internal server error.'});
    }

    return res.jsonp(result);
  });
});

// user registration
app.put('/v0/signup/', function (req, res) {
  req.checkBody('username', 'required').notEmpty();
  req.checkBody('password', 'required').notEmpty();

  // TODO: find a more convenient way to handle this.
  if (!_.contains(whitelist, req.ip)) {
    return res.status(404);
  }

  if (req.validationErrors()) {
    return res.status(400).jsonp({ error: 'Bad request'});
  }

  _users.insert({_id: req.body.username, pass_hash: req.body.password}, function (err) {
    if (err) {
      return res.status(400).jsonp({error: 'Bad request'});
    }

    return res.status(200).jsonp({message: 'user created successfully', username: req.body.username});
  });
});

app.post('/v0/login/', function (req, res) {
  req.checkBody('username', 'required').notEmpty();
  req.checkBody('password', 'required').notEmpty();
});

process.on('message', function (message) {
  if (message === 'shutdown') {
    // TODO: gracefully exit instead of instant termination
    _db.close();
    process.exit(0);
  }
});

module.exports = app.listen(config.port, function () {
  if (process.send) {
    process.send('online');
  }

  console.log('server started on port: ' + config.port);
});
