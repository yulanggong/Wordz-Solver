
var fs = require('fs');
var temp = require('./wordzsolver.js');
var wordzSolver = temp.wordzSolver;

temp = require('./wordlist.js');
wordzSolver.wordList = temp.wordzSolver.wordList;

wordzSolver.processWordList(function() {
  console.log('Dict Ready');

  var dict = JSON.stringify(wordzSolver.dict)
  var dict = ''
    + ';(function(window){\n'
    + '\tvar W = window.wordzSolver = window.wordzSolver || {}; W.dict = '
    + dict
    + '})()'
  fs.writeFile('dict.js', dict, function (err) {
    if (err) console.log(err);
    else console.log("saved");
  })
})
