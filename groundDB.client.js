"use strict";

/*

GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/

////////////////////////////// LOCALSTORAGE ////////////////////////////////////

// Well, I'm still using console.log
window.console = (window && window.console && window.console.log)?
        window.console: {
  log: function() {}
};

// Status of app reload
var _isReloading = false;

// Returns the localstorage if its found and working
// TODO: check if this works in IE
// could use Meteor._localStorage - just needs a rewrite
var _storage = function() {
  var storage,
      fail,
      uid;
  try {
    uid = Random.id();
    (storage = window.localStorage).setItem(uid, uid);
    fail = (storage.getItem(uid) !== uid);
    storage.removeItem(uid);
    if (fail) {
      storage = false;
    }
  } catch(e) {}

  return storage;
};

// get our storage if found
var storage = _storage();

var _prefixGroundDB = 'groundDB.';

// Add a correct prefix for groundDB
var _getGroundDBPrefix = function(suffix) {
  // Should we support multiple users on multiple tabs namespacing data
  // in localstorage by current userId?
  //return prefix + ((Meteor.userId())?Meteor.userId()+'.':'') + suffix;
  return _prefixGroundDB + suffix;
};

// save object into localstorage
var _saveObject = function(name, object) {
  if (storage && _isReloading === false) {
    var cachedDoc = EJSON.stringify(object);

    try {
      storage.setItem(_getGroundDBPrefix(name), cachedDoc);
    } catch (e) {
      GroundDB.onQuotaExceeded();
    }
  }
};

// get object from localstorage, retur null if not found
var _loadObject = function(name) {
  if (storage) {
    var cachedDoc = storage.getItem(_getGroundDBPrefix(name));
    if (cachedDoc && cachedDoc.length > 0 && cachedDoc !== 'undefined') {
      var cachedDocObject = EJSON.parse(cachedDoc);
      return cachedDocObject;
    }
  }
  return null;
};

//////////////////////////////// GROUND DATABASE ///////////////////////////////

// Add a pointer register
var _groundDatabases = {};

// @export GroundDB
window.GroundDB = function(name, options) {
// TODO: change when linker is official

  // Inheritance Meteor Collection can be set by options.collection
  // Accepts smart collections by Arunoda Susiripala
  var self;
  // If name is string or null then assume a normal Meteor.Collection
  if (name === ''+name || name === null || typeof name === 'undefined') {
    // We instanciate a new meteor collection, let it handle undefined
    self = new Meteor.Collection(name, options);
  } else {
    // User set a collection in options
    if (name instanceof Meteor.Collection) {
      self = name;
    } else {
      if (name._localCollection instanceof Meteor.Collection) {
        // We are in a smart collection
        self = name._localCollection;
        self.name = name.name;
      } else {
        // self not set, throw an error
        throw new Error('GroundDB got an invalid name or collection');
      }
    }
  }

  // Is this an offline database?
  self.offlineDatabase = false;

  // Initialize collection name
  self.name = (self.name)? self.name : self._name;

  if (self.name === null && typeof options === 'string' && options !== '') {
    // ok we have a named offline only database
    self.name = options;
    self.offlineDatabase = true;
  }

  // Add to pointer register
  _groundDatabases[ self.name ] = self;

  // We have to overwrite the standard Meteor code - It throws an Error when
  // Documents allready in the docs. So we handle the conflict instead...
  // TODO: Could this be cleaned up?
  ////////// BEGIN mongo-livedata/collection.js 103
  if (self._connection && self._connection._stores[ self.name ]) {
    self._connection._stores[ self.name ].update = function (msg) {
      var mongoId = Meteor.idParse(msg.id);
      var doc = self._collection.findOne(mongoId);
      // Is this a "replace the whole doc" message coming from the quiescence
      // of method writes to an object? (Note that 'undefined' is a valid
      // value meaning "remove it".)
      if (msg.msg === 'replace') {
        var replace = msg.replace;
        if (!replace) {
          if (doc) {
            self._collection.remove(mongoId);
          }
        } else if (!doc) {
          self._collection.insert(replace);
        } else {
          // XXX check that replace has no $ ops
          self._collection.update(mongoId, replace);
        }
        return;
      } else if (msg.msg === 'added') {

        if (doc) {
          // Solve the conflict - server wins
          // Then remove the client document
          self._collection.remove(doc._id);
        }
        // And insert the server document
        self._collection.insert(_.extend({_id: mongoId}, msg.fields));

      } else if (msg.msg === 'removed') {
        if (doc) {
          // doc found - remove it
          self._collection.remove(mongoId);
        } else {
          throw new Error("Expected to find a document present for removed");
        }

      } else if (msg.msg === 'changed') {
        if (!doc) {
          throw new Error("Expected to find a document to change: " + mongoId);
        } else {
          if (!_.isEmpty(msg.fields)) {
            var modifier = {};
            _.each(msg.fields, function (value, key) {
              if (value === undefined) {
                if (!modifier.$unset) {
                  modifier.$unset = {};
                }
                modifier.$unset[key] = 1;
              } else {
                if (!modifier.$set) {
                  modifier.$set = {};
                }
                modifier.$set[key] = value;
              }
            });
            self._collection.update(mongoId, modifier);
          }
        }
      } else {
        throw new Error("I don't know how to deal with this message");
      }

    };
  }
  ///////// EO mongo-livedata/collection.js 153

  self._databaseLoaded = false;

  // We dont trust the localstorage so we make sure it doesn't contain
  // duplicated id's
  self._checkDocs = function(a) {
    var c = {};
    // We create c as an object with no duplicate _id's
    for (var i = 0, keys = Object.keys(a); i < keys.length; i++) {
      var key = keys[i];
      var doc = a[key];
      // set value in c
      c[key] = doc;
    }
    return c;
  };

  // Bulk Load database from local to memory
  self._loadDatabase = function() {
    // Then load the docs into minimongo
    GroundDB.onResumeDatabase(self.name);

    // Load object from localstorage
    var docs = _loadObject('db.' + self.name);

    // Initialize client documents
    _.each(self._checkDocs( (docs) ? docs : {} ), function(doc) {
      var exists = self._collection.findOne({ _id: doc._id });
      // If collection is populated before we get started then the data in
      // memory would be considered latest therefor we dont load from local
      if (!exists) {
        self._collection.insert(doc);
      }
    });

    self._databaseLoaded = true;
  };

  // Bulk Save database from memory to local, meant to be as slim, fast and
  // realiable as possible
  self._saveDatabase = function() {
    // If data loaded from localstorage then its ok to save - otherwise we
    // would override with less data
    if (self._databaseLoaded) {
      GroundDB.onCacheDatabase(self.name);
      // Save the collection into localstorage
      _saveObject('db.' + self.name, self._collection.docs);
    }
  };

  // Observe all changes and rely on the less agressive reactive system for
  // providing a reasonable update frequens
  Deps.autorun(function() {
    // Observe changes
    self.find().fetch();
    // Save on changes
    self._saveDatabase();
  });

  // Load the database as soon as possible
  self._loadDatabase();

  return self;
};

///////////////////////////////// EVENTS ///////////////////////////////////////

// This is an overridable method for hooking on to the GroundDB events

GroundDB.onQuotaExceeded = function() {
  throw new Error('Quota exceeded!');
};

GroundDB.onResumeDatabase = function(name) {
  console.log('Resume database: ' + name);
};

GroundDB.onResumeMethods = function() {
  console.log('Resume outstanding methods');
};

GroundDB.onMethodCall = function(methodCall) {
  console.log('Method call ' + methodCall._message.method);
};

GroundDB.onCacheDatabase = function(name) {
  console.log('Cache database: ' + name);
};

GroundDB.onCacheMethods = function() {
  console.log('Cache methods');
};

GroundDB.onTabSync = function(key) {
  console.log('Sync tabs - Cache is updated by: ' + key);
};

GroundDB.onCorruptedClientMemory = function() {
  // Let error be thrown an visible for 5sec then reload app
  Meteor.setTimeout(function() {
    window.location.reload();
  }, 5000);
  // Throw an error, cannot continue - This should never happen
  throw new Error('Outstanding methods is corrupted in memory - '+
          'Reloading app in 5sec');
};

///////////////////////////// RESUME METHODS ///////////////////////////////////

// Is methods resumed?
var _methodsResumed = false;

// Get a nice array of current methods
var _getMethodsList = function(clientMemory) {
  // Array of outstanding methods
  var methods = [];

  // Convert the data into nice array
  _.each(clientMemory, function(method) {
    if (method._message.method !== 'login') {
      // Dont cache login calls - they are spawned pr. default when accounts
      // are installed
      methods.push({
        // Format the data
        method: method._message.method,
        args: method._message.params,
        options: { wait: method._wait }
      });
      GroundDB.onMethodCall(method);
    }
  });

  return methods;
};

// Extract only newly added methods from localstorage
var _getMethodUpdates = function(newMethods, clientMemory) {
  var result = [];
  if (newMethods && newMethods.length > 0) {
    // Get the old methods allready in memory
    // We could have done an optimized slice version or just starting at
    // oldMethods.length, but this tab is not in focus
    var oldMethods = _getMethodsList(clientMemory);
    // Iterate over the new methods, old ones should be ordered in beginning of
    // newMethods we do a simple test an throw an error if thats not the case
    for (var i=0; i < newMethods.length; i++) {

      if (i < oldMethods.length) {
        // Do a hard slow test to make sure all is in sync
        if (EJSON.stringify(oldMethods[i]) !== EJSON.stringify(newMethods[i])) {
          // The client data is corrupted, throw error or force the client to
          // reload, does not make sense to continue?
          GroundDB.onCorruptedClientMemory();
        }
      } else {
        // Ok out of oldMethods this is a new method call
        result.push(newMethods[i]);
      }
    } // EO for iteration
  } // EO check newMethods

  // return the result
  return result;
};

// Offline client only databases will sync a bit different than normal
// This function is a bit hard - but it works - optimal solution could be to
// have virtual method calls it would complicate things
var _syncDatabase = function(name) {
  var collection = _groundDatabases[name];
  if (collection && collection.offlineDatabase) {
    // Hard reset database?
    var newDocs = _loadObject('db.' + name);
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
};

var _reloadTimeoutId = null;

// Syncronize tabs via method calls
var _syncMethods = function() {
  // We are going to into reload, stop all access to localstorage
  _isReloading = true;
  // We are not master and the user is working on another tab, we are not in
  // a hurry to spam the browser with work, plus there are typically acouple
  // of db access required in most operations, we wait a sec?
  if (_reloadTimeoutId !== null) {
    // Stop the current timeout - we have updates
    Meteor.clearTimeout(_reloadTimeoutId);
  }

  _reloadTimeoutId = Meteor.setTimeout(function() {
    // Ok, we reset reference and go to work
    _reloadTimeoutId = null;

    // Resume methods
    _loadMethods();

    // Resume normal writes
    _isReloading = false;
  }, 200);
};

// load methods from localstorage and resume the methods
var _loadMethods = function() {
  // Load methods from local
  var methods = _loadObject('methods');

  // We are only going to submit the diff
  methods = _getMethodUpdates(methods, Meteor.default_connection._methodInvokers);

  // If any methods outstanding
  if (methods) {
    // Iterate over array of methods
    //_.each(methods, function(method) {
    while (methods.length > 0) {
      // FIFO buffer
      var method = methods.shift();

      // parse "/collection/command" or "command"
      var params = method.method.split('/');
      var command = (params.length > 2)?params[2]:params[1];
      var collection = (params.length > 2)?params[1]:'';
      // TODO: would have been nicer if SmartCollection used same naming as
      // Meteor
      params = ''+params;
      paramIndex = 0;
      if (params === '_si_' || params === '_su_' || params === '_sr_') {
        // Get collection from SmartCollection call
        command = params;
        collection = method.args[0];
        paramIndex++;
      }

      // Do work on collection
      if (collection !== '') {
        // we are going to run an simulated insert - this is allready in db
        // since we are running local, so we remove it from the collection first
        if (_groundDatabases[collection]) {
          // The database is registered as a ground database
          var mongoId = Meteor.idParse((method.args && method.args[paramIndex])?
                  method.args[paramIndex]._id || method.args[paramIndex]:'');

          // Get the document on the client - if found
          var doc = _groundDatabases[collection]._collection.findOne(mongoId);

          if (doc) {
            // document found
            // This is a problem: insert stub simulation, would fail so we
            // remove the added document from client and let the method call
            // re-insert it in simulation
            if (command === 'insert') {
              // Remove the item from ground database so it can be correctly
              // inserted
              _groundDatabases[collection]._collection.remove(mongoId);
            } // EO handle insert
            // Add tab support in SmartCollections
            if (command === '_su_') { // TODO: Warn if using $inc or $dec?
              // params 0:id 1:modif
              _groundDatabases[collection]._collection.update({ _id: mongoId },
                      method.args[paramIndex+1]);
            }
            if (command === '_sr_') {
              // param 0:id
              _groundDatabases[collection]._collection.remove(method.args[paramIndex]);
            }
          } else { // EO Else no doc found in client database
            // Add tab support in SmartCollections
            // param 0:doc
            if (command === '_si_') {
              _groundDatabases[collection]._collection.insert(method.args[paramIndex]);
            }
          }
        } // else collection would be a normal database
      } // EO collection work

      // Add method to connection
      Meteor.default_connection.apply(
              method.method, method.args, method.options);
    } // EO while methods
  } // EO if stored outstanding methods

  // Dispatch methods loaded event
  _methodsResumed = true;
  GroundDB.onResumeMethods();
}; // EO load methods


// Save the methods into the localstorage
var _saveMethods = function() {
  if (_methodsResumed) {
    GroundDB.onCacheMethods();

    // Save outstanding methods to localstorage
    _saveObject('methods', _getMethodsList());
  }
};

/////////////////////// ADD TRIGGERS IN LIVEDATACONNECTION /////////////////////

// Modify _LivedataConnection, well just minor
_.extend(Meteor._LivedataConnection.prototype, {
  _super: {
    apply: Meteor._LivedataConnection.prototype.apply,
    _outstandingMethodFinished:
    Meteor._LivedataConnection.prototype._outstandingMethodFinished
  },
  // Modify apply
  apply: function(/* arguments */) {
    var self = this;
    // Call super
    self._super.apply.apply(self, arguments);
    // Save methods
    _saveMethods();
  },
  // Modify _outstandingMethodFinished
  _outstandingMethodFinished: function() {
    var self = this;
    // Call super
    self._super._outstandingMethodFinished.apply(self);
    // We save current status of methods
    _saveMethods();
  }
});

