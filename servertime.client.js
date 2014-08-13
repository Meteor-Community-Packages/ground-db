////////////////////////// GET SERVER TIME DIFFERENCE //////////////////////////

_gDB._serverTimeDiff = 0; // Time difference in ms

if (_gDB.storage) {
  // Initialize the _gDB._serverTimeDiff
  _gDB._serverTimeDiff = (1*_gDB.storage.getItem(_gDB._prefix+'timeDiff')) || 0;
  // At server startup we figure out the time difference between server and
  // client time - this includes lag and timezone
  Meteor.startup(function() {
    // Call the server method an get server time
    Meteor.call('getServerTime', function(error, result) {
      if (!error) {
        // Update our server time diff
        _gDB._serverTimeDiff = result - Date.now();// - lag or/and timezone
        // Update the localstorage
        _gDB.storage.setItem(_gDB._prefix + 'timeDiff', _gDB._serverTimeDiff);
      }
    }); // EO Server call
  });
}


// Public API
GroundDB.now = function() {
  return Date.now() + _gDB._serverTimeDiff;
};



// var updateOffset = function() {
//   var t0;
//   t0 = Date.now();
//   HTTP.get("/_timesync", function(err, response) {
//     var t3 = Date.now(); // Grab this now
//     if (err) {
//       //  We'll still use our last computed offset if is defined
//       Meteor._debug("Error syncing to server time: ", err);
//       if (++attempts <= maxAttempts)
//         Meteor.setTimeout(TimeSync.resync, 1000);
//       else
//         Meteor._debug("Max number of time sync attempts reached. Giving up.");
//       return;
//     }

//     attempts = 0; // It worked

//     var ts = parseInt(response.content);
//     SyncInternals.offset = Math.round(((ts - t0) + (ts - t3)) / 2);
//     SyncInternals.roundTripTime = t3 - t0; // - (ts - ts) which is 0
//     SyncInternals.offsetDep.changed();
//   });
// };
