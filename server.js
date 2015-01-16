'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var device = require('express-device');
var expressValidator = require('express-validator');
var router = require('./routes/router');
var passport = require('passport');
var config = require('./init/00-config');

app.use(bodyParser.json());
app.use(expressValidator());
app.use(device.capture({
  emptyUserAgentDeviceType: 'bot',
  unknownUserAgentDeviceType: 'bot'
}));

app.use(router);

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