//////////////////////////// STARTUP METHODS RESUME ////////////////////////////
Meteor.startup(function() {
  // Wait some not to conflict with accouts login
  // TODO: Do we have a better way, instead of depending on time should depend
  // on en event.
  Meteor.setTimeout(function() {
    _loadMethods();
  }, 500);
});

/////////////////////// LOAD CHANGES FROM OTHER TABS ///////////////////////////

// Add support for multiple tabs
window.addEventListener('storage', function(e) {
  // Data changed in another tab, it would have updated localstorage, I'm
  // outdated so reload the tab and localstorage - but we test the prefix on the
  // key - since we actually make writes in the localstorage feature test
  var prefixMethodRegEx = new RegExp('^' + _prefixGroundDB + 'method');
  var prefixDatabaseRegEx = new RegExp('^' + _prefixGroundDB + 'db.');
  // Make sure its a prefixed change
  if (prefixMethodRegEx.test(e.key) || prefixDatabaseRegEx.test(e.key) ) {
    GroundDB.onTabSync(e.key);

    // Method calls are delayed a bit for optimization
    if (prefixMethodRegEx.test(e.key)) {
      _syncMethods();
    }

    // Sync offline client only databases - These update instantly
    if (prefixDatabaseRegEx.test(e.key)) {
      _syncDatabase(e.key.replace(prefixDatabaseRegEx, ''));
    }
  }
}, false);
