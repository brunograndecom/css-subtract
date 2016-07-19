/**
 * grunt-css-subtract
 * https://github.com/brunograndecom/css-subtract
 *
 * Copyright (c) 2016 brn. - Barna Nagy
 * Licensed under the MIT license.
 */

'use strict';

var parse = require('css-parse');

module.exports = function(grunt) {

  grunt.registerMultiTask('css_subtract', 'Grunt plugin to subtract a css file from another.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var srcCwd = this.files[0].src[0].substr(0,this.files[0].src[0].lastIndexOf("\/")+1);
    var options = this.options({
      writeJson : false,
      coreCss   : srcCwd + 'core.min.css'
    });

    var core = {};
    core.src = [options.coreCss];

    // Open core css file
    var src1 = core.src

    .filter(function(filepath) {
      // Warn on and remove invalid source files (if non was set).
      if (!grunt.file.exists(filepath)) {
        grunt.log.warn('Source file "' + filepath + '" not found.');
        return false;
      } else if (filepath.substr(filepath.lastIndexOf('.') + 1) !== 'css') {
        grunt.log.warn('Source file extension mismatch. Target file "' + filepath + '" supposed to be "css".');
        return false;
      } else {
        return true;
      }
    })
    .map(function(filepath) {
      // Read file source.
      return grunt.file.read(filepath);
    }).join('');

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {

      // Concat specified files to subtract from core.
      var src2 = f.src

      .filter(function(filepath) {
        // Warn on and remove invalid source files (if non was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else if (filepath.substr(filepath.lastIndexOf('.') + 1) !== 'css') {
          grunt.log.warn('Source file extension mismatch. Target file "' + filepath + '" supposed to be "css".');
          return false;
        } else {
          return true;
        }
      })
      .map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join('');

      var data1 = parse(src1),
          data2 = parse(src2);

      var obj1 = JSON.parse(JSON.stringify(data1)),
          obj2 = JSON.parse(JSON.stringify(data2));

      /**
       * Diff import css declarations, if it's unique, add it to the result
       * @param {Object} stylesheetA - Stylesheet A (C = A - B)
       * @param {Object} stylesheetB - Stylesheet B (C = A - B)
       * @param {Object} stylesheetC - Stylesheet C (C = A - B)
       * @param {Number} i - pointer of Stylesheet A
         * @returns {Object} - result stylesheet (C)
         */
      function diffImport(stylesheetA, stylesheetB, stylesheetC, i) {
        var dup = false;
        for (var j in stylesheetB.rules) {
          if ((stylesheetB.rules[j].type == "import") && (stylesheetB.rules[j].import == stylesheetA.rules[i].import)) {
            dup = true;
          }
        }
        if (!dup) {
          stylesheetC.rules.push(stylesheetA.rules[i]);
        }
        return stylesheetC;
      }

      /**
       * Diff keyframe css declarations, if it's unique, add it to the result
       * @param {Object} stylesheetA - Stylesheet A (C = A - B)
       * @param {Object} stylesheetB - Stylesheet B (C = A - B)
       * @param {Object} stylesheetC - Stylesheet C (C = A - B)
       * @param {Number} i - pointer of Stylesheet A
         * @returns {Object} - result stylesheet (C)
         */
      function diffKeyframes(stylesheetA, stylesheetB, stylesheetC, i) {
        var dup = false;
        for (var j in stylesheetB.rules) {
          if ((stylesheetB.rules[j].type == "keyframes") && (JSON.stringify(stylesheetB.rules[j]) === JSON.stringify(stylesheetA.rules[i]))) {
            dup = true;
          }
        }
        if (!dup) {
          stylesheetC.rules.push(stylesheetA.rules[i]);
        }
        return stylesheetC;
      }

      /**
       * Diff rule css declarations, if it's unique, add it to the result
       * @param {Object} stylesheetA - Stylesheet A (C = A - B)
       * @param {Object} stylesheetB - Stylesheet B (C = A - B)
       * @param {Object} stylesheetC - Stylesheet C (C = A - B)
       * @param {Number} i - pointer of Stylesheet A
         * @returns {Object} - result stylesheet (C)
         */
      function diffRuleDeclarations(stylesheetA, stylesheetB, stylesheetC, i) {
        var dup = false;
        for (var j in stylesheetB.rules) {
          if ((stylesheetB.rules[j].type == "rule") && (JSON.stringify(stylesheetB.rules[j]) === JSON.stringify(stylesheetA.rules[i]))) {
            dup = true;
          }
        }
        if (!dup) {
          stylesheetC.rules.push(stylesheetA.rules[i]);
        }
        return stylesheetC;
      }

      /**
       * Diff media css declarations, if it's unique, add it to the result
       * @param {Object} stylesheetA - Stylesheet A (C = A - B)
       * @param {Object} stylesheetB - Stylesheet B (C = A - B)
       * @param {Object} stylesheetC - Stylesheet C (C = A - B)
       * @param {Number} i - pointer of Stylesheet A
       * @returns {Object} - result stylesheet (C)
       */
      function diffMedia(stylesheetA, stylesheetB, stylesheetC, i) {
        var newRules       = {};
            newRules.type  = "media";
            newRules.media = stylesheetA.rules[i].media;
            newRules.rules = [];

        for (var j in stylesheetB.rules) {
          if ((stylesheetB.rules[j].type == "media") && (stylesheetB.rules[j].media == stylesheetA.rules[i].media)) {
            if (JSON.stringify(stylesheetA.rules[i]) !== JSON.stringify(stylesheetB.rules[j])) {

              var mA = stylesheetA.rules[i];
              var mB = stylesheetB.rules[j];
              var mC = [];

              for (var a in mA.rules) {

                var dup = false;

                for (var b in mB.rules) {
                  if ((mB.rules[b].type == "rule") && (JSON.stringify(mB.rules[b]) === JSON.stringify(mA.rules[a]))) {
                    dup = true;
                  }
                }
                if (!dup) {
                  mC.push(mA.rules[a]);
                }
              }
              newRules.rules = mC;
            }
          }
        }
        if (newRules.rules.length) {
          stylesheetC.rules.push(newRules);
        }
        return stylesheetC;
      }


      /**
       * Separate a multi-declaration rule to single-declaration rules.
       * @param {Object} rule - rule with more than 1 declarations
         * @returns {Array} - array of single-declaration rules
         */
      function processDeclarations(rule) {
        var outRules = [];
        for (var declaration in rule.declarations) {

          var newRule                 = {};
              newRule.type            = "rule";
              newRule.selectors       = rule.selectors;
              newRule.declarations    = [];
              newRule.declarations[0] = rule.declarations[declaration];

          outRules.push(newRule);
        }
        return outRules;
      }

      /**
       * Separate a multi-declaration keyframe to single-declaration keyframes.
       * @param {Object} keyframe - rule with more than 1 declarations
         * @returns {Array} - array of single-declaration rules
         */
      function processKeyframeDeclarations(keyframe) {
        var outKeyframes = [];
        for (var declaration in keyframe.declarations) {

          var newKeyframe                 = {};
              newKeyframe.type            = "keyframe";
              newKeyframe.values          = keyframe.values;
              newKeyframe.declarations    = [];
              newKeyframe.declarations[0] = keyframe.declarations[declaration];

          outKeyframes.push(newKeyframe);
        }
        return outKeyframes;
      }

      /**
       * Explode rules in the stylesheet to have only 1 declaration per rule.
       * @param {Object} ssIn - stylesheet to explode
         * @returns {Object} - the new exploded stylesheet
         */
      function explodeMultiDeclarations(ssIn) {
        var ssOut = {}; ssOut.rules = [];

        for (var rule in ssIn.rules) {
          if (ssIn.rules[rule].type == "rule") {
            if (ssIn.rules[rule].selectors[0] != "@font-face" && ssIn.rules[rule].declarations.length > 1) {
              var t = processDeclarations(ssIn.rules[rule]);
              for (var tR in t) {
                ssOut.rules.push(t[tR]);
              }
            } else {
              ssOut.rules.push(ssIn.rules[rule]);
            }
          }
          else if (ssIn.rules[rule].type == "media") {
            var mediaRule = ssIn.rules[rule];
            for (var mRule in mediaRule.rules) {
              if (mediaRule.rules[mRule].type == "rule") {
                if (mediaRule.rules[mRule].declarations.length > 1) {
                 var t = processDeclarations(mediaRule.rules[mRule]);
                  for (var tR in t) {
                    mediaRule.rules.push(t[tR]);
                  }
                 var mainIndex = mediaRule.rules.indexOf(mediaRule.rules[mRule]);
                  mediaRule.rules.splice(mainIndex, 1);
               }
              }
            }
            ssOut.rules.push(mediaRule);
          }
          else if (ssIn.rules[rule].type == "keyframes") {
            var keyframesRule = ssIn.rules[rule];
            for (var kFrame in keyframesRule.keyframes) {
              if (keyframesRule.keyframes[kFrame].declarations.length > 1) {
                var t = processKeyframeDeclarations(keyframesRule.keyframes[kFrame]);
                for (var tR in t) {
                  keyframesRule.keyframes.push(t[tR]);
                }
                var mainIndex = keyframesRule.keyframes.indexOf(keyframesRule.keyframes[kFrame]);
                keyframesRule.keyframes.splice(mainIndex, 1);
              }
            }
            ssOut.rules.push(keyframesRule);
          }
          else if (ssIn.rules[rule].type == "import") {
            ssOut.rules.push(ssIn.rules[rule]);
          }
        }
        return ssOut;
      }

      /**
       * Separate a multi-selector rule to single-selector rules.
       * @param {Object} rule - rule with more than 1 selectors
         * @returns {Array} - array of single-selector rules
         */
      function processSelectors(rule) {
        var outRules = [];
        for (var selector in rule.selectors) {

          var newRule              = {};
              newRule.type         = "rule";
              newRule.selectors    = [];
              newRule.selectors[0] = rule.selectors[selector];
              newRule.declarations = rule.declarations;

          outRules.push(newRule);
        }
        return outRules;
      }

      /**
       * Explode rules in the stylesheet to have only 1 selector per rule.
       * @param {Object} ssIn - stylesheet to explode
         * @returns {Object} - the new exploded stylesheet
         */
      function explodeMultiSelectors(ssIn) {
        var ssOut = {}; ssOut.rules = [];

        for (var rule in ssIn.rules) {
          if (ssIn.rules[rule].type == "rule") {
            if (ssIn.rules[rule].selectors.length > 1) {
              var t = processSelectors(ssIn.rules[rule]);
              for (var tR in t) {
                ssOut.rules.push(t[tR]);
              }
            } else {
              ssOut.rules.push(ssIn.rules[rule]);
            }
          }
          else if (ssIn.rules[rule].type == "media") {
            var mediaRule = ssIn.rules[rule];
            for (var mRule in mediaRule.rules) {
              if (mediaRule.rules[mRule].type == "rule") {
                if (mediaRule.rules[mRule].selectors.length > 1) {
                  var t = processSelectors(mediaRule.rules[mRule]);
                  for (var tR in t) {
                    mediaRule.rules.push(t[tR]);
                  }
                  var mainIndex = mediaRule.rules.indexOf(mediaRule.rules[mRule]);
                  mediaRule.rules.splice(mainIndex, 1);
                }
              }
            }
            ssOut.rules.push(mediaRule);
          }
          else {
            ssOut.rules.push(ssIn.rules[rule]);
          }
        }
        return ssOut;
      }

      /**
       * Create css string from a json object.
       * @param {Object} json - stylesheet json object
         * @returns {string} - converted css stylesheet
         */
      function createCss(json) {
        var cssBuffer = "";

        for (var rule in json.rules) {
          switch (json.rules[rule].type) {
            case "import":
              cssBuffer += "@import ";
              cssBuffer += json.rules[rule].import;
              cssBuffer += ";";
            break;

            case "keyframes":
              cssBuffer += "@";
              cssBuffer += (json.rules[rule].vendor === undefined) ? "" : json.rules[rule].vendor;
              cssBuffer += "keyframes ";
              cssBuffer += json.rules[rule].name;
              cssBuffer += "{";
              for (var keyframe in json.rules[rule].keyframes) {
                cssBuffer += json.rules[rule].keyframes[keyframe].values;
                cssBuffer += "{";
                for (var declaration in json.rules[rule].keyframes[keyframe].declarations) {
                  cssBuffer += json.rules[rule].keyframes[keyframe].declarations[declaration].property;
                  cssBuffer += ":";
                  cssBuffer += json.rules[rule].keyframes[keyframe].declarations[declaration].value;
                  cssBuffer += ";"
                }
                cssBuffer += "}";
              }
              cssBuffer += "}";
            break;

            case "rule":
              cssBuffer += json.rules[rule].selectors;
              cssBuffer += "{";
              for (var declaration in json.rules[rule].declarations) {
                cssBuffer += json.rules[rule].declarations[declaration].property;
                cssBuffer += ":";
                cssBuffer += json.rules[rule].declarations[declaration].value;
                cssBuffer += ";"
              }
              cssBuffer += "}";
            break;

            case "media":
              cssBuffer += "@media ";
              cssBuffer += json.rules[rule].media;
              cssBuffer += "{";
              for (var mediaRule in json.rules[rule].rules) {
                cssBuffer += json.rules[rule].rules[mediaRule].selectors;
                cssBuffer += "{";
                for (var mediaDeclaration in json.rules[rule].rules[mediaRule].declarations) {
                  cssBuffer += json.rules[rule].rules[mediaRule].declarations[mediaDeclaration].property;
                  cssBuffer += ":";
                  cssBuffer += json.rules[rule].rules[mediaRule].declarations[mediaDeclaration].value;
                  cssBuffer += ";"
                }
                cssBuffer += "}";
              }
              cssBuffer += "}";
            break;
          }
        }
        return cssBuffer;
      }

      // Main
      var stA = explodeMultiSelectors(obj1.stylesheet);
      var stB = explodeMultiSelectors(obj2.stylesheet);

      var sA = explodeMultiDeclarations(stA);
      var sB = explodeMultiDeclarations(stB);
      var sC = {}; sC.rules = [];

      for (var a in sA.rules) {
        switch (sA.rules[a].type) {
          case "import":
            sC = diffImport(sA, sB, sC, a);
          break;

          case "keyframes":
            sC = diffKeyframes(sA, sB, sC, a);
          break;

          case "rule":
            sC = diffRuleDeclarations(sA, sB, sC, a);
          break;

          case "media":
            sC = diffMedia(sA, sB, sC, a);
          break;
        }
      }

      var output = {};
          output.type = "stylesheet";
          output.stylesheet = sC;

      // Handle options - write jsons if needed
      if (options.writeJson) {
        var dest_p = f.dest.substr(0,f.dest.indexOf("."));
        grunt.file.write(dest_p + '-a.json', JSON.stringify(obj1));
        grunt.log.writeln('File "' + dest_p + '-a.json" created.');
        grunt.file.write(dest_p + '-b.json', JSON.stringify(obj2));
        grunt.log.writeln('File "' + dest_p + '-b.json" created.');
        grunt.file.write(dest_p + '-c.json', JSON.stringify(output));
        grunt.log.writeln('File "' + dest_p + '-c.json" created.');
      }

      // Create valid css file from JSON.stringified json
      var cssOutput = createCss(output.stylesheet);

      // Write the destination file.
      grunt.file.write(f.dest, cssOutput);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

};
