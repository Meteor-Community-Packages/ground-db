//////////////////////////////////////////////////////////////////////////////
// WRAP MONGO COLLECTION API on prototype
//////////////////////////////////////////////////////////////////////////////

// Wrap insert
GroundDB.prototype.insert = function(/* arguments */) {
  var args = _.toArray(arguments);

  // We set _id manually if not already set, this is due to the "optimization"
  // added in Meteor and the fact that we cant rely on connection or method
  // invocations in grounddb:
  // "Don't generate the id if we're the client and the 'outermost' call
  //  This optimization saves us passing both the randomSeed and the id
  //  Passing both is redundant."
  //  // Mongo->collection.js

  // XXX: This is a bit strange - its the only way of making sure the _id is
  // sent to the server. We want the id to the server if we are doing offline
  // resume - grounddb cannot regenerate the invocation callbacks if browser
  // was closed.

  args[0]._id = args[0]._id || this.collection._makeNewID();

  return this.collection.insert.apply(this.collection, args);
};

// Wrap update
GroundDB.prototype.update = function(/* arguments */) {
  return this.collection.update.apply(this.collection, _.toArray(arguments));
};

// Wrap remove
GroundDB.prototype.remove = function(/* arguments */) {
  return this.collection.remove.apply(this.collection, _.toArray(arguments));
};

// Wrap find
GroundDB.prototype.find = function(/* arguments */) {
  return this.collection.find.apply(this.collection, _.toArray(arguments));
};

// Wrap findOne
GroundDB.prototype.findOne = function(/* arguments */) {
  return this.collection.findOne.apply(this.collection, _.toArray(arguments));
};
