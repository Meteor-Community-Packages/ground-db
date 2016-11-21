/*
               ______                           ______  ____
              / ____/________  __  ______  ____/ / __ \/ __ )
             / / __/ ___/ __ \/ / / / __ \/ __  / / / / __  |
            / /_/ / /  / /_/ / /_/ / / / / /_/ / /_/ / /_/ /
            \____/_/   \____/\__,_/_/ /_/\__,_/_____/_____/


GroundDB is a thin layer providing Meteor offline cached database

When the app loads GroundDB resumes the cached database

Regz. RaiX

*/

/* global EventState: false */    // raix:eventstate
/* global Kernel: false */        // dispatch:kernel


//////////////////////////////// GROUND DATABASE ///////////////////////////////
Ground = {};

import localforage from 'localforage';
import { ProgressCount } from './pending.jobs';
import ServerTime from './servertime';

// Without the Kernel
if (typeof Kernel === 'undefined') {
  var Kernel = {
    defer(f) {
      Meteor.setTimeout(f, 0);
    },
    each(items, f) {
      _.each(items, f);
    },
  };
}

function strId(id) {
  if (id && id._str) {
    return id._str;
  }
  return id;
}

/*
  This function returns a throttled invalidation function binded on a collection
 */
const Invalidate = (collection, wait=100) => {
  return _.throttle(() => {
    Object.keys(collection._collection.queries)
      .forEach(qid => {
        const query = collection._collection.queries[qid];
        if (query) {
          collection._collection._recomputeResults(query);
        }
      });
    collection._collection._observeQueue.drain();
  }, wait);
};

