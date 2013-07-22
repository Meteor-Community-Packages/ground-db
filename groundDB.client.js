"use strict";

/*

GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

options: {
  saveInterval: 5000, // save pr. 5 sec
  saveLive: true // save at any data change in subscribed collection
  conflictHandler: function(clientDocument, serverDocument)
}

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/

//////////////////////////// CONFLICT HANDLER //////////////////////////////////

// This can be customized by user by setting options.conflictHandler
// this -> referes to collection
var _defaultConflictHandler = function(clientDoc, serverDoc) {
  // Strategy: Server allways wins

  // If document is found on client
  if (clientDoc) {
    // Then remove
    this.remove(clientDoc._id);
  }
  // And insert the server document
  this.insert(serverDoc);
};

// TODO: Should there be conflictHandlers pr. added, removed, changed?

////////////////////////////// LOCALSTORAGE ////////////////////////////////////

// Returns the localstorage if its found and working
// TODO: check if this works in IE
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

// save object into localstorage
var _saveObject = function(name, object) {
  if (storage) {
    var cachedDoc = EJSON.stringify(object);
    storage.setItem('groundDB.' + name, cachedDoc);
  }
};

// get object from localstorage, retur null if not found
var _loadObject = function(name, object) {
  if (storage) {
    var cachedDoc = storage.getItem('groundDB.' + name);
    if (cachedDoc && cachedDoc.length > 0) {
      var cachedDocObject = EJSON.parse(cachedDoc);
      return cachedDocObject;
    }
  }
  return null;
};

//////////////////////////////// GROUND DATABASE ///////////////////////////////

// @export GroundDB
GroundDB = function(name, options) {
  // Inheritance Meteor Collection can be set by options.collection
  var self = (options && options.collection &&
          options.collection instanceof Meteor.Collection) ?
          options.collection : new Meteor.Collection(name, options);

  // Rig conflictHandler
  self.conflictHandler =
          (options && typeof options.conflictHandler === 'function') ?
          options.conflictHandler : _defaultConflictHandler;

  // We have to overwrite the standard Meteor code - It throws an Error when
  // Documents allready in the docs. So we handle the conflict instead...
  // TODO: Could this be cleaned up?
  ////////// BEGIN mongo-livedata/collection.js 103
  self._connection._stores[name].update = function (msg) {
    var mongoId = Meteor.idParse(msg.id);
    var doc = self._collection.findOne(mongoId);

    // Is this a "replace the whole doc" message coming from the quiescence
    // of method writes to an object? (Note that 'undefined' is a valid
    // value meaning "remove it".)
    if (msg.msg === 'replace') {
      var replace = msg.replace;
      if (!replace) {
        if (doc)
          self._collection.remove(mongoId);
      } else if (!doc) {
        self._collection.insert(replace);
      } else {
        // XXX check that replace has no $ ops
        self._collection.update(mongoId, replace);
      }
      return;
    } else if (msg.msg === 'added') {
      // Run conflict handler
      self.conflictHandler.call(self._collection,
              doc, _.extend({_id: mongoId}, msg.fields));

    } else if (msg.msg === 'removed') {
      if (!doc)
        throw new Error("Expected to find a document already present for removed");
      self._collection.remove(mongoId);
    } else if (msg.msg === 'changed') {
      if (!doc)
        throw new Error("Expected to find a document to change");
      if (!_.isEmpty(msg.fields)) {
        var modifier = {};
        _.each(msg.fields, function (value, key) {
          if (value === undefined) {
            if (!modifier.$unset)
              modifier.$unset = {};
            modifier.$unset[key] = 1;
          } else {
            if (!modifier.$set)
              modifier.$set = {};
            modifier.$set[key] = value;
          }
        });
        self._collection.update(mongoId, modifier);
      }
    } else {
      throw new Error("I don't know how to deal with this message");
    }

  };
  ///////// EO mongo-livedata/collection.js 153

  self._databaseLoaded = false;

  // Bulk Load database from local to memory
  self._loadDatabase = function() {
    // Then load the docs into minimongo
    if (!_methodsLoaded) {
      console.log('Wrong order ' + self._name);
    } else {
      console.log('methods are loaded ' + self._name);
    }
    var docs = _loadObject('db.' + self._name);
    self._collection.docs = (docs) ? docs : {};

    self._databaseLoaded = true;
  };

  // Bulk Save database from memory to local
  self._saveDatabase = function() {
    if (self._databaseLoaded) {
      _saveObject('db.' + self._name, self._collection.docs);
    }
  };

  // Init docs from localstorage
  _onMethodsLoad(function() {
    self._loadDatabase();
  });

  // Add window listener for saving db locally (untrusted)
  window.addEventListener('unload', function(e) {
    self._saveDatabase();
  });

  // Optional save data to local at interval
  if (options && options.saveInterval !== undefined && options.saveInterval > 0) {
    // Add interval save
    Meteor.setInterval(function() {
      self._saveDatabase();
    }, options.saveInterval);
  }

  // Add autorun save
  Deps.autorun(function() {
    // Save on changes
    self.find().fetch();
    self._saveDatabase();
  });

  return self;
};


///////////////////////////// RESUME METHODS ///////////////////////////////////

// Have methods been initialized?
var _methodsLoaded = false;

// Array of listeners
var _onMethodsLoadListeners = [];

// Run func when methods are loaded
var _onMethodsLoad = function(func) {
  if (_methodsLoaded) {
    func();
  } else {
    _onMethodsLoadListeners.push(func);
  }
};

// Trigger / dispatch methods loaded event
var _callMethodsLoadListeners = function() {
  if (!_methodsLoaded) {
    console.log('methods are loaded!!');
    _methodsLoaded = true;
    while (_onMethodsLoadListeners.length > 0) {
      // FIFO
      _onMethodsLoadListeners.shift().apply(this);
    }
  }
};

///////////////////////////// LOAD & SAVE METHODS //////////////////////////////

// load methods from localstorage and resume the methods
var _loadMethods = function() {
  // set last session
  var settings = _loadObject('settings');

  if (settings) {
    Meteor.default_connection._lastSessionId = settings._lastSessionId;
  }

  // Load methods from local
  var methods = _loadObject('methods');

  // If any methods outstanding
  if (methods) {

    // Iterate over array of methods
    _.each(methods, function(method) {

      // Add method to connection
      Meteor.default_connection.apply(
              method.method, method.args, method.options);
    });
  }

  // Dispatch methods loaded event
  _callMethodsLoadListeners();
};

// Save the methods into the localstorage
var _saveMethods = function() {
  // Save last session
  _saveObject('settings', {
    _lastSessionId: Meteor.default_connection._lastSessionId
  });

  // Array of outstanding methods
  var methods = [];

  // Convert the data into nice array
  _.each(Meteor.default_connection._methodInvokers,
          function(method) {
    if (method._message.method === 'login') {
      // We could attach _loadMethods to the login event, this way the
      // login that way methods will block until user is logged in?
      console.log('call ' + method._message.method);
    } else {
      // Dont cache login calls - they are spawned pr. default when accounts
      // are installed
      methods.push({
        // Format the data
        method: method._message.method,
        args: method._message.params,
        options: { wait: method._wait }
      });
      console.log('call ' + method._message.method);
    }
  });

  if (methods.length === 0) {
    console.log('No methods pending');
  } else {
    console.log('GOT methods');

  }
  // Save outstanding methods to localstorage
  _saveObject('methods', methods);
};

// Overridde Meteor.default_connection
// apply and _outstandingMethodFinished
Meteor.default_connection = new function() {
  self = Meteor.default_connection;
  var _applySuper = self.apply;
  self.apply = function(/* arguments */) {
    // Call super
    _applySuper.apply(self, arguments);
    // Save methods
    _onMethodsLoad(function() {
      _saveMethods();
    });
  };

  self._outstandingMethodFinishedSuper = self._outstandingMethodFinished;
  self._outstandingMethodFinished = function() {
    // Call super
    self._outstandingMethodFinishedSuper();
    // We save current status of methods
    _onMethodsLoad(function() {
      _saveMethods();
    });
  };

  return self;
};

// Init resume, wait a sec for login method to be initialized
// TODO: Investigate other options eg. only run in timeout if Accounts exists
Meteor.setTimeout(function() {
  _loadMethods();
}, 0);
