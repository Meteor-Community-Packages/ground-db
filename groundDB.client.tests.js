// Tinytest.add('GroundDB - test environment', function(test) {

//   var a = new Ground.Collection('test', {
//     prefix: 'foobar',
//     connection: null
//   });

// });




// Tinytest.add('GroundDB - test storage', function(test) {
//   // Basic test
//   _gDB.storage.setItem('test', 'test-value');
//   var val = _gDB.storage.getItem('test');
//   // 1
//   test.equal(val, 'test-value');
//   _gDB.storage.removeItem('test');
//   val = _gDB.storage.getItem('test');
//   // 2
//   test.equal(val, null);

//   // set test prefix
//   _gDB._prefix = 'test.';
//   // 3
//   test.equal(_gDB._getGroundDBPrefix('suffix'), 'test.suffix', '_getGroundDBPrefix error');

//   _gDB._prefix = 'groundDB.';

//   var testSaveLoad = function(suffix, obj, text) {
//     _gDB._saveObject('suffix', obj);
//     var ret = _gDB._loadObject('suffix');
//     test.isTrue(equals(obj, ret), text);
//   };

//   // Test Objects IO
//   testSaveLoad('suffix', 1, 'Error testing ');
//   testSaveLoad('suffix', 'Hello', 'Error testing ');
//   testSaveLoad('suffix', { 3: 'Test' }, 'Error testing ');
//   testSaveLoad('suffix', [1, 2, 3], 'Error testing ');
//   testSaveLoad('suffix', -1, 'Error testing ');

// });

// Tinytest.addAsync('GroundDB - Test local storage', function(test, completed) {
//   localStorage.clear();

//   var foo = new GroundDB('test_foo', {
//     connection: null
//   });

//   // Empty test collection
//   foo.find().forEach(function(doc) {
//     foo.remove({ _id: doc._id });
//   });

//   var local;

//   foo.insert({ foo: 'bar' });

//   var item = foo.findOne();

//   test.isTrue(!!item, 'No documents found...');
//   if (item) {
//     test.equal(item.foo, 'bar', 'Invalid document found');
//   }


//   Meteor.setTimeout(function() {

//     var name = 'db.test_foo';

//     console.log('Load:', name);

//     local = _gDB._loadObject(name);

//     var keys = Object.keys(local);
//     var id = keys[0];

//     console.log('Document in localStorage:', local[id]);

//     test.isTrue(!!local[id], 'No documents found...');
//     if (local[id]) {
//       test.equal(local[id].foo, 'bar', 'Invalid document found');
//     }

//     completed();

//   }, 300); // 150
// });

// Tinytest.addAsync('GroundDB - Test prefixed local storage', function(test, completed) {
//   localStorage.clear();

//   var foo = new GroundDB('test_foo', {
//     connection: null,
//     prefix: 'test.'
//   });

//   // Empty test collection
//   foo.find().forEach(function(doc) {
//     foo.remove({ _id: doc._id });
//   });

//   var local;

//   foo.insert({ foo: 'bar' });

//   var item = foo.findOne();

//   test.isTrue(!!item, 'No documents found...');
//   if (item) {
//     test.equal(item.foo, 'bar', 'Invalid document found');
//   }


//   Meteor.setTimeout(function() {

//     var name = 'db.test.test_foo';

//     console.log('Load:', name);

//     local = _gDB._loadObject(name);

//     var keys = Object.keys(local);
//     var id = keys[0];

//     console.log('Document in localStorage:', local[id]);

//     test.isTrue(!!local[id], 'No documents found...');
//     if (local[id]) {
//       test.equal(local[id].foo, 'bar', 'Invalid document found');
//     }

//     completed();

//   }, 300); // 150
// });


// Tinytest.add('GroundDB - Array.isArray', function(test) {
//   // all following calls return true
//   test.isTrue(Array.isArray([]));
//   test.isTrue(Array.isArray([1]));
//   test.isTrue(Array.isArray( new Array() ));
//   test.isTrue(Array.isArray( Array.prototype )); // Little known fact: Array.prototype itself is an array.

//   // all following calls return false
//   test.isFalse(Array.isArray());
//   test.isFalse(Array.isArray({}));
//   test.isFalse(Array.isArray(null));
//   test.isFalse(Array.isArray(undefined));
//   test.isFalse(Array.isArray(17));
//   test.isFalse(Array.isArray("Array"));
//   test.isFalse(Array.isArray(true));
//   test.isFalse(Array.isArray(false));
//   test.isFalse(Array.isArray({ __proto__ : Array.prototype }));

// });


//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equalactual, expected, message, not
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)
