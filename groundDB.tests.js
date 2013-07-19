"use strict";

function equals(a, b) {
	return !!(JSON.stringify(a) === JSON.stringify(b));
}

Tinytest.add('GroundDB test queryString', function(test) {
  test.isTrue(typeof GroundDB === 'function', 'GroundDB not a function?');
  test.isTrue(typeof _storage === 'function', '_storage not a function?');
  test.equal(packageScope, 'ok', 'Cant reach package scope');
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
