"use strict";

_storage = function() {
  var storage,
      fail,
      uid;
  try {
    uid = new Date();
    (storage = window.localStorage).setItem(uid, uid);
    fail = (storage.getItem(uid) !== uid);
    storage.removeItem(uid);
    if (fail) {
      storage = false;
    }
  } catch(e) {}

  return storage;
};

var hidden = 'ok';


GroundDB = function() {
	var self = this;

  self.storage = _storage();



  // Load the localstorage into list

  /*
    connect to collection
    when is collection loaded - listen to subscription

    first we commit all local changes to collection (only new ones - get a
    server timestamp)

    then we listen to the collection, at change we update groundDB + storage if
    there


  */


  /*
  Bulk Load data from local to memory
  */
  self._loadData = function() {
    if (self.storage) {

    }
  };

  /*
  Bulk Save data from memory to local
  */
  self._loadData = function() {
    if (self.storage) {

    }
  };

  self.find = function() {};

  self.findAll = function() {};

  self.remove = function() {};

  self.update = function() {};

  self.upsert = function() {};

  self.allow = function() {};

  self.deny = function() {};


  return self;
};
