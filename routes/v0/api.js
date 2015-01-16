'use strict';
var shortId = require('shortid');
var url = require('url');
var _ = require('lodash');
var config = require(process.env.PWD + '/init/00-config');
shortId.seed(+config.seed);

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

var api = module.exports = {};

/**
 * Method: GET
 * Creates a new short url that redirects as per query params
 * @param {string} redirect The final destination url when someone clicks on the short url
 * @param {string} context The contexual information we want to bind to this link
 */
api.newLink = function(req, res) {
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
};

/**
 * Method: GET
 * TODO: deprecate in v1 and consolidate into search route
 * Searches for a link matching the exact short url
 * @param {string} path The short url to search for
 */
api.findLink = function(req, res) {
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
};

/**
 * Method: GET
 * Perform regex matching search around a given context, returns an
 * array of objects including click data on match.
 * @param {string} context The context to search for
 */
api.search = function(req, res) {
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
};

/**
 * Method: PUT
 * Creates a new user. This is a protected route and can only be called
 * from an ip from within the whitelist (see config).
 * @param {string} username The username
 * @param {string} password The password hash to store
 */
api.signup = function(req, res) {
  req.checkBody('username', 'required').notEmpty();
  req.checkBody('password', 'required').notEmpty();

  // TODO: find a more convenient way to handle this.
  if (!_.contains(config.whitelist, req.ip)) {
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
};

/**
 * Method: GET
 * Performs the actual redirect when there is a click on the short url
 * TODO: Not part of the api so should be moved
 */
api.base = function(req, res) {
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
}
