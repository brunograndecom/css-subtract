/*
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
      // Warn on and remove invalid source files (if nonull was set).
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
        // Warn on and remove invalid source files (if nonull was set).
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

      function diffImport(stylesheetA, stylesheetB, stylesheetC, i) {
        for (var j in stylesheetA.rules) {
          if ((stylesheetA.rules[j].type == "import") && (stylesheetA.rules[j].import == stylesheetB.rules[i].import)) {
            var index = stylesheetC.rules.indexOf(stylesheetA.rules[j]);
            stylesheetC.rules.splice(index, 1);
          }
        }
        return stylesheetC;
      }

      function diffKeyframes(stylesheetA, stylesheetB, stylesheetC, i) {
        for (var j in stylesheetA.rules) {
          if ((stylesheetA.rules[j].type == "keyframes") &&
              (stylesheetA.rules[j].name == stylesheetB.rules[i].name) &&
              (JSON.stringify(stylesheetA.rules[j].keyframes) == JSON.stringify(stylesheetB.rules[i].keyframes))) {
                if (stylesheetA.rules[j].hasOwnProperty("vendor") || stylesheetB.rules[i].hasOwnProperty("vendor")) {
                  if (stylesheetA.rules[j].vendor == stylesheetB.rules[i].vendor) {
                    var index = stylesheetC.rules.indexOf(stylesheetA.rules[j]);
                    stylesheetC.rules.splice(index, 1);
                  }
                } else {
                  var index = stylesheetC.rules.indexOf(stylesheetA.rules[j]);
                  stylesheetC.rules.splice(index, 1);
                }
          }
        }
        return stylesheetC;
      }

      function diffRuleDeclarations(stylesheetA, stylesheetB, stylesheetC, ia, ib) {
        var indexOfTheRule = stylesheetC.rules.indexOf(stylesheetA.rules[ia]);

        if (JSON.stringify(stylesheetA.rules[ia].declarations) == JSON.stringify(stylesheetB.rules[ib].declarations)) {
          stylesheetC.rules.splice(indexOfTheRule, 1);
        } else {
          for (var db in stylesheetB.rules[ib].declarations) {
            for (var da in stylesheetA.rules[ia].declarations) {
              if (JSON.stringify(stylesheetA.rules[ia].declarations[da]) == JSON.stringify(stylesheetB.rules[ib].declarations[db])) {
                var indexOfTheDeclaration = stylesheetC.rules[indexOfTheRule].declarations.indexOf(stylesheetA.rules[ia].declarations[da]);
                stylesheetC.rules[indexOfTheRule].declarations.splice(indexOfTheDeclaration, 1);
              }
            }
          }
        }
        return stylesheetC;
      }

      function diffMedia(stylesheetA, stylesheetB, stylesheetC, ia, ib) {
        var mA = stylesheetA.rules[ia];
        var mB = stylesheetB.rules[ib];
        var index = stylesheetC.rules.indexOf(stylesheetA.rules[ia]);

        if (JSON.stringify(stylesheetA.rules[ia]) == JSON.stringify(stylesheetB.rules[ib])) {
          stylesheetC.rules.splice(index, 1);
        } else {
          for (var b in mB.rules) {
            for (var a in mA.rules) {
              if (JSON.stringify(mA.rules[a].selectors) == JSON.stringify(mB.rules[b].selectors)) {
                stylesheetC.rules[index] = diffRuleDeclarations(mA, mB, stylesheetC.rules[index], a, b);
              }
            }
          }
        }
        return stylesheetC;
      }

      function processNewRule(rule) {
        // we want to separate them to new rule:
        var outRules = [];
        //    loop througt selectors
        for(var selector in rule.selectors) {
          // new rule with selectors[x] && declarations
          var newRule              = {};
              newRule.type         = "rule";
              newRule.selectors    = [];
              newRule.selectors[0] = rule.selectors[selector];
              newRule.declarations = rule.declarations;
          // push new rule to stylesheet.rules
          outRules.push(newRule);
        }
        return outRules;
      }

      /*
       * @param ssIn - stylesheet to loop through
       * @return the new exploded stylesheet (ssOut)
       */
      function explodeMultiSelectors(ssIn){
        var ssOut = ssIn;
        for (var rule in ssIn.rules) {
          if (ssIn.rules[rule].type == "rule") {
            // type rule
            if (ssIn.rules[rule].selectors.length > 1) {
              // we have more then 1 selectors
              // push separated rules to output stylesheet.rules
              var t = processNewRule(ssIn.rules[rule]);
              for (var tR in t) {
                ssOut.rules.push(t[tR]);
              }
              // delete original (multi-selector) rule from rules
              // get index of same rule in ssOut
              var index = ssOut.rules.indexOf(ssIn.rules[rule]);
              ssOut.rules.splice(index, 1);

            }
          }
          else if (ssIn.rules[rule].type == "media") {
            // type media
            var mediaRule = ssIn.rules[rule];
            for (var mRule in mediaRule.rules) {
              if (mediaRule.rules[mRule].type == "rule") {
                if (mediaRule.rules[mRule].selectors.length > 1) {
                  // we have more then 1 selectors
                  // delete original (multi-selector) rule from rules
                  // get index of same rule in ssOut
                  var mainIndex = ssOut.rules.indexOf(mediaRule);
                  ssOut.rules.splice(mainIndex, 1);
                  // push separated rules to output stylesheet.rules
                  var t = processNewRule(mediaRule.rules[mRule]);
                  for (var tR in t) {
                    mediaRule.rules.push(t[tR]);
                  }
                  // delete original (multi-selector) rule from rules
                  // get index of same rule in mediaRule
                  var index = mediaRule.rules.indexOf(mediaRule.rules[mRule]);
                  mediaRule.rules.splice(index, 1);
                  ssOut.rules.push(mediaRule);
                }
              }
            }
          }
        }
        return ssOut;
      }

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

      // @TODO delete this, uncomment next
      var ssA = obj1.stylesheet;
      var ssB = obj2.stylesheet;
      var sA = explodeMultiSelectors(ssA);
      var sB = explodeMultiSelectors(ssB);
      var sC = sA;

      var outputA = {};
          outputA.type = "stylesheet";
          outputA.stylesheet = sA;
      var outputB = {};
          outputB.type = "stylesheet";
          outputB.stylesheet = sB;
      var outputC = {};
          outputC.type = "stylesheet";
          outputC.stylesheet = sC;
      grunt.file.write(f.dest.substr(0,f.dest.indexOf(".")) + '-ssa.json', JSON.stringify(outputA));
      grunt.log.writeln('File "' + f.dest.substr(0,f.dest.indexOf(".")) + '-ssa.json" created.');
      grunt.file.write(f.dest.substr(0,f.dest.indexOf(".")) + '-ssb.json', JSON.stringify(outputB));
      grunt.log.writeln('File "' + f.dest.substr(0,f.dest.indexOf(".")) + '-ssb.json" created.');
      grunt.file.write(f.dest.substr(0,f.dest.indexOf(".")) + '-ssc.json', JSON.stringify(outputC));
      grunt.log.writeln('File "' + f.dest.substr(0,f.dest.indexOf(".")) + '-ssc.json" created.');


      // var sA = explodeMultiSelectors(obj1.stylesheet);
      // var sB = explodeMultiSelectors(obj2.stylesheet);
      // var sC = sA;

      for (var b in sB.rules) {
        switch (sB.rules[b].type) {
          case "import":
            sC = diffImport(sA, sB, sC, b);
          break;

          case "keyframes":
            sC = diffKeyframes(sA, sB, sC, b);
          break;

          case "rule":
            for (var a in sA.rules) {
              if ((sA.rules[a].type == "rule") && (JSON.stringify(sA.rules[a].selectors) == JSON.stringify(sB.rules[b].selectors))) {
                sC = diffRuleDeclarations(sA, sB, sC, a, b);
              }
            }
          break;

          case "media":
            for (var a in sA.rules) {
              if ((sA.rules[a].type == "media") && (sA.rules[a].media == sB.rules[b].media)) {
                sC = diffMedia(sA, sB, sC, a, b);
              }
            }
          break;
        }
      }

      var output = {};
          output.type = "stylesheet";
          output.stylesheet = sC;

      // Handle options - write c json if needed
      if (options.writeJson) {
        grunt.file.write(f.dest.substr(0,f.dest.indexOf(".")) + '-a.json', JSON.stringify(obj1));
        grunt.log.writeln('File "' + f.dest.substr(0,f.dest.indexOf(".")) + '-a.json" created.');
        grunt.file.write(f.dest.substr(0,f.dest.indexOf(".")) + '-b.json', JSON.stringify(obj2));
        grunt.log.writeln('File "' + f.dest.substr(0,f.dest.indexOf(".")) + '-b.json" created.');
        grunt.file.write(f.dest.substr(0,f.dest.indexOf(".")) + '-c.json', JSON.stringify(output));
        grunt.log.writeln('File "' + f.dest.substr(0,f.dest.indexOf(".")) + '-c.json" created.');
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
