//////////////////////////////////////////////////////////////////////////////
// WRAP EVENTEMITTER API on prototype
//////////////////////////////////////////////////////////////////////////////

// Wrap the Event Emitter Api "on"
_groundUtil.Collection.prototype.on = function(/* arguments */) {
  return this.eventemitter.on.apply(this.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "once"
_groundUtil.Collection.prototype.once = function(/* arguments */) {
  return this.eventemitter.once.apply(this.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "off"
_groundUtil.Collection.prototype.off = function(/* arguments */) {
  return this.eventemitter.off.apply(this.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "emit"
_groundUtil.Collection.prototype.emit = function(/* arguments */) {
  return this.eventemitter.emit.apply(this.eventemitter, _.toArray(arguments));
};


// Add api helpers
_groundUtil.Collection.prototype.addListener = _groundUtil.Collection.prototype.on;
_groundUtil.Collection.prototype.removeListener = _groundUtil.Collection.prototype.off;
_groundUtil.Collection.prototype.removeAllListeners = _groundUtil.Collection.prototype.off;

// Add jquery like helpers
_groundUtil.Collection.prototype.one = _groundUtil.Collection.prototype.once;
_groundUtil.Collection.prototype.trigger = _groundUtil.Collection.prototype.emit;
