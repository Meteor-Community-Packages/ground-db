/**
 * This modification lets Mongo.Collection return an
 * already existing named collection.
 *
 * Note: This is a hack
 */
var _MongoCollection = Mongo.Collection;
var _mongoCollections = {};

Mongo.Collection = function(name, options) {
  if (_mongoCollections[name]) return _mongoCollections[name];
  if (name !== null) {
    _mongoCollections[name] = this;
  }

  _MongoCollection.apply(this, _.toArray(arguments));
};

for (var key in _MongoCollection) {
  var obj = _MongoCollection[key];
  Mongo.Collection[key] = obj;
}

Mongo.Collection.prototype = Object.create(_MongoCollection.prototype);
