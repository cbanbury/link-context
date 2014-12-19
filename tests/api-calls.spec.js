'use strict';

var request = require('supertest');
var supertestChai = require('supertest-chai');

var chai = require('chai');
chai.use(supertestChai.httpAsserts);

describe.skip('GET /create/new/link', function () {

  it('should respond with 400 if `redirect` parameter not provided', function () {

  });

  it('should respond with 400 if `context` parameter is not provided', function () {

  });

  it('should respond with 400 if no query parameters are provided', function () {

  });

  it('should respond with 500 if newly created link cannot be saved', function () {

  });

  it('should respond with a valid link on success', function () {

  });

  it('a valid link should begin with http://', function () {

  });

  it('a valid link should not include the port for port 80', function () {

  });

  it('a valid link should have the domain as defined in server config', function () {

  });

  it('a valid link should include a short id', function () {

  });

  it('a valid link should be return as type text', function () {

  });

  it('should respond with 200 on success', function () {

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
