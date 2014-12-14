ground:db [![Build Status](https://travis-ci.org/GroundMeteor/db.png?branch=Meteor-0-9-1)](https://travis-ci.org/GroundMeteor/db) [![Deps Status](http://checkdeps.meteor.com/badge/GroundMeteor/db/Meteor-0-9-1)](http://checkdeps.meteor.com/GroundMeteor/db) 
==========

GroundDB is a fast and thin layer providing Meteor offline database and methods - Taking cloud data to the ground.

```js
  // Return a grounded Meteor.Collection
  var list = new Ground.Collection('list');
```

##Meteor Collection Interface
GroundDB is like a normal `Meteor.Collection` - but changes and outstanding methods are cached and resumed.

[Live basic debug test](http://grounddb.meteor.com/)

##Features:
* Light footprint
* Broad browser support Chrome, Safari, Firefox and Internet Explorer 9
* Fallback to normal Meteor.Collection if no local storage
* Resume of changes in collections
* Resume of methods
* Works offline updating cross window tabs
* Support for [SmartCollection](https://github.com/arunoda/meteor-smart-collections)
* Support for offline client-side only databases
* Uses `EJSON.minify` and `EJSON.maxify` to compress data in localstorage
* *In the future there will be a customizable conflict handler on the server-side*

##Creating a Ground.Collection object (variants)
```js

  // Return a grounded Meteor.Collection
  var list = new Ground.Collection('list');

  or

  // Get the groundDB of existing Meteor.Collection
  var list = new Meteor.Collection('list');
  var groundList = new Ground.Collection(list);

  or

  // Ground an existing Meteor.Collection  
  var list = new Meteor.Collection('list');
  // just ground the database:
  Ground.Collection(list);
```
*Example of different patterns. Grounding a `Meteor.Collection` will attach the `cache`, `resume` and `cross tabs update offline`*

##Pure client-side offline databases (variants)
Ground.Collection can be applied on client-side only eg.: `new Meteor.Collection(null);`
```js

  // Creates client-side only database, this one maps on suffix `null`
  var list = new Ground.Collection(null);

  // Creates client-side only database, this one maps on suffix `list` *(Meteor 0.6.5+)*
  var list = new Ground.Collection('list', { connection: null });
  
  or

  // Get the groundDB of existing Meteor.Collection
  var list = new Meteor.Collection(null);
  var groundList = new Ground.Collection(list, 'list');

  or

  // Ground an existing Meteor.Collection  
  var list = new Meteor.Collection(null);
  // just ground the database and map on suffix `list`
  Ground.Collection(list, 'list');
```
*You can only have one grounded collection with name null*

##Support
Tested on Chrome, Safari, Firefox and IE9 *(though appcache is not supported in IE9 tabs are updated when offline)* - but all browsers that support localstorage *contains a FF safe test of localstorage*

If localstorage is not supported the groundDB simply work as a normal `Meteor.Collection`

##Concept
Localstorage is simple and widely supported - but slow - *Thats why we only use it for caching databases and methods + trying to limit the read and writes from it.*

GroundDB saves outstanding methods and minimongo db into localstorage - The number of saves to localstorage is minimized. *Use `Ground.resumeMethods`*

When the app loads GroundDB resumes methods and database changes - made when offline and browser closed.

##Ground user details
It's possible to mount an allready existing collection on a `groundDB` eg.:
```js
  Ground.Collectino(Meteor.users);
```
*The example will keep `Meteor.user()` returning correct user details - even if offline*

##Ground SmartCollections
It's possible to ground an allready existing `smartCollectin` on a `groundDB` eg.:
```js
  var mySmartCollection = new SmartCollection('foo');
  Ground.Collection(mySmartCollection);

or

  var mySmartCollection = Ground.Collection(new SmartCollection('foo'));

  // use the smart collection
  mySmartCollection.insert(/* stuff */);
```

##Resume of outstanding methods
Database changes and methods will be sent to the server just like normal. The methods are sent to server after relogin - this way `this.userId` isset when running on the server. In other words: `Just like normal`

##Publish and subscription
###Online
Subscription behavior when using `GroundDB` - When online it's just like normal `Meteor` so nothing new. If you unsubscribe a collection you can still insert etc. but the data will not be visible on the client.
###Offline
When offline the data remains in the local database - since the publish is a server thing. Use the query selector for filtering unwanted data.
*When reconnected the database will update client subscription and changes will be resumed*

##Events *- client-side*
The event api is as follows:
```js
Ground.lookup = function(collectionName) {};
Ground.methodResume = function(names, connection) {};

Ground.addListener // Listen to general events
foo.addListener // Add listener specific to the foo collection

// Reactive status of all subscriptions, ready or not:
Ground.ready();
```

DEPRECATED API:
~~Ground.onQuotaExceeded = function() {};~~
~~Ground.onResumeDatabase = function(name) {};~~
~~Ground.onResumeMethods = function() {};~~
~~Ground.onMethodCall = function(methodCall) {};~~
~~Ground.onCacheDatabase = function(name) {};~~
~~Ground.onCacheMethods = function() {};~~
~~Ground.onTabSync = function(key) {};~~
~~Ground.skipMethods = function(methodsToSkipObject)~~

## Cache methods
Use the `Ground.methodResume` to cache method calls on a collection. It takes the method name or array of names. The connection is optional if not set the default connection is used:
```js
  // This is how grounddb uses this internally
  Ground.methodResume([
    '/' + self.name + '/insert',
    '/' + self.name + '/remove',
    '/' + self.name + '/update'
  ], self.connection);
```
*The `Ground.skipMethods` is deprecated*

##Conflict handling *IN the works - not ready for use yet*
The conflict handling api is as follows:
```js
Ground.now(); // Returns server timestamp works on both client and server
```

##Future
* At the moment the conflict resolution is pretty basic last change recieved by server wins. This could be greatly improved by adding a proper conflict handler. *For more details look at comment in server.js*
* Intelligent subscriptions - A way for the groundDB to keep the data most important for the user - and letting less important data go to match quota limit

##Contributions
Feel free to send issues, pull requests all is wellcome

Kind regards Morten

