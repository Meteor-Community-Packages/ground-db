///////////////////////////// RESUME METHODS ///////////////////////////////////

// Is methods resumed?
_gDB._methodsResumed = false;

// Get a nice array of current methods
_gDB._getMethodsList = function() {
  // Array of outstanding methods
  var methods = [];
  // Made a public API to disallow caching of some method calls
  // Convert the data into nice array
  _.each(_gDB.connection._methodInvokers, function(method) {
    if (!_gDB.skipThisMethod[method._message.method]) {
      // Dont cache login or getServerTime calls - they are spawned pr. default
      methods.push({
        // Format the data
        method: method._message.method,
        args: method._message.params,
        options: { wait: method._wait }
      });
    }
  });
  return methods;
};

// Flush in memory methods, its a dirty trick and could have some edge cases
// that would throw an error? Eg. if flushed in the middle of waiting for
// a method call to return - the returning call would not be able to find the
// method callback. This could happen if the user submits a change in one window
// and then switches to another tab and submits a change there before the first
// method gets back?
_gDB._flushInMemoryMethods = function() {
  var didFlushSome = false;
  // TODO: flush should be rewritten to - we should do method proxy stuff...
  // This code is a bit dirty
  if (_gDB.connection && _gDB.connection._outstandingMethodBlocks &&
          _gDB.connection._outstandingMethodBlocks.length) {

    // Clear the in memory outstanding methods TODO: Check if this is enough
    // Check to see if we should skip methods
    for (var i = 0; i < _gDB.connection._outstandingMethodBlocks.length; i++) {
      var method = _gDB.connection._outstandingMethodBlocks[i];
      if (method && method._message && !_gDB.skipThisMethod[method._message.method]) {
        // Clear invoke callbacks
//    _gDB.connection._outstandingMethodBlocks = [];
        delete _gDB.connection._outstandingMethodBlocks[i];
//    _gDB.connection._methodInvokers = {};
        delete _gDB.connection._methodInvokers[i];
        // Set the flag to call back
        didFlushSome = true;
      }
    }
    if (didFlushSome) {
      // Call the event callback
      self.emit('flushInMemoryMethods');
    }

  }
};

// Extract only newly added methods from localstorage
_gDB._getMethodUpdates = function(newMethods) {
  var result = [];
  if (newMethods && newMethods.length > 0) {
    // Get the old methods allready in memory
    // We could have done an optimized slice version or just starting at
    // oldMethods.length, but this tab is not in focus
    var oldMethods = _gDB._getMethodsList();
    // We do a check to see if we should flush our in memory methods if allready
    // run on an other tab - an odd case - the first item would not match in
    // old methods and new methods, its only valid to make this test if both
    // methods arrays are not empty allready
    if (oldMethods.length &&
            EJSON.stringify(oldMethods[0]) !== EJSON.stringify(newMethods[0])) {
      // Flush the in memory / queue methods
      _gDB._flushInMemoryMethods();
      // We reset the oldMethods array of outstanding methods
      oldMethods = [];
    }
    // Iterate over the new methods, old ones should be ordered in beginning of
    // newMethods we do a simple test an throw an error if thats not the case
    for (var i=0; i < newMethods.length; i++) {

      if (i < oldMethods.length) {
        // Do a hard slow test to make sure all is in sync
        if (EJSON.stringify(oldMethods[i]) !== EJSON.stringify(newMethods[i])) {
          // The client data is corrupted, throw error or force the client to
          // reload, does not make sense to continue?
          throw new Error('The method database is corrupted or out of sync at position: ' + i);
        }
      } else {
        // Ok out of oldMethods this is a new method call
        result.push(newMethods[i]);
        self.emit('methodCall', newMethods[i]);
      }
    } // EO for iteration
  } else {
    // If new methods are empty this means that the other client / tap has
    // Allready sendt and recieved the method calls - so we flush our in mem
    // Flush the in memory / queue methods
    _gDB._flushInMemoryMethods();
  }
  // return the result
  return result;
};
