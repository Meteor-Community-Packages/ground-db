ground:db [![Build Status](https://travis-ci.org/GroundMeteor/db.png?branch=grounddb-caching-2016)](https://travis-ci.org/GroundMeteor/db)
==========

GroundDB is a fast and thin layer providing Meteor offline database - Taking cloud data to the ground.

## Features
This version of GroundDB is a caching only storage - meaning it does not support resuming of method calls/cross tab updates etc. But it's faster and async supporting local storages like:
* localstorage
* indexeddb
* websql
~* SQLite (on cordova)~

*It's using localforage with some minor modifications - hopefully we can use localForage via npm in the future*

[Notes about migration to GroundDB II](https://github.com/GroundMeteor/db/issues/153#issuecomment-206125703)

## Usage

A pure offline collection
```js
  foo = new Ground.Collection('test');
```
*Ground.Collection is client-side only and depends on `LocalCollection` for now*


Get documents and updates from a Meteor Mongo Collection via DDP
```js
  foo = new Ground.Collection('test');

  foo.observeSource(bar.find());

  Meteor.setTimeout(() => {
    // Stop observing - keeping all documents as is
    foo.stopObserver();
  }, 1000);
```

## Limiting the stored data

If you want to clean up the storage and eg. have it match the current subscription, now you can:
```js
  foo.keep(bar.find());
```
*This will discard all documents not in the subscribed data*


Limit the data stored locally
```js
  foo.keep(bar.find({}, { limit: 30 }));
```
*This will discard all but 30 documents*


Limit the data stored locall using multiple cursors
```js
  foo.keep(bar.find({ type: 'a' }, { limit: 30 }), bar.find({ type: 'b' }, { limit: 30 }));
```
*This will keep at max 60 documents 30 documents of each type "a"/"b"*


## Clear the storage
```js
  foo.clear();
```
*This will empty the in memory and the local storage*


## Need a near backwards compatible solution?

This example behaves much like the previous version of ground db regarding caching a `Mongo.Collection` - This class inforces a manual clean up. Calling `removeLocalOnly()` will keep only the documents in the `Mongo.Collection`.

```js
GroundLegacy = {
  Collection: class GroundLegacy extends Ground.Collection {
    constructor(collection, options) {
      if (!(collection instanceof Mongo.Collection)) {
        throw new Error('GroundLegacy requires a Mongo.Collection');
      }
      if (options.cleanupLocalData !== false) {
        throw new Error('GroundLegacy requires cleanupLocalData to be false');
      }

      // Create an instance of ground db
      super(collection._name);

      this.mongoCollection = collection;

      collection.grounddb = this;

      // Observe on the whole collection
      this.observeSource(collection.find());

      // Store super
      collection.orgFind = collection.find;
      collection.orgFindOne = collection.findOne;

      // Overwrite collection finds using the grounded data
      collection.find = (...args) => {
        return this.find(...args);
      };

      collection.findOne = (...args) => {
        return this.findOne(...args);
      };
    }

    removeLocalOnly() {
      // Remove all documents not in current subscription
      this.keep(this.mongoCollection.orgFind());
    }
  },
};
```

## More

Read about:
* [Events](EVENTS.md) in Ground DB

## Contributions
Feel free to send issues, pull requests all is wellcome

Kind regards Morten
