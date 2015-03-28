var assert  = require('assert');
var request = require('supertest');
var http    = require('http');

var quesadilla = require('../');

suite('server');

var server;

test('setup normal http server', function(done) {
  server = http.createServer(quesadilla(__dirname));
  server.listen(done);
});

test('basic without express', function(done) {
  request(server)
    .get('/style.css')
    .end(function(err, res) {
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['content-type'], 'text/css');
      done();
    });
});

test('handle sass errors', function(done) {
  request(server)
    .get('/error.css')
    .end(function(err, res) {
      assert.equal(res.statusCode, 500);
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.ok(/error/.test(res.text));
      done();
    });
});

test('handle missing file', function(done) {
  request(server)
    .get('/missing.css')
    .end(function(err, res) {
      assert.equal(res.statusCode, 404);
      assert.equal(res.headers['content-type'], 'text/plain');
      assert.equal(res.text, 'Not Found');
      done();
    });
});