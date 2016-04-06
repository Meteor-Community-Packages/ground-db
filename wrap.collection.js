//////////////////////////////////////////////////////////////////////////////
// WRAP MONGO COLLECTION API on prototype
//////////////////////////////////////////////////////////////////////////////

// Why do we need to overwrite the default insert function?
//
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

var _super = _groundUtil.Collection.prototype.insert;

// Overwrite insert
_groundUtil.Collection.prototype.insert = function(/* arguments */) {
  /*************************************************************************
   *  This function is overwritten by GroundDB - Sorry! but we need an _id *
   *************************************************************************/

  // Convert arguments object into real array
  var args = _.toArray(arguments);

  // Only make sure _id is set if grounddb is mounted
  if (this.grounddb) {
    args[0]._id = args[0]._id || this._makeNewID();
  }

  // Call super
  return _super.apply(this, args);
};
