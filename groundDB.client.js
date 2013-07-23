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

// Add a correct prefix for groundDB
var _getGroundDBPrefix = function(suffix) {
  var prefix = 'groundDB.';
  // Should we support multiple users on multiple tabs namespacing data
  // in localstorage by current userId?
  //return prefix + ((Meteor.userId())?Meteor.userId()+'.':'') + suffix;
  return prefix + suffix;
};

// save object into localstorage
var _saveObject = function(name, object) {
  if (storage) {
    var cachedDoc = EJSON.stringify(object);
    storage.setItem(_getGroundDBPrefix(name), cachedDoc);
  }
};

// get object from localstorage, retur null if not found
var _loadObject = function(name) {
  if (storage) {
    var cachedDoc = storage.getItem(_getGroundDBPrefix(name));
    if (cachedDoc && cachedDoc.length > 0) {
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
GroundDB = function(name, options) {
  // Inheritance Meteor Collection can be set by options.collection
  var self = (options && options.collection &&
          options.collection instanceof Meteor.Collection) ?
          options.collection : new Meteor.Collection(name, options);

  // Add to pointer register
  _groundDatabases[name] = self;

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
    console.log('Loaded database: ' + self._name);

    // Load object from localstorage
    var docs = _loadObject('db.' + self._name);

    // Initialize client documents
    _.each(self._checkDocs( (docs) ? docs : {} ), function(doc) {
      self._collection.insert(doc);
    });

    self._databaseLoaded = true;
  };

  // Bulk Save database from memory to local, meant to be as slim, fast and
  // realiable as possible
  self._saveDatabase = function() {
    // If data loaded from localstorage then its ok to save - otherwise we
    // would override with less data
    if (self._databaseLoaded) {
      // Save the collection into localstorage
      _saveObject('db.' + self._name, self._collection.docs);
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

///////////////////////////// RESUME METHODS ///////////////////////////////////

// Have methods been initialized?
var _methodsResumed = false;

// load methods from localstorage and resume the methods
var _loadMethods = function() {
  // Load methods from local
  var methods = _loadObject('methods');

  // If any methods outstanding
  if (methods) {
    // Iterate over array of methods
    //_.each(methods, function(method) {
    while (methods.length > 0) {
      // FIFO buffer
      var method = methods.shift();
      // parse //
      var methodParams = method.method.split('/');
      var command = (methodParams.length > 2)?methodParams[2]:methodParams[1];
      var collection = (methodParams.length > 2)?methodParams[1]:'';

      // Do work on collection
      if (collection !== '') {
        // we are going to run an simulated insert - this is allready in db
        // since we are running local, so we remove it from the collection first
        if (_groundDatabases[collection]) {
          // The database is registered as a ground database
          var mongoId = (method.args && method.args[0])?method.args[0]._id:'';
          // Get the document on the client - if found
          var doc = _groundDatabases[collection]._collection.findOne(mongoId);

          if (doc) {
            // document found
            // This is a problem for insert stub simulation, it would fail
            // so we remove the document from client and let the method call
            // reinsert in simulation
            if (command === 'insert') {
              // Remove the item from ground database so it can be correctly
              // inserted
              console.log('remove before insert call: ' + mongoId);
              _groundDatabases[collection]._collection.remove(mongoId);
            } // EO handle insert
          } // EO Else no doc found in client database
        } // else collection would be a normal database
      } // EO collection work

      // Add method to connection
      console.log('apply method');
      Meteor.default_connection.apply(
              method.method, method.args, method.options);
    } // EO while methods
  } // EO if stored outstanding methods

  // Dispatch methods loaded event
  _methodsResumed = true;
  console.log('Resumed outstanding methods');
}; // EO load methods

// Save the methods into the localstorage
var _saveMethods = function() {
  if (_methodsResumed) {
    console.log('Store outstanding methods');
    // Array of outstanding methods
    var methods = [];

    // Convert the data into nice array
    _.each(Meteor.default_connection._methodInvokers, function(method) {
      if (method._message.method !== 'login') {
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

    // Save outstanding methods to localstorage
    _saveObject('methods', methods);
  }
};

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

Meteor.startup(function() {
  // Wait some not to conflict with accouts login
  // TODO: Do we have a better way, instead of depending on time should depend
  // on en event.
  Meteor.setTimeout(function() { _loadMethods(); }, 500);
});

// TODO: add support for muliple tabs
// Is this hard?
// No, simple theory: keep all the minimongo databases in sync + have a register
// for storing remote methods - but only if its the same user id
//
// Note: Shared webworker for syncronizing tabs: (inspiration)
// https://github.com/raix/Meteor-SharedConnection/blob/master/sharedSession.js#L53
