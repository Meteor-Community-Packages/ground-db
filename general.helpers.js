
GroundDB.ready = function() {
  _gDB.subscriptionsReadyDeps.depend();
  return _gDB.subscriptionsReady;
};

GroundDB.saveObject = _gDB._saveObject;

GroundDB.loadObject = _gDB._loadObject;

// Methods to skip from caching
_gDB.skipThisMethod = { login: true, getServerTime: true };

// Add settings for methods to skip or not when caching methods
GroundDB.skipMethods = function(methods) {
  if (typeof methods !== 'object') {
    throw new Error('skipMethods expects parametre as object of method names to skip when caching methods');
  }
  for (var key in methods) {
    if (methods.hasOwnProperty(key)) {
      // Extend the skipMethods object keys with boolean values
      _gDB.skipThisMethod[key] = !!methods[key];
    }
  }
};

GroundDB.OneTimeout = _gDB.OneTimeout;

