Ground DB
=========
GroundDB is a fast and thin layer providing Meteor offline database and methods - Taking cloud data to the ground.

##Creating a GroundDB object
```js

  // Return a grounded Meteor.Collection
  var list = new GroundDB('list');

  or

  // Get the groundDB of existing Meteor.Collection
  var list = new Meteor.Collection('list');
  var groundList = new GroundDB(list);

  or

  // Ground an existing Meteor.Collection  
  var list = new Meteor.Collection('list');
  // just ground the database:
  GroundDB(list);
```
*Example of different patterns. Grounding a `Meteor.Collection` will attach the `cache`, `resume` and `cross tabs update offline`*

[Live basic test](http://grounddb.meteor.com/)

##Features:
* Ligth footprint
* Broad browser support Chrome, Safari, Firefox and Internet Explorer 9
* Fallback to normal Meteor.Collection if no localstorage
* Resume of changes in collections
* Resume of methods
* Works offline updating cross window tabs
* Support for SmartCollection *(unconfirmed)*

##Support
Tested on Chrome, Safari, Firefox and IE9 *(though appcache is not supported in IE9 tabs are updated when offline)* - but all browsers that support localstorage *contains a FF safe test of localstorage*

If localstorage is not supported the groundDB simply work as a normal `Meteor.Collection`

##Meteor Collection Interface
GroundDB is like a normal `Meteor.Collection` - but changes and outstanding methods are cached and resumed.

##Concept
Localstorage is simple and widely supported - but slow - *Thats why we only use it for caching databases and methods + trying to limit the read and writes from it.*

GroundDB saves outstanding methods and minimongo db into localstorage - The number of saves is minimized. *It's less than a save pr. change*

When the app loads GroundDB resumes methods and database changes - made when offline and browser closed.

##Ground user details
It's possible to mount an allready existing collection on a `groundDB` eg.:
```js
  Meteor.users = new GroundDB(Meteor.users);
```
*The example will keep `Meteor.user()` returning correct user details - even if offline - Supports smartCollections by this option too*

##Security
GroundDB works just like a normal `Meteor.Collection` why `allow` and `deny` still works.

##Resume of outstanding methods
Database changes and methods will be sent to the server just like normal. The methods are sent to server after relogin - this way `this.userId` isset when running on the server. In other words: `Just like normal`

##Events
The event api is as follows:
~~~js
GroundDB.onQuotaExceeded = function() {};
GroundDB.onResumeDatabase = function(name) {};
GroundDB.onResumeMethods = function() {};
GroundDB.onMethodCall = function(methodCall) {};
GroundDB.onCacheDatabase = function(name) {};
GroundDB.onCacheMethods = function() {};
GroundDB.onTabSync = function(key) {};
~~~

##Future
* At the moment the conflict resolution is pretty basic last change recieved by server wins. This could be greatly improved by adding a proper conflict handler. *For more details look at comment in server.js*

##Contributions
Feel free to send issues, pull requests all is wellcome

Kind regards Morten

