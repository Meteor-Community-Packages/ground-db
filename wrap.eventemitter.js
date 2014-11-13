//////////////////////////////////////////////////////////////////////////////
// WRAP EVENTEMITTER API on Ground
//////////////////////////////////////////////////////////////////////////////

// Add a top level event emitter
Ground.eventemitter = new EventEmitter();

// Wrap the Event Emitter Api "on"
Ground.on = function(/* arguments */) {
  Ground.eventemitter.on.apply(Ground.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "once"
Ground.once = function(/* arguments */) {
  Ground.eventemitter.once.apply(Ground.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "off"
Ground.off = function(/* arguments */) {
  Ground.eventemitter.off.apply(Ground.eventemitter, _.toArray(arguments));
};

// Wrap the Event Emitter Api "emit"
Ground.emit = function(/* arguments */) {
  Ground.eventemitter.emit.apply(Ground.eventemitter, _.toArray(arguments));
};


// Add api helpers
Ground.addListener = Ground.on;
Ground.removeListener = Ground.off;
Ground.removeAllListeners = Ground.off;

// Add jquery like helpers
Ground.one = Ground.once;
Ground.trigger = Ground.emit;
