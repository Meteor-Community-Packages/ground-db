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

  if (self.name !== null) {
    var cursor = self.find({});
    var handle = cursor.observeChanges({
      added: function(id, fields) {
        console.log('added ' + id);
      },
//      addedBefore: function(id, fields, before) {
//        console.log('addedBefore ' + id);
//      },
      changed: function(id, fields) {
        console.log('changed ' + id);
      },
      movedBefore: function(id, before) {
        console.log('movedBefore ' + id);
      },
      removed: function(id) {
        console.log('removed ' + id);
      }
    });
  }

  return self;
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
