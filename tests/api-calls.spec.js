'use strict';

var request = require('supertest');
var supertestChai = require('supertest-chai');
var validator = require('validator');
var chai = require('chai');
chai.use(supertestChai.httpAsserts);

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

after(function () {
  agent.app.close();
  _links.drop();
  _db.close();
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

describe('GET /{id}', function () {
  it('should accept only valid shortid characters for {id}', function () {

  });

  it('should respond with 500 if unable to query database', function () {

  });

  it('should respond with 404 if no match is found for link', function () {

  });

  it('should respond with 404 if match found but no valid redirect', function () {

  });

  it('should redirect to the correct url stored against the link on success', function () {

  });

  it('should still redirect if unable to update the number of clicks', function () {

  });
});

describe('GET /search/', function () {
  it('should respond with empty array if `context` parameter not provided', function () {
  });

  it('should respond with 500 if unable to query database', function () {

  });

  it('should respond with array of results matching context', function () {

  });

  it('should match context as a regex search anywhere in the context', function () {

  });

  it('should not include the _id in the returned results', function () {

  });
});
