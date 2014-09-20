"use strict";

/*

GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/

///////////////////////////////// TEST BED /////////////////////////////////////
var GroundTestPackage = Package['ground:test'] || Package['ground-test'];
var GroundTest = GroundTestPackage && GroundTestPackage.GroundTest;

var inTestMode = !!GroundTest;
var inMainTestMode = (inTestMode && GroundTest.isMain);

var test = {
  log: function(/* arguments */) {
    if (inTestMode) {
      GroundTest.log.apply(GroundTest, _.toArray(arguments));
    }
  },
  debug: function(/* arguments */) {
    if (inTestMode) {
      GroundTest.debug.apply(GroundTest, _.toArray(arguments));
    }
  }
};

//////////////////////////////// GROUND DATABASE ///////////////////////////////

// Status of app reload
var _isReloading = false;

// Add a pointer register of grounded databases
var _groundDatabases = {};

GroundDB = function(name, options) {

  // Inheritance Meteor Collection can be set by options.collection
  // Accepts smart collections by Arunoda Susiripala
  var self = this;

  // Check if user used the "new" keyword
  if (!(self instanceof GroundDB))
    throw new Error('GroundDB expects the use of the "new" keyword');

  // Make sure we got some options
  options = options || {};

  // Either name is a Meteor collection or we create a new Meteor collection
  if (name instanceof _groundUtil.Collection) {
    self.collection = name;
  } else {
    self.collection = new _groundUtil.Collection(name, options);
  }

  // Set GroundDB prefix for localstorage
  var _prefix = options && options.prefix || '';

  // Set helper to connection
  self.connection = self.collection._connection;

  // Set helper to minimongo collection
  self._collection = self.collection._collection;

  // Is this an offline client only database?
  self.offlineDatabase = !!(self.connection === null);

  // Initialize collection name
  // XXX: Using null as a name is a problem - only one may be called null
  self.name = (self.collection._name)? self.collection._name : 'null';

  /////// Finally got a name... and rigged

  // Get the best storage available
  self.storage = Store.create({
    // We allow the user to set a prefix for the storage. Its mainly ment for
    // testing purposes, since the prefixing allows the tests to simulate more
    // complex scenarios
    name: _prefix + self.name,
    // Default version is 1.0 - if different from the one in storage record it
    // would trigger a migration
    version: options.version,
    // migration can be set to overwrite the default behaviour on the storage.
    // the options.migration should be a function(oldRecord, newRecord)
    // one can compare the oldRecord.version and the new version to ensure
    // correct migration steps.
    // That said the default behaviour simply clears the storage.
    migration: options.migration
  });

  // Rig an event handler
  self.eventemitter = new EventEmitter();

  // Add to pointer register
  _groundDatabases[ self.name ] = self;

  // We have to allow the minimongo collection to contain data before
  // subscriptions are ready
  self._hackMeteorUpdate();

  // Flag true/false depending if database is loaded from local
  self._databaseLoaded = false;

  // Map local-only - this makes sure that localstorage matches remote loaded db
  self._localOnly = {};

  // Flag marking if the local data is cleaned up to match the subscription
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
  self._saveDatabaseDelay = new _groundUtil.OneTimeout();

  // Reactive deps for when data changes
  var _dataChanged = new Deps.Dependency();

  var _changeData = function() { _dataChanged.changed(); };

  Deps.autorun(function() {
    // Depend on data change
    _dataChanged.depend();
    // Emit changed
    self.emit('changed');
  });

  // Observe all changes and rely on the less agressive observer system for
  // providing a reasonable update frequens
  self.find().observe({
    'added': _changeData,
    'changed': _changeData,
    'removed': _changeData
  });

  // Add listener, is triggered on data change
  self.addListener('changed', function(e) {

    // Store the database in store
    self._saveDatabase();

  });

  // Load the database as soon as possible
  self._loadDatabase();

  // We check to see if database sync is supported, if so we sync the database
  // if data has changed in other tabs
  if (self._syncDatabase) {

    // Listen for data changes
    self.storage.addListener('storage', function(e) {

      // Database changed in another tab - sync this db
      self._syncDatabase();

    });

  }

  // return self;
};

// TODO: change when linker is official
window.GroundDB = GroundDB;

