"use strict";

/*

GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/
///////////////////////////////// TEST SCOPE ///////////////////////////////////

_gDB = {};

// Map connection
_gDB.connection = Meteor.connection || Meteor.default_connection;

// Map parseId function
_gDB.idParse = function(id) {
  console.log('ID:', id);
  return LocalCollection && LocalCollection._idParse(id) ||
        Meteor.idParse(id);
};
// new Meteor.Collection.ObjectID(hexString)

// State of all subscriptions in meteor
_gDB.subscriptionsReady = false;
_gDB.subscriptionsReadyDeps = new Deps.Dependency();

////////////////////////////// LOCALSTORAGE ////////////////////////////////////

// Well, I'm still using console.log
window.console = (window && window.console && window.console.log)?
        window.console: {
  log: function() {}
};

// Status of app reload
_gDB._isReloading = false;

// Returns the localstorage if its found and working
// TODO: check if this works in IE
// could use Meteor._localStorage - just needs a rewrite
_gDB._storage = function() {
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
_gDB.storage = _gDB._storage();

_gDB._prefix = 'groundDB.';

// Add a correct prefix for groundDB
_gDB._getGroundDBPrefix = function(suffix) {
  // Should we support multiple users on multiple tabs namespacing data
  // in localstorage by current userId?
  //return prefix + ((Meteor.userId())?Meteor.userId()+'.':'') + suffix;
  return _gDB._prefix + suffix;
};

// save object into localstorage
_gDB._saveObject = function(name, object) {
  var self = this;
  if (_gDB.storage && _gDB._isReloading === false) {
  console.log('Save object', object);

    var cachedDoc = JSON.stringify(object && EJSON.minify(object));
    try {
      _gDB.storage.setItem(_gDB._getGroundDBPrefix(name), cachedDoc);
    } catch (e) {
      self.emit('quotaExceeded');
    }
  }
};

// get object from localstorage, retur null if not found
_gDB._loadObject = function(name) {
  // If storage is supported
  if (_gDB.storage) {
    // Then load cached document
    var cachedDoc = _gDB.storage.getItem(_gDB._getGroundDBPrefix(name));
    try {
      var cachedObject = JSON.parse(cachedDoc);
      return (cachedObject)? EJSON.maxify(cachedObject): null;
    } catch(err) {
      console.warn('GroundDB: Warning, could not parse data from storage');
    }
  }
  return null;
};

////////////////////////// MINIMIZE & MAXIMIZE DOCUMENTS ///////////////////////

_gDB.minify = function(bigDoc) {
  return EJSON.stringify(bigDoc);
};

_gDB.maxify = function(smallDoc) {
  return EJSON.parse(smallDoc);
};


/////////////////////////////// ONE TIME OUT ///////////////////////////////////

// This utillity function allows us to run a function - but if its run before
// time out delay then we stop and start a new timeout - delaying the execution
// of the function - TODO: have an option for n number of allowed delays before
// execution of timeout function limitNumberOfTimes
_gDB.OneTimeout = function() {
  var self = this;
  // Pointer to Meteor.setTimeout
  self._id = null;
  // Save the methods into the localstorage
  self.oneTimeout = function(func, delay) {
    self._count++;
    // If a timeout is in progress
    if (self._id !== null) {
      // then stop the current timeout - we have updates
      Meteor.clearTimeout(self._id);
    }
    // Spawn new timeout
    self._id = Meteor.setTimeout(function() {
      // Ok, we reset reference so we dont get cleared and go to work
      self._id = null;
      // Run function
      func();
      // Delay execution a bit
    }, delay);
  };
};

//////////////////////////////// GROUND DATABASE ///////////////////////////////

// Add a pointer register of grounded databases
_gDB._groundDatabases = {};

GroundDB = function(name, options) {
  var self = this;

  // Inheritance Meteor Collection
  Meteor.Collection.apply(self, arguments);

  // Inheritance EventEmitter
  _.extend(self, new EventEmitter());

  // Is this an offline client only database?
  self.offlineDatabase = !!(self._connection === null);

  // Initialize collection name
  self.name = (self._name)? self._name : 'null';


  /////// Finally got a name... and rigged

  // Add to pointer register
  _gDB._groundDatabases[ self.name ] = self;

  // prefixed supers container
  self.gdbSuper = {};

  // Overwrite the store update
  if (self._connection && self._connection._stores[ self.name ]) {
    // Set super
    self.gdbSuper.storeUpdate = self._connection._stores[ self.name ].update;
    // Overwrite
    self._connection._stores[ self.name ].update = function (msg) {
      console.log('GOT UPDATE');
      var mongoId = msg.id && _gDB.idParse(msg.id);
      var doc = msg.id && self._collection.findOne(mongoId);
      // We check that local loaded docs are removed before remote sync
      // otherwise it would throw an error
        // When adding and doc allready found then we remove it
      if (msg.msg === 'added' && doc) {
          // We mark the data as remotely loaded TODO:
          delete self._localOnly[mongoId];
          // Solve the conflict - server wins
          // Then remove the client document
          self._collection.remove(mongoId);
      }
      // If message wants to remove the doc but allready removed locally then
      // fix this before calling super
      if (msg.msg === 'removed' && !doc) {
        self._collection.insert({_id: mongoId});
      }
      // Call super and let it do its thing
      self.gdbSuper.storeUpdate(msg);
    };
  }

  // Flag true/false depending if database is loaded from local
  self.loaded = false;

  // Map local-only - this makes sure that localstorage matches remote loaded db
  self._localOnly = {};
  self.isCleanedUp = false;

  Deps.autorun(function() {
    if (GroundDB.ready() && !self.isCleanedUp) {
      // If all subscriptions have updated the system then remove all local only
      // data?
      // console.log('Clean up ' + self.name);
      self.isCleanedUp = true;
      self.removeLocalOnly();
    }
  });

  // One timeout pointer for database saves
  self.saveDatabaseDelay = new _gDB.OneTimeout();

  // Use reactivity to trigger saves
  var _gdbDataChanged = new Deps.Dependency();

  // trigger change
  var _gdbDatabaseChanged = function() {
    _gdbDataChanged.changed();
  };
  // Observe all changes and rely on the less agressive observer system for
  // providing a reasonable update frequens
  self.find().observe({
    'added': _gdbDatabaseChanged,
    'changed': _gdbDatabaseChanged,
    'removed': _gdbDatabaseChanged
  });

  // Run save database at data changes
  Meteor.autorun(function() {
    _gdbDataChanged.depend();
    self._saveDatabase();
  });

  // Load the database as soon as possible
  self._loadDatabase();
};


// Inheritance Meteor Collection
GroundDB.prototype = Object.create(Meteor.Collection.prototype);

// Inheritance EventEmitter
_.extend(GroundDB.prototype, Object.create(EventEmitter.prototype));

GroundDB.prototype.constructor = GroundDB;



// At some point we can do a remove all local-only data? Making sure that we
// Only got the same data as the subscription
GroundDB.prototype.removeLocalOnly = function() {
  var self = this;
  _.each(self._localOnly, function(isLocalOnly, id) {
    if (isLocalOnly) {
      self._collection.remove({ _id: id });
      delete self._localOnly[id];
    }
  });
};


GroundDB.prototype.invalidateDb = function() {
  var self = this;
  // We need to invalidate all listening queries
  _.each(self._collection.queries, function(query, i) {
    // This db has changed big time...
    query.changed();
  });
};


// We dont trust the localstorage so we make sure it doesn't contain
// duplicated id's - primary a problem i FF
GroundDB.prototype._checkDocs = function(a) {
  var self = this;
  var c = {};
  // // We create c as an object with no duplicate _id's
  // for (var i = 0, keys = Object.keys(a); i < keys.length; i++) {
  //   // Extract key/value
  //   var key = keys[i];
  //   var doc = a[key];
  //   // set value in c
  //   c[key] = doc;
  // }

  _.each(a, function(doc, key) {
    c[key] = doc;
  });
  return c;
};

// Bulk Load database from local to memory
GroundDB.prototype._loadDatabase = function() {
  self = this;
  // Then load the docs into minimongo
  self.emit('resumeDatabase', self.name);

  // Use local storage
  var localData = _gDB._loadObject('db.' + self.name);
  // Check if found at all
  if (localData) {
    // Load the data into the db
    self.setDb(localData);
    // Set the loaded flag
    // Setting database loaded, this allows minimongo to be saved into local
    self.loaded = true;
  }
};



// Bulk Save database from memory to local, meant to be as slim, fast and
// realiable as possible
GroundDB.prototype._saveDatabase = function() {
  var self = this;
  // If data loaded from localstorage then its ok to save - otherwise we
  // would override with less data
  if (self.loaded) {
    self.saveDatabaseDelay.oneTimeout(function() {
      // We delay the operation a bit in case of multiple saves - this creates
      // a minor lag in terms of localstorage updating but it limits the num
      // of saves to the database
      // Make sure our database is loaded
      self.emit('cacheDatabase', self.name);
      // Save the collection into localstorage
      _gDB._saveObject('db.' + self.name, self.getDb());
    }, 200);
  }
};


  // In our case we dont remove data... so we are just adding and updating
  GroundDB.prototype.mergeDb = function(remoteDb) {
    var self = this;
    // Keep a nice reference to the db map
    var localDb = self._collection._docs._map;

    // Pause the database observers
    self._collection.pauseObservers();

    // Iterate over the new data
    _.each(remoteDb, function(doc, id) {
      if (typeof localDb[id] == 'undefined') {
        // Conflict strategy - its simple latest data wins
        var theWinner = self.winner(localDb[id], doc);
        if (theWinner === 0) {
          // Nothing since local wins
        }
        // doc wins
        if (theWinner === 1) {
          localDb[id] = doc;
        }
        // Got a same object?
        if (theWinner === null) {
          // Copy from doc
          _.extend(localDb[id], doc);
        }
      } else {
        // no local found so we just set
        localDb[id] = doc;
      }

    });

    // Resume observers
    self._collection.resumeObservers();

  };

  GroundDB.prototype.getDb = function() {
    var self = this;
    return self._collection._docs._map;
  };

  GroundDB.prototype.setDb = function(obj) {
    var self = this;
    // Merge and Populate the db in memory db
    //self._collection._docs._map = obj;
    self.mergeDb(obj);
    // Set the loaded flag to true
    self.loaded = true;
    // Invalidate the whole thing
    self.invalidateDb();
  };

  GroundDB.prototype.reset = function() {
    var self = this;
    // Merge and Populate the db in memory db
    self._collection._docs._map = {};
    // Empty local storage
    localStorage && localStorage.removeItem(self.name);
    // Set the loaded flag to false
    self.loaded = false;
    // Invalidate the whole thing
    self.invalidateDb();
  };

  GroundDB.prototype.toString = function() {
    var self = this;
    return JSON.stringify(self.getDb());
  };

  GroundDB.prototype.fromString = function(s) {
    var self = this;
    // Check if s is string
    if (s !== ''+s) throw new Error('GroundDB fromString requires string as argument');
    try {
      // Convert string to object
      var obj = JSON.parse(s);
      // set the db object, make sure we got an object
      if (typeof obj === 'object') self.setDb(obj);
    } catch(err) {
      // Cant do much here...
    }
  };
