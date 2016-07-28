var forever = require('forever-monitor');
var child = new (forever.Monitor)('dispatch.js', {
  silent: false,
  args: ['--color']
});

child.start();
