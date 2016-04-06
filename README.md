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


## Contributions
Feel free to send issues, pull requests all is wellcome

Kind regards Morten
