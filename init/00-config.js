var port = process.env.CONTEXT_PORT || 8000;
var seed = process.env.CONTEXT_SEED || 1;
var domain = process.env.CONTEXT_DOMAIN || 'localhost'

if (process.env.NODE_ENV === 'test') {
  port = 8001;
}

var hostString = 'http://' + domain + ':' + port + '/';

if (+port === 80) {
  hostString = 'http://' + domain + '/';
}

// whitelist for routes we want to protect like signup
var whitelist = ['127.0.0.1'];

module.exports = {
  seed: seed,
  port: port,
  domain: domain,
  host_string: hostString,
  whitelist: whitelist
}
