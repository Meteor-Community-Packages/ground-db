Meteor.methods({
  'getServerTime': function() {
    return Date.now();
  }
});

// @export GroundDB
GroundDB = function(name, options) {
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
      if (typeof Meteor.SmartCollection !== 'undefined' &&
              name instanceof Meteor.SmartCollection) {
        // We are in a smart collection
        self = name._collection;
      } else {
        // self not set, throw an error
        throw new Error('GroundDB got an invalid name or collection');
      }
    }
  }

  // Initialize collection name
  self.name = (self.name)? self.name : self._name;

  // This is the basic interface allowing users easily access for handling
  // method calls, this.super() is the super and this.collection is self
  // TODO: Remove this section to the README
  self.conflictHandlers = (options && options.conflictHandlers)?
        options.conflictHandlers: {
    'insert': function(doc) {
      console.log('insert');
      console.log(doc);
      this.super(doc);
    },
    'update': function(id, modifier) {
      console.log('update');
      console.log(id);
      console.log(modifier);
      this.super(id, modifier);
    },
    'remove': function(id) {
      console.log('remove');
      console.log(id);
      this.super(id);
    }
  };

  // Create overwrite interface
  _.each(['insert', 'update', 'remove'], function(name) {
    // TODO: init default conflict handlers
    //self.conflictHandlers[name] = function() {
    //  this.super.apply(this, arguments);
    //};

    // Save super
    var _super = Meteor.default_server.method_handlers['/'+self.name+'/'+name];
    // Overwrite
    Meteor.default_server.method_handlers['/'+self.name+'/'+name] = function() {
      var _this = this;
      _this.collection = self;
      _this.super = _super;
      // Call the conflicthandlers
      self.conflictHandlers[name].apply(_this, arguments);
    };
  });

  return self;
};

// Unify client / server api
GroundDB.now = function() {
  return Date.now();
};

// TODO:
// When clients make changes the server should track the documents from the
// clients to see if the changes are new or old changes.
// This could be done in several ways.
// Either by versions or server timestamps - both could work.
//
// Conflicting overview:
// We could cut it down to comparing two documents and keep / broadcast the
// winning document.
//
// conflictHandler = function(clientDoc, serverDoc) { return serverDoc; }
//
//
// There should be found a way of registrating deleted documents - eg. by having
// a flag set 'active' all nonactive documents should then be removed from
// published documents.
//
// This could be a standalone package since it would introduce conflict
// handling in generel
//
// Regz. RaiX
