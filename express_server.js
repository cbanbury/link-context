'use strict';

var express = require('express');
var app = express();
var shortId = require('shortid');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

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
var SEED = process.env.CONTEXT_SEED || 1;
var PORT = process.env.CONTEXT_PORT || 8000;
var DOMAIN = process.env.CONTEXT_DOMAIN || 'localhost';

var BASE_ROUTE = 'http://' + DOMAIN + ':' + PORT + '/';

if (+PORT === 80) {
  BASE_ROUTE = 'http://' + DOMAIN + '/';
}

// SECTION: Main app
shortId.seed(+SEED);
app.use(bodyParser.json());
app.use(expressValidator())

process.on('message', function (message) {
  if (message === 'shutdown') {
    // TODO: gracefully exit instead of instant termination
    process.exit(0);
  }
});

// new link route
app.get('/create/new/link/', function (req, res) {
  req.assert('redirect', 'required').notEmpty().isURL();
  req.assert('context', 'required').notEmpty();

  if (req.validationErrors()) {
    return res.sendStatus(400);
  }

  var link = BASE_ROUTE + shortId.generate();

  _db.insert({
    link: link,
    redirect: req.query.redirect,
    context: req.query.context
  }, function (err) {
    if (err) {
      return res.sendStatus(500);
    }

    return res.send(link);
  });
});

app.get('/:id', function () {

});

app.get('/link/', function () {

});

app.get('/search/', function () {

});

var server = app.listen(PORT, function () {
  console.log('server started on port: ' + PORT);
});
