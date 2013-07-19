#Local DB
It's a small interface for having a localstorage database with option to get syncronized via a collection. The interface is ultra simple to keep the code as light as posible.

##Creating a localDB object
```js
    var myList = new LocalDB('list');
```
Will create client-side storage only

```js
    var myList = new LocalDB('list', new Meteor.Collection('list'));
```
This will keep the `LocalDB` syncronized with a Meteor collection

##Interface
`LocalDB` is a simple list based database
* `.getItem(id)`
* `.setItem(id, value)`
* `.find(query)`
* `.findAll(query)`
* `.insert()`
* `.remove()`
* `.update()`
* `.upsert()`

