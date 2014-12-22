/*
               ______                           ______  ____
              / ____/________  __  ______  ____/ / __ \/ __ )
             / / __/ ___/ __ \/ / / / __ \/ __  / / / / __  |
            / /_/ / /  / /_/ / /_/ / / / / /_/ / /_/ / /_/ /
            \____/_/   \____/\__,_/_/ /_/\__,_/_____/_____/


GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/

///////////////////////////////// TEST BED /////////////////////////////////////

try {
  var test = Package['ground:test'].GroundTest;
  console.warn('## IN TEST MODE');
} catch(err) {
  // Production noop
  var test = {
    log: function() {},
    debug: function() {},
    isMain: false
  };
}

//////////////////////////////// GROUND DATABASE ///////////////////////////////

// XXX: This usage of minimax could be extended to letting the user add more
// words to the dictionary - but its not without danger and should prop. trigger
// some warning if no migration scheme is setup...
var MiniMaxDB = new MiniMax({
  // We add the most general words in databases
 dictionary: ['_id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']
});

var MiniMaxMethods = new MiniMax({
  // We add the most general words in databases
  dictionary: ['method', 'args', 'options', 'wait', '_id']
});

// Status of app reload
var _isReloading = false;

// Add a pointer register of grounded databases
var _groundDatabases = {};

// This function will add a emitter for the "changed" event
var _addChangedEmitter = function() {
  var self = this;
  // Reactive deps for when data changes
  var _dataChanged = new Tracker.Dependency();

  var _changeData = function() { _dataChanged.changed(); };

  Tracker.autorun(function() {
    // Depend on data change
    _dataChanged.depend();
    // Emit changed
    self.collection.emit('changed');
  });

  // Observe all changes and rely on the less agressive observer system for
  // providing a reasonable update frequens
  self.collection.find().observe({
    'added': _changeData,
    'changed': _changeData,
    'removed': _changeData
  });
};

// Clean up the local data and align to the subscription
var _cleanUpLocalData = function() {
  var self = this;
  // Flag marking if the local data is cleaned up to match the subscription
  self.isCleanedUp = false;

  Tracker.autorun(function(computation) {
    if (Ground.ready() && !self.isCleanedUp) {
      // If all subscriptions have updated the system then remove all local only
      // data?
      // console.log('Clean up ' + self.name);
      self.isCleanedUp = true;
      _removeLocalOnly.call(self);

      // Stop this listener
      computation.stop();
    }
  });
};

// Setup the syncronization of tabs
var _setupTabSyncronizer = function() {
  var self = this;
  // We check to see if database sync is supported, if so we sync the database
  // if data has changed in other tabs
  if (typeof _syncDatabase === 'function') {

    // Listen for data changes
    self.storage.addListener('storage', function(e) {

      // Database changed in another tab - sync this db
      _syncDatabase.call(self);

    });

  }
};

// Rig the change listener and make sure to store the data to local storage
var _setupDataStorageOnChange = function() {
  var self = this;

  // Add listener, is triggered on data change
  self.collection.addListener('changed', function(e) {

    // Store the database in store when ever theres a change
    // the _saveDatabase will throttle to optimize
    _saveDatabase.call(self);

  });
};

// This is the actual grounddb instance
_groundDbConstructor = function(collection, options) {
  var self = this;

  // Check if user used the "new" keyword
  if (!(self instanceof _groundDbConstructor))
    throw new Error('_groundDbConstructor expects the use of the "new" keyword');

  self.collection = collection;

  // Set Ground.Collection prefix for localstorage
  var _prefix = options && options.prefix || '';

  // Set helper to connection
  self.connection = collection._connection;

  // Set helper to minimongo collection
  self._collection = collection._collection;

  // Is this an offline client only database?
  self.offlineDatabase = !!(self.connection === null);

  // Initialize collection name
  // XXX: Using null as a name is a problem - only one may be called null
  self.name = (collection._name)? collection._name : 'null';

  /////// Finally got a name... and rigged

  // One timeout pointer for database saves
  self._saveDatabaseTimeout = new OneTimeout(200);

  // Rig resume for this collection
  if (!self.offlineDatabase && options.resume !== false) {

    Ground.methodResume([
      '/' + self.name + '/insert',
      '/' + self.name + '/remove',
      '/' + self.name + '/update'
    ], self.connection);

  }

  // Get the best storage available
  self.storage = Store.create({
    // We allow the user to set a prefix for the storage. Its mainly ment for
    // testing purposes, since the prefixing allows the tests to simulate more
    // complex scenarios
    name: _prefix + self.name,
    // Default version is 1.0 - if different from the one in storage record it
    // would trigger a migration
    version: options.version || 1.1,
    // migration can be set to overwrite the default behaviour on the storage.
    // the options.migration should be a function(oldRecord, newRecord)
    // one can compare the oldRecord.version and the new version to ensure
    // correct migration steps.
    // That said the default behaviour simply clears the storage.
    migration: options.migration
  });

  // Rig an event handler on Meteor.Collection
  collection.eventemitter = new EventEmitter();

  // Add to pointer register
  // XXX: should we throw an error if already found?
  // Store.create will prop. throw an error before...
  _groundDatabases[ self.name ] = self;

  // We have to allow the minimongo collection to contain data before
  // subscriptions are ready
  _hackMeteorUpdate.call(self);

  // Flag true/false depending if database is loaded from local
  self._databaseLoaded = false;

  // Map local-only - this makes sure that localstorage matches remote loaded db
  self._localOnly = {};

  // Clean up the database and align to subscription
  _cleanUpLocalData.call(self);


  // Add the emitter of "changed" events
  _addChangedEmitter.call(self);

  // The data changes should be stored in storage
  _setupDataStorageOnChange.call(self);

  // Load the database as soon as possible
  _loadDatabase.call(self);

  // Add tab syncronizer
  _setupTabSyncronizer.call(self);

};

// Global helper for applying grounddb on a collection
Ground.Collection = function(name, options) {
  var self;

  // Inheritance Meteor Collection can be set by options.collection
  // Accepts smart collections by Arunoda Susiripala
  // Check if user used the "new" keyword


  // Make sure we got some options
  options = options || {};

  // Either name is a Meteor collection or we create a new Meteor collection
  if (name instanceof _groundUtil.Collection) {
    self = name;
  } else {
    self = new _groundUtil.Collection(name, options);
  }

  // Throw an error if something went wrong
  if (!(self instanceof _groundUtil.Collection))
    throw new Error('Ground.Collection expected a Mongo.Collection');

  // Add grounddb to the collection, circular reference since self is
  // grounddb.collection
  self.grounddb = new _groundDbConstructor(self, options);

  // Return grounded collection - We dont return this eg if it was an instance
  // of Ground.Collection
  return self;
};

////////////////////////////////////////////////////////////////////////////////
// Private Methods
////////////////////////////////////////////////////////////////////////////////

/*

TODO: Implement conflict resoultion

The _hackMeteorUpdate should be modified to resolve conflicts via default or
custom conflict handler.

The first thing we have to do is to solve the "remove" operation - Its quite
tricky and there are a couple of patterns we could follow:

1. Create a register for removed docs - but how long should we store this data?
2. Stop the real remove, add a removedAt serverStamp in an empty doc instead
3. Find a way to get a removedAt timestamp in another way

So we cant trust that having the data at the server makes everything ok,

---
The scenario or question to answer is:

clientA creates a document and goes offline
clientB removes the document
after a day, a month or years?:
clientA edits the document and goes online

So what should happen?
---

If we want the newest change to win, then the document should be restored

If clientA and clientB is the same user we would assume they kinda know what
they are doing, but if you edit the docuemnt after you removed it - it seems
like an user error removing the document.

But now time comes into play, if it was 6 month ago the user removed the document,
and now edits it offline then going online would still restore the document?
This raises the question of how long time should we store details about removed
documents... and where?

Should destructive actions be comprimised, rather dont remove?

Now if the user updates a document - should we try to merge the data, sometimes
yes, sometimes no.

Never the less - this is an example of the power a custom conflict handler
should have. So the task is to provide the tooling and data for the conflict
handlers.

A conflict handler is really a question about strategy, how the app should
act in the situation. This is why we are going to have the client-side do this
work - I mean we could have a strategy for letting the user decide what should
happen.

The conflict handler should be provided the localVersion and remoteVersion,
it should then return the winning result - might be in a callback allowing
sync + async behaviours?

So this is focused on servertime stamps - but the interesting thing here could
also be the focus on versions instead. Much like OT and github does.

But OT will prop. only make sense when all online?

---

Should it be the server that handles conflicts? All the data is available there
we cant be sure about subscriptions + we could have OT records for each collection
Creating a conflict resoultion package could be isolated and would work on all
collections - grounded or not...

We could wait until OT is supported in core?

*/
var _hackMeteorUpdate = function() {
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
var _checkDocs = function(a) {
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

  _groundUtil.each(a, function(doc, key) {
    c[key] = doc;
  });
  return c;
};

// At some point we can do a remove all local-only data? Making sure that we
// Only got the same data as the subscription
var _removeLocalOnly = function() {
  var self = this;

  _groundUtil.each(self._localOnly, function(isLocalOnly, id) {
    if (isLocalOnly) {
      self._collection.remove({ _id: id });
      delete self._localOnly[id];
    }
  });
};

// Bulk Load database from local to memory
var _loadDatabase = function() {
  var self = this;
  // Then load the docs into minimongo

  // Emit event
  self.collection.emit('resume', { type: 'database' });
  Ground.emit('resume', { type: 'database', collection: self.name });

  // Load object from localstorage
  self.storage.getItem('data', function(err, data) {
    if (err) {
      // XXX:
    } else {

      self.collection.emit('resumed', { type: 'database', data: data });
      Ground.emit('resumed', { type: 'database', collection: self.name });

      // Maxify the data
      var docs = data && MiniMaxDB.maxify(data) || {};

      // Initialize client documents
      _groundUtil.each(_checkDocs.call(self, docs || {} ), function(doc) {
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
var _saveDatabase = function() {
  var self = this;
  // If data loaded from localstorage then its ok to save - otherwise we
  // would override with less data
  if (self._databaseLoaded && _isReloading === false) {
    self._saveDatabaseTimeout(function() {
      // We delay the operation a bit in case of multiple saves - this creates
      // a minor lag in terms of localstorage updating but it limits the num
      // of saves to the database
      // Make sure our database is loaded
      self.collection.emit('cache', { type: 'database' });
      Ground.emit('cache', { type: 'database', collection: self.name });
      var minifiedDb = MiniMaxDB.minify(_groundUtil.getDatabaseMap(self));
      // Save the collection into localstorage
      self.storage.setItem('data', minifiedDb, function(err, result) {
        // Emit feedback
        if (err) {
          // Emit error
          self.collection.emit('error', { error: err });
          Ground.emit('error', { collection: self.name, error: err });
        } else {
          // Emit cached event
          self.collection.emit('cached', { type: 'database', data: minifiedDb });
          Ground.emit('cached', { type: 'database', collection: self.name });
        }
      });

    });
  }
};


// Reactive variable containing a boolean flag, true == all subscriptions have
// been loaded
// XXX: this should be a bit more finegrained eg. pr. collection, but thats not
// possible yet
Ground.ready = _groundUtil.allSubscriptionsReady;

Ground.lookup = function(collectionName) {
  return _groundDatabases[collectionName];
};

var _allowMethodResumeMap = {};
var _methodResumeConnections = [];

var addConnectionToResume = function(connection) {
  if (_methodResumeConnections.indexOf(connection) < 0)
    _methodResumeConnections.push(connection);
};

Ground.methodResume = function(names, connection) {
  // Allow string or array of strings
  if (names === ''+names) names = [names];

  // Default to the default connection...
  connection = connection || _groundUtil.connection;

  // This index comes in handy when we use getMethodList
  addConnectionToResume(connection);

  // Add methods to resume
  _groundUtil.each(names, function(name) {
    _allowMethodResumeMap[name] = connection;
  });
  // console.log(_allowMethodResumeMap);
};

// Add settings for methods to skip or not when caching methods
Ground.skipMethods = function(methods) {
  throw new Error('Ground.skipMethods is deprecated, use Ground.methodResume instead');
};

Ground.OneTimeout = OneTimeout;

///////////////////////////// RESUME METHODS ///////////////////////////////////

// Is methods resumed?
var _methodsResumed = false;
var _methodsResumedDeps = new Tracker.Dependency();


Ground.isResumed = function() {
  _methodsResumedDeps.depend();
  return _methodsResumed;
};

// Get a nice array of current methods
var _getMethodsList = function() {
  // Array of outstanding methods
  var methods = [];
  // Made a public API to disallow caching of some method calls
  // Convert the data into nice array

  // We iterate over the connections that have resumable methods
  _groundUtil.each(_methodResumeConnections, function(connection) {
    // We run through the method invokers
    _groundUtil.each(connection._methodInvokers, function(method) {
      // Get the method name
      var name = method._message.method;
      // Check that this method is resumeable and on the correct connection
      if (_allowMethodResumeMap[name] === connection) {
        // Push the method
        methods.push({
          // Format the data
          method: name,
          args: method._message.params,
          options: { wait: method._wait }
        });

      }

    });
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
      if (method && method._message && _allowMethodResumeMap[method._message.method]) {
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
      Ground.emit('flush', { type: 'methods' });
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

        Ground.emit('methodcall', newMethods[i]);
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
  version: 1.1
});

var _sendMethod = function(method, connection) {
  // Send a log message first to the test
  test.log('SEND', JSON.stringify(method));

  if (test.isMain) console.warn('Main test should not send methods...');

  connection.apply(
    method.method, method.args, method.options, function(err, result) {
      // We cant fix the missing callbacks made at runtime the
      // last time the app ran. But we can emit data

      if (err) {
        test.log('RETURNED ERROR', JSON.stringify(method), err.message);
      } else {
        test.log('RETURNED METHOD', JSON.stringify(method));
      }

      // Emit the data we got back here
      Ground.emit('method', { method: method, error: err, result: result });
    }
  );
};

var waitingMethods = [];

// We may end in a situation where things have changed eg. if collections are
// renamed or left out in the app. We make sure that ground db will try 5 time
// times and then have the missing methods die.
// The correct thing in the future would prop. be to have the conflict resolution
// create patch calls instead of resume.
var resumeAttemptsLeft = 5;

var resumeWaitingMethods = function() {
  var missing = [];

  resumeAttemptsLeft--;

  // Resume each method
  _groundUtil.each(waitingMethods, function(method) {
    if (method) {

      // name helper for the method
      var name = method.method;

      if (name) {

        test.log('RESUME', 'Load method "' + name + '"');
        // Get the connection from the allow method resume
        var methodConnection = _allowMethodResumeMap[name];
        // Run it in fenced mode since the changes have already been applied
        // locally
        if (methodConnection) {

          _groundUtil.connection.stubFence(name, function() {
            // Add method to connection
            _sendMethod(method, methodConnection);
          });

        } else {
          // XXX: make sure we keep order
          // TODO: Check if we should use push or unshift
          missing.push(method);
          test.log('RESUME', 'Missing method "' + name + '" - retry later');
          console.warn('Ground method resume: Cannot resume "' + name + '" connection not rigged yet, retry later');
        }

      }

    }
  });

  // Keep track of missing methods
  waitingMethods = missing;

  // If no waiting methods - then we must be done?
  if (!_methodsResumed && !waitingMethods.length || !resumeAttemptsLeft) {
    // Methods have resumed
    _methodsResumed = true;
    _methodsResumedDeps.changed();
  }

};


var loadMissingMethods = function(callback) {
  _methodsStorage.getItem('methods', function(err, data) {
    test.log('RESUME', 'methods loaded into memory');
    if (err) {
      // XXX:
      callback(err);
    } else if (data) {
      // Maxify the data from storage
      // We are only going to submit the diff
      // Set missing methods
      waitingMethods = _getMethodUpdates(MiniMaxMethods.maxify(data));
    }

    callback();
  });
};

// load methods from localstorage and resume the methods
var _loadMethods = function() {

  loadMissingMethods(function(err) {
    if (err) {
      test.log('RESUME', 'Could not load missing methods into memory', err);
    } else {

      // Try to resume missing methods now
      resumeWaitingMethods();

      // If not all methods are resumed then try until success
      if (!_methodsResumed) {

        var interval = Meteor.setInterval(function() {
          // Try to resume missing methods
          resumeWaitingMethods();

          // If methods are resumed then stop this
          if (_methodsResumed) Meteor.clearInterval(interval);
        }, 1000);

      }

    }
  });

}; // EO load methods

// Save the methods into the localstorage
var _saveMethods = function() {
  if (_methodsResumed) {

    // Ok memory is initialized
    Ground.emit('cache', { type: 'methods' });

    // Save outstanding methods to localstorage
    var methods = _getMethodsList();
//test.log('SAVE METHODS', JSON.stringify(methods));
    _methodsStorage.setItem('methods', MiniMaxMethods.minify(methods), function(err, result) {
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
    test.log('INIT LOAD METHODS');
    _loadMethods();
  }, 500);
});

/////////////////////////// SYNC TABS METHODS DATABSE //////////////////////////

var syncDatabaseTimeout = new OneTimeout(150);

// Offline client only databases will sync a bit different than normal
// This function is a bit hard - but it works - optimal solution could be to
// have virtual method calls it would complicate things
var _syncDatabase = function() {
  var self = this;
  // We set a small delay in case of more updates within the wait
  syncDatabaseTimeout(function() {
//    if (self && (self.offlineDatabase === true || !Meteor.status().connected)) {
    if (self) {
      // Add event hook
      self.collection.emit('sync');
      Ground.emit('sync', { type: 'database', collection: self.name });
      // Hard reset database?
      self.storage.getItem('data', function(err, data) {
        if (err) {
          //
          throw err;
        } else {
          // Get the data back in size
          var newDocs = MiniMaxDB.maxify(data);

          self.collection.find().forEach(function(doc) {
            // Remove document
            self._collection.remove(doc._id);
            // If found in new documents then hard update
            if (typeof newDocs[doc._id] !== 'undefined') {
              // Update doc
              self._collection.insert(newDocs[doc._id]);
              delete newDocs[doc._id];
            }
          });

          _groundUtil.each(newDocs, function (doc) {
            // insert doc
            self._collection.insert(doc);
          });

        }
      });

    }
  });
};

var syncMethodsTimeout = new OneTimeout(500);

// Syncronize tabs via method calls
var _syncMethods = function() {
  // We are going to into reload, stop all access to localstorage
  _isReloading = true;
  // We are not master and the user is working on another tab, we are not in
  // a hurry to spam the browser with work, plus there are typically acouple
  // of db access required in most operations, we wait a sec?
  syncMethodsTimeout(function() {
    // Add event hook
    Ground.emit('sync', { type: 'methods' });
    // Load the offline data into our memory
    _groundUtil.each(_groundDatabases, function(collection, name) {
      test.log('SYNC DB', name);
      _loadDatabase.call(collection);
    });
    // Resume methods
    test.log('SYNC METHODS');
    _loadMethods();
    // Resume normal writes
    _isReloading = false;
  });
};

/////////////////////// ADD TRIGGERS IN LIVEDATACONNECTION /////////////////////

if (!test.isMain) {

  // Add hooks method hooks
  // We need to know when methods are added and when they have returned

  var _super_apply = _groundUtil.Connection.prototype.apply;
  var _super__outstandingMethodFinished = _groundUtil.Connection.prototype._outstandingMethodFinished;

  _groundUtil.Connection.prototype.apply = function(name, args, options, callback) {
    // Intercept grounded databases
    if (_allowMethodResumeMap[name])
      test.debug('APPLY', JSON.stringify(_groundUtil.toArray(arguments)));
    // Call super
    var result = _super_apply.apply(this, _groundUtil.toArray(arguments));
    // Save methods
    if (_allowMethodResumeMap[name]) _saveMethods();
    // return the result
    return result;
  };

  _groundUtil.Connection.prototype._outstandingMethodFinished = function() {
      // Call super
      _super__outstandingMethodFinished.apply(this);
      // We save current status of methods
      _saveMethods();
      // _outstandingMethodFinished dont return anything
    }

}

/////////////////////// LOAD CHANGES FROM OTHER TABS ///////////////////////////

// The main test mode should not interfere with tab sync
if (!test.isMain) {

  // Sync Methods if changed
  _methodsStorage.addListener('storage', function(e) {
    // Method calls are delayed a bit for optimization
    _syncMethods('mehods');

  });

}

////////////////////////// ADD DEPRECATION NOTICE //////////////////////////////
if (typeof GroundDB === 'undefined') {
  GroundDB = function(name, options) {
    // Deprecation notice
    console.warn('The GroundDB scope is deprecating!! Use Ground.Collection instead');
    return new Ground.Collection(name, options);
  };
}
