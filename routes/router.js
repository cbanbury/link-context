var express = require('express');
var router = express.Router();

var api = require('./v0/api');

router.get('/v0/new/link', api.newLink);
router.get('/v0/link/', api.findLink);
router.get('/v0/search/', api.search);
router.put('/v0/signup/', api.signup);

router.get('/:id', api.base);

module.exports = router;
