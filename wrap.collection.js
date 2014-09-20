//////////////////////////////////////////////////////////////////////////////
// WRAP MONGO COLLECTION API on prototype
//////////////////////////////////////////////////////////////////////////////

// Wrap insert
GroundDB.prototype.insert = function(/* arguments */) {
  var args = _.toArray(arguments);
  // XXX: This is a bit strange - its the only way of making sure the _id is
  // sent to the server?
  if (!args[0]._id) args[0]._id = Random.id();
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
