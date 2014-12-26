'use strict';

var request = require('supertest');
var supertestChai = require('supertest-chai');
var validator = require('validator');
var chai = require('chai');
chai.use(supertestChai.httpAsserts);
var _ = require('lodash');

var agent;
var server = require('../server');

var MongoClient = require('mongodb').MongoClient;
var _db;
var _links;

before(function (done) {
  agent = request.agent(server);

  MongoClient.connect('mongodb://localhost:27017/link-context-test', function (err, db) {
    if (err) {
      console.log('Error: Unable to connect to MongoDB');
    }

    _db = db;
    _links = db.collection('links');
    done();
  });
});

afterEach(function () {
  _links.drop();
});

after(function () {
  agent.app.close();
  _db.close();
});

describe('GET /:id', function () {
  it('should respond with 404 if :id contains invalid characters', function (done) {
    agent.get('/ab?#@**^').expect(404, done);
  });

  it('should respond with 404 if no match is found for link', function (done) {
    agent.get('/abcd123-_').expect(404, done);
  });

  it('should respond with 404 if match found but no valid redirect', function (done) {
    _links.insert({
      link: "http://localhost/abc123"
    }, function (err) {
      if (err) {
        done(err);
      }

      agent.get('/abc123').expect(404, done);
    });
  });

  it('should perform a temporary redirect, 302 on succss', function (done) {
    var destination = 'http://mytest.com';

    _links.insert({
      link: "http://localhost:8001/abc123",
      redirect: destination
    }, function (err) {
      if (err) {
        done(err);
      }

      agent.get('/abc123').expect(302, done);
    });
  });

  it('should redirect to the correct url stored against the link on success', function (done) {
    var destination = 'http://mytest.com/';

    _links.insert({
      link: "http://localhost:8001/abc123",
      redirect: destination
    }, function (err) {
      if (err) {
        done(err);
      }

      agent.get('/abc123').end(function (err, res) {
        chai.expect(res.headers.location).to.equal(destination);
        done();
      });
    });
  });
});

describe('GET /v0/new/link', function () {
  it('should respond with 400 if `redirect` parameter not provided', function (done) {
    agent.get('/v0/new/link/?context=something').expect(400, done);
  });

  it('should respond with 400 if `context` parameter is not provided', function (done) {
    agent.get('/v0/new/link/?redirect=http://test.com').expect(400, done);
  });

  it('should respond with 400 if no query parameters are provided', function (done) {
    agent.get('/v0/new/link/').expect(400, done)
  });

  it('should respond with a valid link on success', function (done) {
    agent.get('/v0/new/link/?context=something&redirect=http://example.com').end(function (err, res) {
      if (err) {
        done(err);
      }

      chai.expect(validator.isURL(res.body)).to.be.true;
      done();
    });
  });

  it('a valid link should have the domain as defined in server config', function (done) {
    agent.get('/v0/new/link/?context=something&redirect=http://example.com').end(function (err, res) {
      if (err) {
        done(err);
      }

      chai.expect(validator.contains(res.body, 'localhost')).to.be.true;
      done();
    });
  });

  it('should respond with 200 on success', function (done) {
    agent.get('/v0/new/link/?context=something&redirect=http://example.com').expect(200, done);
  });

  it('response should have Content-Type: application/json', function (done) {
    agent.get('/v0/new/link/?context=something&redirect=http://example.com').expect('Content-Type', /application\/json/, done);
  });
});

describe('GET /v0/search/', function () {
  it('should respond with empty array if `context` parameter not provided', function (done) {
    agent.get('/v0/search/').expect([], done);
  });

  it('should respond with array of results matching context', function (done) {
    var context = 'my test context';

    var testData = [
      { link: 'http://abc', redirect: 'http://bcd.com', context: context, 'clicks': 7},
      { link: 'http://localhost/asd42_', redirect: 'http://wow.com', context: context},
      { link: 'http://localhost/3252sff', redirect: 'http://foo.co.uk', context: context, clicks: 7, other_stat: 900}
    ];

    var expected = _.cloneDeep(testData);

    testData.push({ link: 'http://localhost/1432ss', redirect: 'http://hidden.com', context: 'not included', clicks: 1});

    _links.insert(testData, function (err) {
      if (err) {
        done(err);
      }

      agent.get('/v0/search/?context=' + context).end(function (err, result) {
        chai.expect(result.body).to.eql(expected);
        done();
      });
    });
  });

  it('should still respond with array if only one match is found', function (done) {
    var context = 'my test context';

    var testData = [
      { link: 'http://abc', redirect: 'http://bcd.com', context: 'not included', 'clicks': 7},
      { link: 'http://localhost/asd42_', redirect: 'http://wow.com', context: 'not included'},
      { link: 'http://localhost/3252sff', redirect: 'http://foo.co.uk', context: 'not included', clicks: 7, other_stat: 900}
    ];

    var expected = { link: 'http://localhost/1432ss', redirect: 'http://hidden.com', context: context, clicks: 1};

    testData.push(_.cloneDeep(expected));

    _links.insert(testData, function (err) {
      if (err) {
        done(err);
      }

      agent.get('/v0/search/?context=' + context).end(function (err, result) {
        chai.expect(result.body.length).to.equal(1);
        chai.expect(result.body[0]).to.eql(expected);
        done();
      });
    });
  });

  it('should match context as a regex', function (done) {
    var common = 'woah';

    var testData = [
     { link: 'http://abc', redirect: 'http://bcd.com', context: 'woah', 'clicks': 7},
     { link: 'http://localhost/asd42_', redirect: 'http://wow.com', context: '+1=woah?//'},
     { link: 'http://localhost/3252sff', redirect: 'http://foo.co.uk', context: 'almost woah not', clicks: 7, other_stat: 900}
    ];

    var expected = _.cloneDeep(testData);

    _links.insert(testData, function (err) {
      if (err) {
       done(err);
      }

      agent.get('/v0/search/?context=' + common).end(function (err, result) {
        chai.expect(result.body).to.eql(expected);
        done();
      });
    });
  });

  it('should not include the _id in the returned results', function (done) {
    var context = 'my test context';

    var testData = [
     { link: 'http://abc', redirect: 'http://bcd.com', context: 'not included', 'clicks': 7},
     { link: 'http://localhost/asd42_', redirect: 'http://wow.com', context: 'not included'},
     { link: 'http://localhost/3252sff', redirect: 'http://foo.co.uk', context: 'not included', clicks: 7, other_stat: 900}
    ];

    var expected = { link: 'http://localhost/1432ss', redirect: 'http://hidden.com', context: context, clicks: 1};

    testData.push(_.cloneDeep(expected));

    _links.insert(testData, function (err) {
      if (err) {
        done(err);
      }

      agent.get('/v0/search/?context=' + context).end(function (err, result) {
        chai.expect(result.body[0]._id).to.not.exist;
        done();
      });
    });
  });
});
