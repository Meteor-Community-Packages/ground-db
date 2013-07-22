// @export GroundDB
GroundDB = function(name, options) {
  // Inheritance Meteor Collection can be set by options.collection
  return (options && options.collection &&
          options.collection instanceof Meteor.Collection) ?
          options.collection : new Meteor.Collection(name, options);
};
