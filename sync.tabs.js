/////////////////////////// SYNC TABS METHODS DATABSE //////////////////////////

var syncDatabaseDelay = new _gDB.OneTimeout();

// Offline client only databases will sync a bit different than normal
// This function is a bit hard - but it works - optimal solution could be to
// have virtual method calls it would complicate things
_gDB._syncDatabase = function(name) {
  // We set a small delay in case of more updates within the wait
  syncDatabaseDelay.oneTimeout(function() {
    var collection = _gDB._groundDatabases[name];
//    if (collection && (collection.offlineDatabase === true || !Meteor.status().connected)) {
    if (collection) {
      // Add event hook
      self.emit('tabSync', 'database', name);
      // Hard reset database?
      var newDocs = _gDB._loadObject('db.' + name);
      if (newDocs) {

        collection.find().forEach(function(doc) {
          // Remove document
          collection._collection.remove(doc._id);
          // If found in new documents then hard update
          if (typeof newDocs[doc._id] !== 'undefined') {
            // Update doc
            collection._collection.insert(newDocs[doc._id]);
            delete newDocs[doc._id];
          }
        });
        _.each(newDocs, function (doc) {
          // insert doc
          collection._collection.insert(doc);
        });

      }
    }
  }, 150);
};

var syncMethodsDelay = new _gDB.OneTimeout();

// Syncronize tabs via method calls
_gDB._syncMethods = function() {
  // We are going to into reload, stop all access to localstorage
  _gDB._isReloading = true;
  // We are not master and the user is working on another tab, we are not in
  // a hurry to spam the browser with work, plus there are typically acouple
  // of db access required in most operations, we wait a sec?
  syncMethodsDelay.oneTimeout(function() {
    // Add event hook
    self.emit('tabSync', 'methods');
    // Resume methods
    _gDB._loadMethods();
    // Resume normal writes
    _gDB._isReloading = false;
  }, 500);
};

/////////////////////// LOAD CHANGES FROM OTHER TABS ///////////////////////////

// Make sure we have an addEventListener
if (typeof window.addEventListener !== 'undefined') {
    // Add support for multiple tabs
    window.addEventListener('storage', function(e) {
    // Data changed in another tab, it would have updated localstorage, I'm
    // outdated so reload the tab and localstorage - but we test the prefix on the
    // key - since we actually make writes in the localstorage feature test
    var prefixDatabaseRegEx = new RegExp('^' + _gDB._prefix + 'db.');

    // Method calls are delayed a bit for optimization
    if (e.key === _gDB._prefix + 'methods') {
      _gDB._syncMethods('mehods');
    }

    // Sync offline client only databases - These update instantly
    if (prefixDatabaseRegEx.test(e.key)) {
      _gDB._syncDatabase(e.key.replace(prefixDatabaseRegEx, ''));
    }
  }, false);
}
