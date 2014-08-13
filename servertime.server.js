////////////////////////// GET SERVER TIME DIFFERENCE //////////////////////////

Meteor.methods({
  'getServerTime': function() {
    return Date.now();
  }
});

// Unify client / server api
GroundDB.now = function() {
  return Date.now();
};

// WebApp.rawConnectHandlers.use("/_timesync",
//   function(req, res, next) {
//     // Never ever cache this, otherwise weird times are shown on reload
//     // http://stackoverflow.com/q/18811286/586086
//     res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//     res.setHeader("Pragma", "no-cache");
//     res.setHeader("Expires", 0);
//     res.end(Date.now().toString());
//   }
// );
