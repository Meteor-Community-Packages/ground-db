#Ground DB
GroundDB is a thin layer providing Meteor offline database and methods

##Creating a GroundDB object
```js
  var list = new GroundDB('list');
```

##Meteor Collection Interface
* `.find`
* `.findOne`
* `.insert`
* `.remove`
* `.update`
* `.allow`
* `deny`

##Concept
Localstorage is simple and widely supported - but slow

GroundDB saves pr. default outstanding methods and minimongo db into localstorage at window unload event, but can be configured to save at any changes and at certain interval(ms)

When the app loads GroundDB resumes methods and database changes - made when offline and browser closed.

##Options
```js
var list = new GroundDB('list', {
  saveInterval: 5000, // save pr. 5 sec
  saveLive: true // save at any data change in subscribed collection
  conflictHandler: function(clientDocument, serverDocument)
});
```

##Conflict Handler
Heres the default conflict handler, the strategy is to let the server document allways win.
```
_defaultConflictHandler = function(clientDoc, serverDoc) {
  // Strategy: Server allways wins

  // If document is found on client
  if (clientDoc) {
    // Then remove
    this.remove(clientDoc._id);
  }
  // And insert the server document
  this.insert(serverDoc);
};
```
*If one wants the newest to win - then have a time diff between the server and client for calculating a server timestamp. When inserting new documents on the client use the diff to calculate the server timestamp. The conflict handler can then go and compare server time stamps and let the newest win*

##Possible issue not tested
* I havent tested how accounts fit in - I guess if user is not logged in when methods and changes resume - might get "Access denied"?