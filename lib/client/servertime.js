////////////////////////// GET SERVER TIME DIFFERENCE //////////////////////////
import localforage from 'localforage';

ServerTime = {};

ServerTime._serverTimeDiff = 0; // Time difference in ms

ServerTime.now = function() {
  return Date.now() + ServerTime._serverTimeDiff;
};

// At server startup we figure out the time difference between server and
// client time - this includes lag and timezone

// Use the ground store to handle storage for us
var _storage = localforage.createInstance({
  name: 'ServerTime',
  version: 1.0,
});

// Initialize the ServerTime._serverTimeDiff
_storage.getItem('diff', function(err, time) {
  if (!err) {

    // Set the time
    ServerTime._serverTimeDiff = time || 0;
  }

});

// Call the server method an get server time
// XXX: Use http call instead creating less overhead
Meteor.call('getServerTime', function(error, result) {
  if (!error) {
    // Update our server time diff
    ServerTime._serverTimeDiff = result - Date.now();// - lag or/and timezone
    // Update the localstorage
    _storage.setItem('diff', ServerTime._serverTimeDiff, function(/* err, result */) {
      // XXX:
    });
  }
}); // EO Server call

export default ServerTime;
