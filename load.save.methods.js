///////////////////////////// LOAD & SAVE METHODS //////////////////////////////

// load methods from localstorage and resume the methods
_gDB._loadMethods = function() {
  // Load methods from local
  var methods = _gDB._loadObject('methods');

  // We are only going to submit the diff
  methods = _gDB._getMethodUpdates(methods);

  // If any methods outstanding
  if (methods) {
    // Iterate over array of methods
    //_.each(methods, function(method) {
    while (methods.length > 0) {
      // FIFO buffer
      var method = methods.shift();

      // parse "/collection/command" or "command"
      var params = method.method.split('/');
      var collection = params[1];
      var command = params[2];

      // Do work on collection
      if (collection && command) {
        // we are going to run an simulated insert - this is allready in db
        // since we are running local, so we remove it from the collection first
        if (_gDB._groundDatabases[collection]) {
          // The database is registered as a ground database
          var mongoId = _gDB.idParse((method.args && method.args[0])?
                  method.args[0]._id || method.args[0]:'');
          // Get the document on the client - if found
          var doc = _gDB._groundDatabases[collection]._collection.findOne(mongoId);
          if (doc) {
            // document found
            // This is a problem: insert stub simulation, would fail so we
            // remove the added document from client and let the method call
            // re-insert it in simulation
            if (command === 'insert') {
              // Remove the item from ground database so it can be correctly
              // inserted
              _gDB._groundDatabases[collection]._collection.remove(mongoId);
              // We mark this as remote since we will be corrected if it's
              // Wrong + If we don't the data is lost in this session.
              // So we remove any localOnly flags
              delete _gDB._groundDatabases[collection]._localOnly[mongoId];
            } // EO handle insert

          } // EO Else no doc found in client database
        } // else collection would be a normal database
      } // EO collection work
      // Add method to connection
      _gDB.connection.apply(
              method.method, method.args, method.options);
    } // EO while methods
  } // EO if stored outstanding methods

  // Dispatch methods loaded event
  _gDB._methodsResumed = true;
  self.emit('resumeMethods');
}; // EO load methods

// Save the methods into the localstorage
_gDB._saveMethods = function() {
  if (_gDB._methodsResumed) {
    // Ok memory is initialized
    self.emit('cacheMethods');

    // Save outstanding methods to localstorage
    _gDB._saveObject('methods', _gDB._getMethodsList());
  }
};

//////////////////////////// STARTUP METHODS RESUME ////////////////////////////

Deps.autorun(function(computation) {
  if (GroundDB.ready()) {
    // Stop the auto run
    computation.stop();
    // Load the methods
    _gDB._loadMethods();
  }
});

/////////////////////// ADD TRIGGERS IN LIVEDATACONNECTION /////////////////////

// Modify connection, well just minor
_.extend(_gDB.connection, {
  // Define a new super for the methods
  _gdbSuper: {
    apply: _gDB.connection.apply,
    _outstandingMethodFinished:
    _gDB.connection._outstandingMethodFinished
  },
  // Modify apply
  apply: function(/* arguments */) {
    var self = this;
    // Intercept grounded databases
  //  var args = _interceptGroundedDatabases(arguments);
    // Call super
    self._gdbSuper.apply.apply(self, arguments);
    // Save methods
    _gDB._saveMethods();
  },
  // Modify _outstandingMethodFinished
  _outstandingMethodFinished: function() {
    var self = this;
    // Call super
    self._gdbSuper._outstandingMethodFinished.apply(self);
    // We save current status of methods
    _gDB._saveMethods();
  }
});
