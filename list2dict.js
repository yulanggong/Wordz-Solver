
var fs = require('fs');
var temp = require('./wordzsolver.js');
var wordzSolver = temp.wordzSolver;

temp = require('./wordlist.js');
wordzSolver.wordList = temp.wordzSolver.wordList;

wordzSolver.processWordList();


console.log('Dict Ready');

var dict = JSON.stringify(wordzSolver.dict).replace(/"/g,'');

dict = ''
  + ';(function(window){\n'
  + '\tvar W = window.wordzSolver = window.wordzSolver || {};\n'
  + '\tW.dict = '
  + dict
  + '})(this)';

fs.writeFile('dict.js', dict, function (err) {
  if (err) console.log(err);
  else console.log("saved");
})