// Global helper for applying grounddb on a collection
Ground.Collection = class GroundCollection {

  constructor(name, {
    // Ground db options
    version=1.0,
    storageAdapter,
    throttle={},
    supportRemovedAt=false, // Experimental, will remove documents with a "removedAt" stamp
    // Default Mongo.Collection options
    // xxx: not implemented yet
    // idGeneration='STRING',
    // transform,
  } = {}) {

    if (name !== ''+name || name === '') {
      throw new Meteor.Error('missing-name', 'Ground.Collection requires a collection name');
    }

    this._collection = new LocalCollection();

    this.throttle = Object.assign({
      invalidate: 60, // Invalidations are throttled by 60ms
    }, throttle);

    // Use soft remove events to remove documents from the ground collection
    // Note: This feature is experimental
    this.supportRemovedAt = supportRemovedAt;

    // Is this an offline client only database?
    this.offlineDatabase = true;

    // Rig an event handler on Meteor.Collection
    this.eventemitter = new EventState();

    // Count for pending write operations
    this.pendingWrites = new ProgressCount();

    // Count for pending read operations
    this.pendingReads = new ProgressCount();

    // Carry last updated at if supported by schema
    this.lastUpdatedAt = null;

    this.isLoaded = false;

    this.pendingOnLoad = [];

    // Create scoped storage
    this.storage = storageAdapter || localforage.createInstance({
      name: name,
      version: 1.0 // options.version
    });

    this.once('loaded', () => {
      if (this.pendingOnLoad.length) {
        const pendingOnLoad = this.pendingOnLoad;
        this.pendingOnLoad = [];
        Kernel.each(pendingOnLoad, (f) => {
          f();
        }, 1000);
      }
    });

    // Create invalidator
    this.invalidate = Invalidate(this, this.throttle.invalidate);

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
                    if (!this._collection._docs._map[id]) {
                      this._collection._docs._map[id] = EJSON.fromJSONValue(doc);

                      // Invalidate the observers pr. document
                      // this call is throttled
                      this.invalidate();
                    }

                    // Update progress
                    this.pendingReads.dec();


                    // Check if all documetns have been handled
                    if (++handled === len) {
                      Kernel.defer(() => {
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

  runWhenLoaded(f) {
    if (this.isLoaded) {
      f();
    } else {
      this.pendingOnLoad.push(f);
    }
  }

  saveDocument(doc, remove) {
    this.pendingWrites.inc();
    doc._id = strId(doc._id);
    this.runWhenLoaded(() => {
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
              .setItem(doc._id, EJSON.toJSONValue(doc))
              .then(() => {
                this.pendingWrites.dec();
              });
          }

        });
    });
  }

  setDocument(doc, remove) {
    doc._id = strId(doc._id);
    if (remove) {
      delete this._collection._docs._map[doc._id];
    } else {
      this._collection._docs._map[doc._id] = EJSON.clone(doc);
    }
    this.invalidate();
  }

  getLastUpdated(doc) {
    if (doc.updatedAt || doc.createdAt || doc.removedAt) {
      return new Date(Math.max(doc.updatedAt || null, doc.createdAt || null, doc.removedAt || null));
    }

    return null;
  }

  setLastUpdated(lastUpdatedAt) {
    if (lastUpdatedAt && this.supportRemovedAt) {
      if (this.lastUpdatedAt < lastUpdatedAt || !this.lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt || null;
      }
    }
  }

  stopObserver() {
    if (this.sourceHandle) {
      this.sourceHandle.stop();
      this.sourceHandle = null;
    }
  }

  observeSource(source=this) {
    // Make sure to remove previous source handle if found
    this.stopObserver();

    const cursor = (typeof (source||{}).observe === 'function') ? source : source.find();
    // Store documents to localforage
    this.sourceHandle = cursor.observe({
      'added': doc => {
        this.setLastUpdated(this.getLastUpdated(doc));
        if (this !== source) {
          this.setDocument(doc);
        }
        this.saveDocument(doc);
      },
      // If removedAt is set this means the document should be removed
      'changed': (doc, oldDoc) => {
        this.setLastUpdated(this.getLastUpdated(doc));

        if (this.lastUpdatedAt) {
          if (doc.removedAt && !oldDoc.removedAt) {
            // Remove the document completely
            if (this !== source) {
              this.setDocument(doc, true);
            }
            this.saveDocument(doc, true);
          } else {
            if (this !== source) {
              this.setDocument(doc);
            }
            this.saveDocument(doc);
          }
        } else {
          if (this !== source) {
            this.setDocument(doc);
          }
          this.saveDocument(doc);
        }
      },
      // If lastUpdated is supported by schema we should not use removed
      // any more - rather catch this in the changed event...
      'removed': doc => {
        if (!this.lastUpdatedAt) {
          if (this !== source) {
            this.setDocument(doc, true);
          }
          this.saveDocument(doc, true); }
        }
    });

    return {
      stop() {
        this.stopObserver();
      }
    };
  }

  shutdown(callback) {
    // xxx: have a better lock / fence
    this.writeFence = true;

    return new Promise(resolve => {
      Tracker.autorun(c => {
        // Wait until all writes have been done
        if (this.pendingWrites.isDone()) {
          c.stop();

          if (typeof callback === 'function') {
            callback();
          }
          resolve();
        }
      });
    });
  }

  clear() {
    this.storage.clear();
    this._collection._docs._map = {};
    this.invalidate();
  }


  /*
    Match the contents of the ground db to that of a cursor, or an array of cursors
   */
  keep(cursors) {
    const arrayOfCursors = (_.isArray(cursors)) ? cursors : [cursors];
    // Map the ground db storage into an array of id's
    const currentIds = Object.keys(this._collection._docs._map);
    // Map each cursor id's into one flat array
    const keepIds = _.flatten(_.map(arrayOfCursors, (cursor) => cursor.map((doc) => strId(doc._id))));
    // Remove all other documents from the collection
    _.each(_.difference(currentIds, keepIds), (id) => {
      // Remove it from in memory
      delete this._collection._docs._map[id];
      // Remove it from storage
      this.saveDocument({ _id: id }, true);
    });

    this.invalidate();
  }

  toJSON() {
    return JSON.stringify(this._collection._docs._map);
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

  find(...args) {
    return this._collection.find(...args);
  }

  findOne(...args) {
    return this._collection.findOne(...args);
  }

  insert(...args) {
    const id = this._collection.insert(...args);
    this.saveDocument(this._collection.findOne(id));
    return id;
  }

  upsert(selector, ...args) {
    const result = this._collection.upsert(selector, ...args);
    this.saveDocument(this._collection.findOne(selector));
    return result;
  }

  update(selector, ...args) {
    const result = this._collection.upsert(selector, ...args);
    this.saveDocument(this._collection.findOne(selector));
    return result;
  }

  remove(selector, ...args) {
    // Order of saveDocument and remove call is not important
    // when removing a document. (why we don't need carrier for the result)
    const doc = this._collection.findOne(selector);
    doc && this.saveDocument(doc, true);
    return this._collection.remove(selector, ...args);
  }

};

export default { Ground };
