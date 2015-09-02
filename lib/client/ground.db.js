/*
               ______                           ______  ____
              / ____/________  __  ______  ____/ / __ \/ __ )
             / / __/ ___/ __ \/ / / / __ \/ __  / / / / __  |
            / /_/ / /  / /_/ / /_/ / / / / /_/ / /_/ / /_/ /
            \____/_/   \____/\__,_/_/ /_/\__,_/_____/_____/


GroundDB is a thin layer providing Meteor offline database and methods

Concept, localstorage is simple wide spread but slow

GroundDB saves outstanding methods and minimongo into localstorage at window
unload, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes

Regz. RaiX

*/

/* global Ground: true */
/* global EventEmitter: false */  // raix:eventemitter */
/* global Kernel: false */        // dispatch:kernel */
/* global LocalForage: false */   // raix:localforeage


//////////////////////////////// GROUND DATABASE ///////////////////////////////
Ground = {};

// Global helper for applying grounddb on a collection
Ground.Collection = class GroundCollection extends Mongo.Collection {

  constructor(name, {
    // Ground db options
    version=1.0,
    conflictHandler=UpdateLogic,
    // Default Mongo.Collection options
    connection=undefined,
    idGeneration='STRING',
    transform=undefined,
    _driver=undefined,
    _preventAutopublish=true // Mongo.Collection default is false
  } = {}) {

    if (name !== ''+name || name === '') {
      throw new Meteor.Error('missing-name', 'Ground.Collection requires a collection name');
    }

    super(name, { connection, idGeneration, transform, _driver, _preventAutopublish });

    // Rig an event handler on Meteor.Collection
    this.eventemitter = new EventState();

    // Count for pending write operations
    this.pendingWrites = new ProgressCount();

    // Count for pending read operations
    this.pendingReads = new ProgressCount();

    // Carry last updated at if supported by schema
    this.lastUpdatedAt = null;

    // Is this an offline client only database?
    this.offlineDatabase = (connection === null);

    this.isLoaded = false;

    // Create scoped storage
    this.storage = new LocalForage({
      name: name,
      version: 1.0 // options.version
    });

    // Overwrite default logic on connection
    if (this._connection) {
      // Instanciate update logic
      let updateLogic = new conflictHandler(this);

      this._connection._stores[ this._name ].update = (ddp) => {
        var mongoId = ddp.id && MongoID.idParse(ddp.id);
        var doc = ddp.id && this._collection.findOne(mongoId, {transform: null});

        // remove _id from document
        if (doc) delete doc._id;

        if (ddp.msg === 'replace') {
          if (ddp.replace) {
            if (doc) {
              let fields = DiffSequence.makeChangedFields(ddp.replace, doc);
              delete fields._id;
              updateLogic.changed(mongoId, fields, doc);
            } else {
              updateLogic.added(mongoId, ddp.replace);
            }
          } else {
            updateLogic.removed(mongoId, doc);
          }
        } else if (ddp.msg === 'added') {
          if (doc) {
            let fields = DiffSequence.makeChangedFields(ddp.fields, doc);
            delete fields._id;
            updateLogic.changed(mongoId, fields, doc);
          } else {
            updateLogic.added(mongoId, ddp.fields);
          }
        } else if (ddp.msg === 'changed') {
          if (doc) {
            // let fields = DiffSequence.makeChangedFields(ddp.fields, doc);
            updateLogic.changed(mongoId, ddp.fields, doc);
          } else {
            updateLogic.added(mongoId, ddp.fields);
          }
        } else if (ddp.msg === 'removed') {
          updateLogic.removed(mongoId, doc);
        }
      };

    } // EO Connection update overwrite


    // Auto store updates locally
    this.monitorChanges();

    // Load database from local storage
    this.loadDatabase();
  }

  loadDatabase() {
    // Then load the docs into minimongo
    this.pendingReads.inc();
    this.storage
      .ready(() => {

        this.storage
          .length()
          .then(len => {
            if (len === 0) {
              this.pendingReads.dec();
              Kernel.defer(() => {
                console.log('LOADED');
                this.isLoaded = true;
                this.emitState('loaded', { count: len });
              });
            } else {
              // Update progress
              this.pendingReads.inc(len);
              // Count handled documents
              let handled = 0;
              this.storage
                .iterate((doc, id) => {

                  Kernel.defer(() => {

                    // Add the document to minimongo
                    this._collection._docs._map[id] = doc;

                    // Update progress
                    this.pendingReads.dec();

                    // Check if all documetns have been handled
                    if (++handled === len) {
                      this.invalidate();
                      Kernel.defer(() => {
                        console.log('LOADED');
                        this.isLoaded = true;
                        this.emitState('loaded', { count: len });
                      });
                    }
                  });

                })
                .then(() => {
                  this.pendingReads.dec();
                });
            }

          });
      });
  }

  saveDocument(doc, remove) {
    if (this.isLoaded) {
      this.pendingWrites.inc();

      this.storage
        .ready(() => {

          if (remove) {
            this.storage
              .removeItem(doc._id)
              .then(() => {
                this.pendingWrites.dec();
              });
          } else {
            this.storage
              .setItem(doc._id, doc)
              .then(() => {
                this.pendingWrites.dec();
              });
          }

        });

    }
    // xxx: should we buffer changes?
  }

  getLastUpdated(doc) {
    var result = null;

    if (doc.updatedAt || doc.createdAt || doc.removedAt) {
      result = new Date(Math.max(doc.updatedAt || null, doc.createdAt || null, doc.removedAt || null));
    }

    return result;
  }

  setLastUpdated(lastUpdatedAt) {
    if (lastUpdatedAt) {
      if (this.lastUpdatedAt < lastUpdatedAt || !this.lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt || null;
      }
    }
  }

  monitorChanges() {
    // Store documents to localforage
    this.find({}, {transform: null}).observe({
      'added': doc => {
        this.setLastUpdated(this.getLastUpdated(doc));
        this.saveDocument(doc);
      },
      // If removedAt is set this means the document should be removed
      'changed': (doc, oldDoc) => {
        this.setLastUpdated(this.getLastUpdated(doc));

        if (this.lastUpdatedAt) {
          if (doc.removedAt && !oldDoc.removedAt) {
            // Remove the document completely
            this._collection.remove(doc._id);
            this.saveDocument(doc, true);
          } else {
            this.saveDocument(doc);
          }
        } else {
          this.saveDocument(doc);
        }
      },
      // If lastUpdated is supported by schema we should not use removed
      // any more - rather catch this in the changed event...
      'removed': doc => {
        if (!this.lastUpdatedAt) {
          this.saveDocument(doc, true); }
        }
    });
  }

  shutdown(callback) {
    // xxx: have a better lock / fence
    this.writeFence = true;

    return new Promise(resolve => {
      Tracker.autorun(c => {
        // Wait until all writes have been done
        if (this.pendingWrites.isDone()) {
          c.stop();

          if (typeof callback === 'function') callback();
          resolve();
        }
      });
    });
  }

  invalidate() {
    Object.keys(this._collection.queries)
      .forEach(key => {
        // this._collection.queries[key].changed();
      });
  }


  clear() {
    this.storage.clear();
    //this._collection.remove({}, { multi: true });
    this._collection._docs._map = {};
    this.invalidate();
  }
  //////////////////////////////////////////////////////////////////////////////
  // WRAP EVENTEMITTER API on prototype
  //////////////////////////////////////////////////////////////////////////////

  // Wrap the Event Emitter Api "on"
  on(/* arguments */) {
    return this.eventemitter.on(...arguments);
  }

  // Wrap the Event Emitter Api "once"
  once(/* arguments */) {
    return this.eventemitter.once(...arguments);
  }

  // Wrap the Event Emitter Api "off"
  off(/* arguments */) {
    return this.eventemitter.off(...arguments);
  }

  // Wrap the Event Emitter Api "emit"
  emit(/* arguments */) {
    return this.eventemitter.emit(...arguments);
  }

  // Wrap the Event Emitter Api "emit"
  emitState(/* arguments */) {
    return this.eventemitter.emitState(...arguments);
  }

  // // Add api helpers
  addListener(/* arguments */) {
    return this.eventemitter.on(...arguments);
  }

  removeListener(/* arguments */) {
    return this.eventemitter.off(...arguments);
  }

  removeAllListeners(/* arguments */) {
    return this.eventemitter.off(...arguments);
  }

  // // Add jquery like helpers
  one(/* arguments */) {
    return this.eventemitter.once(...arguments);
  }

  trigger(/* arguments */) {
    return this.eventemitter.emit(...arguments);
  }

};


/**
 * Default update logic - for conflict handling "server-win"
 *
 * This class can be used as a base for building custom conflict
 * handlers.
 */
UpdateLogic = class UpdateLogic {

  constructor(collection) {
    this.collection = collection;
  }

  added(id, doc) {
    this.collection._collection.insert(_.extend({ _id: id }, doc));
  }

  changed(id, fields, oldDoc) {
    if (!_.empty(fields)) {
      this.collection._collection.update({ _id: id }, this.modifier(fields));
    }
  }

  removed(id, oldDoc) {
    this.collection._collection.remove({ _id: id });
  }

  modifier(fields) {
    var mod = {};
    _.each(fields, (value, key) => {
      if (value === undefined) {
        if (!mod.$unset)
          mod.$unset = {};
        mod.$unset[key] = 1;
      } else {
        if (!mod.$set)
          mod.$set = {};
        mod.$set[key] = value;
      }
    });

    return mod;
  }
};
