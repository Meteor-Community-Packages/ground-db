Ground DB
=========
GroundDB is a fast and thin layer providing Meteor offline database and methods

##Creating a GroundDB object
```js
  var list = new GroundDB('list');
```

[Live basic test](http://grounddb.meteor.com/)

##Features:
* Ligth footprint
* Broad browser support Chrome, Safari, Firefox
* Fallback to normal Meteor.Collection
* Resume of changes in collections
* Resume of methods
* Works offline cross window tabs

##Support
Tested on Chrome, Safari, Firefox - but all browsers that support localstorage *contains a FF safe test of localstorage*
If localstorage is not supported the groundDB would simply work as a normal `Meteor.Collection`

##Meteor Collection Interface
GroundDB is like a normal Meteor.Collection - but changes and outstanding methods are cached and resumed.

##Concept
Localstorage is simple and widely supported - but slow

GroundDB saves outstanding methods and minimongo db into localstorage - The number of saves is minimized. *It's less than a save pr. change*

When the app loads GroundDB resumes methods and database changes - made when offline and browser closed.

##Options
It's possible to mount an allready existing collection on a `groundDB` eg.:
```js
  Meteor.users = new GroundDB('users', {
    collection: Meteor.users
  });
```
*The example will keep `Meteor.user()` returning correct user details*

##Security
GroundDB works just like a normal `Meteor.Collection` why `allow` and `deny` still works.

##Resume of outstanding methods
Database changes and methods will be sent to the server just like normal. The methods are sent to server after relogin - this way `this.userId` isset when running on the server. In other words: `Just like normal`

##Future
* At the moment the conflict resolution is pretty basic last change recieved by server wins. This could be greatly improved by adding a proper conflict handler. *For more details look at comment in server.js*
* Havent tested it on IE

##Contributions
Feel free to send issues, pull requests all is wellcome

Kind regards Morten

