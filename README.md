# grunt-css-subtract

> Grunt plugin to subtract a css file from another. (A - B = C)

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-css-subtract --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-css-subtract');
```

## The "css_subtract" task

### Overview
In your project's Gruntfile, add a section named `css_subtract` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  css_subtract: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.writeJson
Type: `Boolean`
Default value: `false`

A boolean value to write `json` files as well.

#### options.coreCss
Type: `String`
Default value: `core.min.css`

A string value to set main `css` file. Other file(s) will be subtracted from this. (`**A** - B = C`)

### Usage Examples

#### Default Options
In this example, the default options are used to do a subtraction. (`A - B = C`)

So in that case
* A falls back to default=`./core.min.css`,
* B is `test/fixtures/b.css`,
* and C, the result will be `tmp/default_options/c.css`.

```js
grunt.initConfig({
  css_subtract: {
    options: {},
    files: {
      'tmp/default_options/c.css': ['test/fixtures/b.css']
    }
  }
});
```

#### Custom Options
In this example, the custom options are used to do a subtraction. (`A - B = C`)

So in that case
* A will be the specified file: `test/fixtures/a.css`,
* B will be a concatenation of `test/fixtures/b1.css` and `test/fixtures/b2.css`,
* and C, the result will be saved to `tmp/custom_options/c.css`.

We've also set `writeJson` to `true`, so `json` outputs will be generated as: `tmp/custom_options/c-a.json`, `tmp/custom_options/c-b.json`, `tmp/custom_options/c-c.json`.

```js
grunt.initConfig({
  css_subtract: {
    options: {
      writeJson : true,
      coreCss: 'test/fixtures/a.css'
    },
    files: {
      'tmp/custom_options/c.css': ['test/fixtures/b1.css', 'test/fixtures/b2.css']
    }
  }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2016 brn. - Barna Nagy

Licensed under the MIT license.

## Release History
* 2016-04-20   v0.1.0   First, initial release.
* 2016-04-25   v0.2.0   More accurate subtraction, works with merged selectors.