/////
GroundDB.prototype._hackMeteorUpdate = function() {
  var self = this;

  // Super container
  var _super;

  // Overwrite the store update
  if (self.connection && self.connection._stores[ self.name ]) {
    // Set super
    _super = self.connection._stores[ self.name ].update;
    // Overwrite
    self.connection._stores[ self.name ].update = function (msg) {
      // console.log('GOT UPDATE');
      var mongoId = msg.id && _groundUtil.idParse(msg.id);
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
      _super(msg);
    };
  }
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

// Bulk Load database from local to memory
GroundDB.prototype._loadDatabase = function() {
  var self = this;
  // Then load the docs into minimongo

  // Emit event
  self.emit('resume');
  GroundDB.emit('resume', 'database', self);

  // Load object from localstorage
  self.storage.getItem('data', function(err, data) {
    if (err) {
      // XXX:
    } else {

      // Maxify the data
      var docs = data && MiniMax.maxify(data) || {};

      // Initialize client documents
      _.each(self._checkDocs( docs || {} ), function(doc) {
        // Test if document allready exists, this is a rare case but accounts
        // sometimes adds data to the users database, eg. if "users" are grounded
        var exists = self._collection.findOne({ _id: doc._id });
        // If collection is populated before we get started then the data in
        // memory would be considered latest therefor we dont load from local
        if (!exists) {
          if (!self.offlineDatabase) {
            // If online database then mark the doc as local only TODO:
            self._localOnly[doc._id] = true;
          }
          self._collection.insert(doc);
        }
      });


      // Setting database loaded, this allows minimongo to be saved into local
      self._databaseLoaded = true;

    }

  });
};

// Bulk Save database from memory to local, meant to be as slim, fast and
// realiable as possible
GroundDB.prototype._saveDatabase = function() {
  var self = this;
  // If data loaded from localstorage then its ok to save - otherwise we
  // would override with less data
  if (self._databaseLoaded && _isReloading === false) {
    self._saveDatabaseDelay.oneTimeout(function() {
      // We delay the operation a bit in case of multiple saves - this creates
      // a minor lag in terms of localstorage updating but it limits the num
      // of saves to the database
      // Make sure our database is loaded
      self.emit('cachedatabase');
      GroundDB.emit('cache', 'database', self);

      var minifiedDb = MiniMax.minify(_groundUtil.getDatabaseMap(self));
      // Save the collection into localstorage
      self.storage.setItem('data', minifiedDb, function(err, result) {
        // XXX:
      });

    }, 200);
  }
};


// This is an overridable method for hooking on to the GroundDB events

GroundDB.ready = function() {
  _groundUtil.subscriptionsReadyDeps.depend();
  return _groundUtil.subscriptionsReady;
};


// Methods to skip from caching
var _skipThisMethod = { login: true, getServerTime: true };

// Add settings for methods to skip or not when caching methods
GroundDB.skipMethods = function(methods) {
  if (typeof methods !== 'object') {
    throw new Error('skipMethods expects parametre as object of method names to skip when caching methods');
  }
  for (var key in methods) {
    if (methods.hasOwnProperty(key)) {
      // Extend the skipMethods object keys with boolean values
      _skipThisMethod[key] = !!methods[key];
    }
  }
};

GroundDB.OneTimeout = _groundUtil.OneTimeout;

///////////////////////////// RESUME METHODS ///////////////////////////////////

// Is methods resumed?
var _methodsResumed = false;

// Get a nice array of current methods
var _getMethodsList = function() {
  // Array of outstanding methods
  var methods = [];
  // Made a public API to disallow caching of some method calls
  // Convert the data into nice array
  _.each(_groundUtil.connection._methodInvokers, function(method) {
    if (!_skipThisMethod[method._message.method]) {
      // Dont cache login or getServerTime calls - they are spawned pr. default
      methods.push({
        // Format the data
        method: method._message.method,
        args: method._message.params,
        options: { wait: method._wait }
      });
    }
  });
  return methods;
};

// Flush in memory methods, its a dirty trick and could have some edge cases
// that would throw an error? Eg. if flushed in the middle of waiting for
// a method call to return - the returning call would not be able to find the
// method callback. This could happen if the user submits a change in one window
// and then switches to another tab and submits a change there before the first
// method gets back?
var _flushInMemoryMethods = function() {
  var didFlushSome = false;
  // TODO: flush should be rewritten to - we should do method proxy stuff...
  // This code is a bit dirty
  if (_groundUtil.connection && _groundUtil.connection._outstandingMethodBlocks &&
          _groundUtil.connection._outstandingMethodBlocks.length) {

    // Clear the in memory outstanding methods TODO: Check if this is enough
    // Check to see if we should skip methods
    for (var i = 0; i < _groundUtil.connection._outstandingMethodBlocks.length; i++) {
      var method = _groundUtil.connection._outstandingMethodBlocks[i];
      if (method && method._message && !_skipThisMethod[method._message.method]) {
        // Clear invoke callbacks
//    _groundUtil.connection._outstandingMethodBlocks = [];
        delete _groundUtil.connection._outstandingMethodBlocks[i];
//    _groundUtil.connection._methodInvokers = {};
        delete _groundUtil.connection._methodInvokers[i];
        // Set the flag to call back
        didFlushSome = true;
      }
    }
    if (didFlushSome) {
      // Call the event callback
      GroundDB.emit('flush', 'methods');
    }

  }
};

// Extract only newly added methods from localstorage
var _getMethodUpdates = function(newMethods) {
  var result = [];
  if (newMethods && newMethods.length > 0) {
    // Get the old methods allready in memory
    // We could have done an optimized slice version or just starting at
    // oldMethods.length, but this tab is not in focus
    var oldMethods = _getMethodsList();
    // We do a check to see if we should flush our in memory methods if allready
    // run on an other tab - an odd case - the first item would not match in
    // old methods and new methods, its only valid to make this test if both
    // methods arrays are not empty allready
    if (oldMethods.length &&
            EJSON.stringify(oldMethods[0]) !== EJSON.stringify(newMethods[0])) {
      // Flush the in memory / queue methods
      _flushInMemoryMethods();
      // We reset the oldMethods array of outstanding methods
      oldMethods = [];
    }
    // Iterate over the new methods, old ones should be ordered in beginning of
    // newMethods we do a simple test an throw an error if thats not the case
    for (var i=0; i < newMethods.length; i++) {

      if (i < oldMethods.length) {
        // Do a hard slow test to make sure all is in sync
        if (EJSON.stringify(oldMethods[i]) !== EJSON.stringify(newMethods[i])) {
          // The client data is corrupted, throw error or force the client to
          // reload, does not make sense to continue?
          throw new Error('The method database is corrupted or out of sync at position: ' + i);
        }
      } else {
        // Ok out of oldMethods this is a new method call
        result.push(newMethods[i]);

        GroundDB.emit('methodcall', newMethods[i]);
      }
    } // EO for iteration

  } else {
    // If new methods are empty this means that the other client / tap has
    // Allready sendt and recieved the method calls - so we flush our in mem
    // Flush the in memory / queue methods
    _flushInMemoryMethods();
  }

  // return the result
  return result;
};

///////////////////////////// LOAD & SAVE METHODS //////////////////////////////
// Create the storage for methods
var _methodsStorage = Store.create({
  name: '_methods_',
  version: 1.0
});

var _sendMethod = function(method) {
  // Send a log message first to the test
  test.log('SEND', JSON.stringify(method));

  if (inMainTestMode) console.warn('Main test should not send methods...');

  _groundUtil.connection.apply(
    method.method, method.args, method.options, function(err, result) {
      // We cant fix the missing callbacks made at runtime the
      // last time the app ran. But we can emit data

      if (err) {
        test.log('RETURNED ERROR', JSON.stringify(method), err.message);
      } else {
        test.log('RETURNED METHOD', JSON.stringify(method));
      }

      // Emit the data we got back here
      GroundDB.emit('method', method, err, result);
    }
  );
};

// load methods from localstorage and resume the methods
var _loadMethods = function() {
  // Load methods from storage
  _methodsStorage.getItem('methods', function(err, data) {

    if (err) {
      // XXX:
    } else if (data) {

      // Maxify the data from storage
      var methods = MiniMax.maxify(data);

      // We are only going to submit the diff
      methods = _getMethodUpdates(methods);

      // If any methods outstanding
      if (methods) {
        // Iterate over array of methods
        //_.each(methods, function(method) {
        while (methods.length) {
          // FIFO buffer
          var method = methods.shift();

          // parse "/collection/command" or "command"
          var params = method.method.split('/');
          var collection = params[1];
          var command = params[2];
          // Do work on collection
          if (collection && command) {
            // we are going to run an simulated insert - this is allready in db
            // since we are running local, so we remove it from the collection first
            if (_groundDatabases[collection]) {
              // The database is registered as a ground database

              // Set method doc id to _id or first argument, if none is found ''
              var methodDocId = '';

              // Set selector
              var selector = method.args && method.args[0];

              // If the method got any selector set we want to find the id of
              // the document if possible
              if (selector) {

                // if _id is set then use that
                if (selector._id) {

                  // Use _id
                  methodDocId = selector._id;

                } else if (selector === ''+selector) {

                  // If the selector is a string we assume that this must be
                  // an id
                  methodDocId = selector;
                }
              }

              // Parse the id
              var mongoId = _groundUtil.idParse(methodDocId);

              // Get the document on the client - if found
              var doc = _groundDatabases[collection].collection._collection.findOne(mongoId);

              if (doc) {
                // document found
                // This is a problem: insert stub simulation, would fail so we
                // remove the added document from client and let the method call
                // re-insert it in simulation
                if (command === 'insert') {
                  // Remove the item from ground database so it can be correctly
                  // inserted
                  _groundDatabases[collection].collection._collection.remove(mongoId);
                  // We mark this as remote since we will be corrected if it's
                  // Wrong + If we don't the data is lost in this session.
                  // So we remove any localOnly flags
                  delete _groundDatabases[collection]._localOnly[mongoId];
                } // EO handle insert

              } // EO Else no doc found in client database
            } // else collection would be a normal database
          } // EO collection work
          // Add method to connection
          _sendMethod(method);

        } // EO while methods
      } // EO if stored outstanding methods

      // Dispatch methods loaded event
      _methodsResumed = true;
      GroundDB.emit('resume', 'methods');

    } else {
      // Got nothing to resume...
      _methodsResumed = true;
    }

  });

}; // EO load methods

// Save the methods into the localstorage
var _saveMethods = function() {
  if (_methodsResumed) {

    // Ok memory is initialized
    GroundDB.emit('cache', 'methods');

    // Save outstanding methods to localstorage
    var methods = _getMethodsList();

    _methodsStorage.setItem('methods', MiniMax.minify(methods), function(err, result) {
      // XXX:
    });

  }
};

//////////////////////////// STARTUP METHODS RESUME ////////////////////////////

Meteor.startup(function() {
  // Wait some not to conflict with accouts login
  // TODO: Do we have a better way, instead of depending on time should depend
  // on en event.
  Meteor.setTimeout(function loadMethods() {
    _loadMethods();
  }, 500);
});

/////////////////////////// SYNC TABS METHODS DATABSE //////////////////////////

var syncDatabaseDelay = new _groundUtil.OneTimeout();

// Offline client only databases will sync a bit different than normal
// This function is a bit hard - but it works - optimal solution could be to
// have virtual method calls it would complicate things
GroundDB.prototype._syncDatabase = function() {
  var self = this;
  // We set a small delay in case of more updates within the wait
  syncDatabaseDelay.oneTimeout(function() {
//    if (self && (self.offlineDatabase === true || !Meteor.status().connected)) {
    if (self) {
      // Add event hook
      self.emit('sync');
      GroundDB.emit('sync', 'database', self);
      // Hard reset database?
      self.storage.getItem('data', function(err, data) {
        if (err) {
          //
        } else {
          // Get the data back in size
          var newDocs = MiniMax.maxify(data);

          self.find().forEach(function(doc) {
            // Remove document
            self._collection.remove(doc._id);
            // If found in new documents then hard update
            if (typeof newDocs[doc._id] !== 'undefined') {
              // Update doc
              self._collection.insert(newDocs[doc._id]);
              delete newDocs[doc._id];
            }
          });

          _.each(newDocs, function (doc) {
            // insert doc
            self._collection.insert(doc);
          });

        }
      });

    }
  }, 150);
};

var syncMethodsDelay = new _groundUtil.OneTimeout();

// Syncronize tabs via method calls
var _syncMethods = function() {
  // We are going to into reload, stop all access to localstorage
  _isReloading = true;
  // We are not master and the user is working on another tab, we are not in
  // a hurry to spam the browser with work, plus there are typically acouple
  // of db access required in most operations, we wait a sec?
  syncMethodsDelay.oneTimeout(function() {
    // Add event hook
    GroundDB.emit('sync', 'methods');
    // Resume methods
    _loadMethods();
    // Resume normal writes
    _isReloading = false;
  }, 500);
};

/////////////////////// ADD TRIGGERS IN LIVEDATACONNECTION /////////////////////

if (!inMainTestMode) {

  // Modify connection, well just minor
  _.extend(_groundUtil.connection, {
    // Define a new super for the methods
    _gdbSuper: {
      apply: _groundUtil.connection.apply,
      _outstandingMethodFinished:
      _groundUtil.connection._outstandingMethodFinished
    },
    // Modify apply
    apply: function(/* arguments */) {
      var self = this;
      // Intercept grounded databases
    //  var args = _interceptGroundedDatabases(arguments);
      // Call super
      self._gdbSuper.apply.apply(self, arguments);
      // Save methods
      _saveMethods();
    },
    // Modify _outstandingMethodFinished
    _outstandingMethodFinished: function() {
      var self = this;
      // Call super
      self._gdbSuper._outstandingMethodFinished.apply(self);
      // We save current status of methods
      _saveMethods();
    }
  });

}

/////////////////////// LOAD CHANGES FROM OTHER TABS ///////////////////////////

// The main test mode should not interfere with tab sync
if (!inMainTestMode) {

  // Sync Methods if changed
  _methodsStorage.addListener('storage', function(e) {
    // Method calls are delayed a bit for optimization
    _syncMethods('mehods');

  });

}
