'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.css_subtract = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  default_options: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/default_options/c.css');
    var expected = grunt.file.read('test/expected/default_options/c.css');
    test.equal(actual, expected, 'Supposed to be identical.');

    test.done();
  },
  custom_options: function(test) {
    test.expect(4);

    var actual = grunt.file.read('tmp/custom_options/c.css');
    var expected = grunt.file.read('test/expected/custom_options/c.css');
    test.equal(actual, expected, 'Supposed to be identical.');
    // check if json files created in tmp folder
    test.ok(grunt.file.exists('tmp/custom_options/c-a.json'), 'File "c-a.json" should exists.');
    test.ok(grunt.file.exists('tmp/custom_options/c-b.json'), 'File "c-b.json" should exists.');
    test.ok(grunt.file.exists('tmp/custom_options/c-c.json'), 'File "c-c.json" should exists.');

    test.done();
  },
};
