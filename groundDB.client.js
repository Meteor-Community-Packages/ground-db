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
_defaultConflictHandler = function(clientDoc, serverDoc) {
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
_storage = function() {
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
storage = _storage();

// save object into localstorage
_saveObject = function(name, object) {
  if (storage) {
    var cachedDoc = EJSON.stringify(object);
    storage.setItem('groundDB.' + name, cachedDoc);
  }
};

// get object from localstorage, retur null if not found
_loadObject = function(name, object) {
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
  // Inheritance Meteor Collection
  var self = new Meteor.Collection(name, options);

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

  // Load the localstorage into list

  /*
  Bulk Load database from local to memory
  */
  self._loadDatabase = function() {
    // Then load the docs into minimongo
    var docs = _loadObject('db.' + self.name);
    self._collection.docs = (docs) ? docs : {};
  };

  /*
  Bulk Save database from memory to local
  */
  self._saveDatabase = function() {
    _saveObject('db.' + self.name, self._collection.docs);
  };

  // Init docs from localstorage
  self._loadDatabase();

  // Add window listener for saving db locally (untrusted)
  window.addEventListener('unload', function(e) {
    self._saveDatabase();
  });

  // Optional save data to local at interval
  if (options && options.saveInterval !== undefined && options.saveInterval > 0) {
    // Add interval save
    Meteor.setInterval(function() {
      self._saveDatabase();

      // TODO: should we still leave out saving methods?
      _saveMethods();
    }, options.saveInterval);
  }

  // Optional save data at any changes
  if (options && options.saveLive === true) {
    // Add autorun save
    Deps.autorun(function() {
      // Save on changes
      self.find().fetch();
      self._saveDatabase();

      // Guess will save the methods too
      _saveMethods();
    });
  }

  return self;
};


///////////////////////////// RESUME METHODS ///////////////////////////////////

  /*
  load methods from localstorage and resume the methods
  */
  _loadMethods = function() {
    // set last session id
    if (storage) {
      var lastSession = storage.getItem('groundDB.lastSession');
      if (lastSession) {
        Meteor.default_connection._lastSessionId = lastSession;
      }
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
  };

  /*
  Save the methods into the localstorage
  */
  _saveMethods = function() {
    // Save last session id
    if (storage) {
      storage.setItem('groundDB.lastSession', Meteor.default_connection._lastSessionId);
    }

    // Array of outstanding methods
    var methods = [];

    // Test if we got any outstanding methods at the moment
    if (Meteor.default_connection._outstandingMethodBlocks &&
            Meteor.default_connection._outstandingMethodBlocks.length > 0) {

      // Convert the data into nice array
      _.each(Meteor.default_connection._outstandingMethodBlocks[0].methods,
              function(method) {

        // Format the data
        methods.push({
          method: method._message.method,
          args: method._message.params,
          options: { wait: method._wait }
        });
      });
    }

    // Save outstanding methods to localstorage
    _saveObject('methods', methods);
  };

    // Add window listener for saving methods locally (untrusted)
  window.addEventListener('unload', function(e) {
    _saveMethods();
  });

  // Init resume
  _loadMethods();
