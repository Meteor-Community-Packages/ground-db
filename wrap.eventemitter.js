//////////////////////////////////////////////////////////////////////////////
// WRAP EVENTEMITTER API on GroundDB
//////////////////////////////////////////////////////////////////////////////

// Add a top level event emitter
GroundDB.eventemitter = new EventEmitter();

// Wrap the Event Emitter Api "on"
GroundDB.on = function(/* arguments */) {
  GroundDB.eventemitter.on.apply(GroundDB.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "once"
GroundDB.once = function(/* arguments */) {
  GroundDB.eventemitter.once.apply(GroundDB.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "off"
GroundDB.off = function(/* arguments */) {
  GroundDB.eventemitter.off.apply(GroundDB.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "emit"
GroundDB.emit = function(/* arguments */) {
  GroundDB.eventemitter.emit.apply(GroundDB.eventemitter, _.toArray(arguments));
};


// Add api helpers
GroundDB.addListener = GroundDB.on;
GroundDB.removeListener = GroundDB.off;
GroundDB.removeAllListeners = GroundDB.off;

// Add jquery like helpers
GroundDB.one = GroundDB.once;
GroundDB.trigger = GroundDB.emit;
