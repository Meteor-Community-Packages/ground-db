// @export GroundDB
GroundDB = function(name, options) {
  // Inheritance Meteor Collection can be set by options.collection
  // Accepts smart collections by Arunoda Susiripala
  var self;
  if (options && options.collection) {
    // User set a collection in options
    if (options.collection instanceof Meteor.Collection) {
      self = options.collection;
    } else {
      if ((options.collection._remoteCollection instanceof Meteor.Collection)) {
        // We are in a smart collection
        self = options.collection._remoteCollection;
      } else {
        // self not set, throw an error
        throw new Error('GroundDB got an invalid option: collection');
      }
    }
  } else {
    // We instanciate a new meteor collection
    self = new Meteor.Collection(name, options);
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
