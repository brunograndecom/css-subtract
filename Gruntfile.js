/*
 * grunt-css-subtract
 * https://github.com/brunograndecom/css-subtract
 *
 * Copyright (c) 2016 brn. - Barna Nagy
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // // @TODO: setup minification
    // // Minify css files before and after
    // cssmin: {
    //   options: {
    //
    //   },
    //   target: {
    //     files: {
    //       'output.css': ['foo.css', 'bar.css']
    //     }
    //   }
    // },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    css_subtract: {
      default_options: {
        options: {
        },
        files: {
          'tmp/default_options/c.css': ['test/fixtures/b.css']
        }
      },
      custom_options: {
        options: {
          writeJson : true,
          coreCss: 'test/fixtures/a.css'
        },
        files: {
          // Test whether multiply files get concatenated.
          'tmp/custom_options/c.css': ['test/fixtures/b1.css', 'test/fixtures/b2.css']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  // grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'css_subtract', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
