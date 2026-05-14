try {
  require('./server.js');
} catch(e) {
  console.log('ERROR:', e.message);
  console.log('STACK:', e.stack);
}
