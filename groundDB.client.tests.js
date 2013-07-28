"use strict";

function equals(a, b) {
	return !!(JSON.stringify(a) === JSON.stringify(b));
}

Tinytest.add('GroundDB - test environment', function(test) {
  test.isTrue(typeof _gDB === 'object', "_gDB not defined");
  test.isTrue(typeof _gDB.connection === 'object', "_gDB.connection not defined");
  test.isTrue(typeof _gDB.idParse === 'function', "_gDB.idParse not defined");
  test.isTrue(typeof _gDB.storage === 'object', "_gDB.storage not defined");
  test.isTrue(typeof _gDB === 'object', "_gDB not defined");
  test.equal(_gDB._prefix, 'groundDB.', '_gDB._prefix is changed');
});

Tinytest.add('GroundDB - test storage', function(test) {
  // Basic test
  _gDB.storage.setItem('test', 'test-value');
  var val = _gDB.storage.getItem('test');
  test.equal(val, 'test-value');
  _gDB.storage.removeItem('test');
  val = _gDB.storage.getItem('test');
  test.equal(val, null);

  // set test prefix
  _gDB._prefix = 'test.';
  test.equal(_gDB._getGroundDBPrefix('suffix'), 'test.suffix', '_getGroundDBPrefix error');

  var testSaveLoad = function(suffix, obj, text) {
    _gDB._saveObject('suffix', obj);
    var ret = _gDB._loadObject('suffix');
    test.isTrue(equals(obj, ret), text);
  };

  // Test Objects IO
  testSaveLoad('suffix', 1, 'Error testing ');
  testSaveLoad('suffix', 'Hello', 'Error testing ');
  testSaveLoad('suffix', { 3: 'Test' }, 'Error testing ');
  testSaveLoad('suffix', [1, 2, 3], 'Error testing ');
  testSaveLoad('suffix', -1, 'Error testing ');

});

Tinytest.add('GroundDB - minify maxify', function(test) {
  var testMinMax = function(obj) {
    var mini = _gDB.minify(obj);
    var ejsonMini = EJSON.stringify(obj);
    test.isTrue(mini.length <= ejsonMini.length, 'minify is bigger than ejson...');
    test.notEqual(mini, obj, 'Minify error - not difference between input an output');
    var maxi = _gDB.maxify(mini);
    test.notEqual(mini, maxi, 'Maxify error - not difference between input an output');
    test.equal(obj, maxi, 'input object is not the same as returned object');
  };

  testMinMax({a: 3});
});


Tinytest.add('GroundDB - Array.isArray', function(test) {
  // all following calls return true
  test.isTrue(Array.isArray([]));
  test.isTrue(Array.isArray([1]));
  test.isTrue(Array.isArray( new Array() ));
  test.isTrue(Array.isArray( Array.prototype )); // Little known fact: Array.prototype itself is an array.

  // all following calls return false
  test.isFalse(Array.isArray());
  test.isFalse(Array.isArray({}));
  test.isFalse(Array.isArray(null));
  test.isFalse(Array.isArray(undefined));
  test.isFalse(Array.isArray(17));
  test.isFalse(Array.isArray("Array"));
  test.isFalse(Array.isArray(true));
  test.isFalse(Array.isArray(false));
  test.isFalse(Array.isArray({ __proto__ : Array.prototype }));

});


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
