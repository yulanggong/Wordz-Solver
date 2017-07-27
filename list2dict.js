
var fs = require('fs');
var wordzSolver = require('./wordzsolver').wordzSolver;
var sowpods = fs.readFileSync('sowpods.txt', 'utf-8').toUpperCase();
var twl = fs.readFileSync('twl.txt', 'utf-8').toUpperCase();

wordzSolver.processWordList(sowpods, 'sowpods');
wordzSolver.processWordList(twl, 'twl');

console.log('Dict Ready');

var dict = wordzSolver.encode(wordzSolver.dict);

dict = ''
  + ';(function(window){\n'
  + '\tvar W = window.wordzSolver = window.wordzSolver || {};\n'
  + '\tW._dict = \'' + dict + '\';\n'
  + '\tW.dict = W.decode(W._dict);\n'
  + '})(this)';

fs.writeFile('dict.js', dict, function (err) {
  if (err) console.log(err);
  else console.log("saved");
})

