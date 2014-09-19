//////////////////////////////////////////////////////////////////////////////
// WRAP EVENTEMITTER API on prototype
//////////////////////////////////////////////////////////////////////////////

// Wrap the Event Emitter Api "on"
GroundDB.prototype.on = function(/* arguments */) {
  return this.eventemitter.on.apply(this.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "once"
GroundDB.prototype.once = function(/* arguments */) {
  return this.eventemitter.once.apply(this.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "off"
GroundDB.prototype.off = function(/* arguments */) {
  return this.eventemitter.off.apply(this.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "emit"
GroundDB.prototype.emit = function(/* arguments */) {
  return this.eventemitter.emit.apply(this.eventemitter, _.toArray(arguments));
};


// Add api helpers
GroundDB.prototype.addListener = GroundDB.prototype.on;
GroundDB.prototype.removeListener = GroundDB.prototype.off;
GroundDB.prototype.removeAllListeners = GroundDB.prototype.off;

// Add jquery like helpers
GroundDB.prototype.one = GroundDB.prototype.once;
GroundDB.prototype.trigger = GroundDB.prototype.emit;
