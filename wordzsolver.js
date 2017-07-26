;(function(window) {

var W = window.wordzSolver = window.wordzSolver || {};

W.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

W.modes = ['around','across','x','all'];

W.dict = {};

// the dict object will be like this:
//{
//	w: {
//    $: 1, // how many times letter appears in word list.
//		o: {
//			r:{
//				d: {
//					_: 1, // mark the end of a word.
//					s: {
//						_: 1
//					}
//				}
//			}
//		}
//	}
//}

W.processWordList = function(){
	var dict = W.dict;
	var chars = W.chars;
	var i;

	for (i = chars.length - 1; i >= 0; i--) {
		dict[chars.charAt(i)] = {$: 0};
	}

	var l = W.wordList.length;
	var letter, obj = dict;

	for (i = 0; i < l ; i++){
		letter = W.wordList.charAt(i);

		// word list is split by \n
		if(letter === '\n'){
			obj._ = 1;
			obj = dict;
		} else {
			obj[letter] = obj[letter] || {};
			dict[letter].$ += 1;
			obj = obj[letter];
		}
	}

	if (obj !== dict){
		obj._ = 1; // mark the last word
	}

	dict.$ = 0; // amount of letters

	for (i = chars.length - 1; i >= 0; i--) {
		dict.$ += dict[chars.charAt(i)].$;
	}
};

W.encode = function(dict){
  return JSON.stringify(dict).replace(/"/g,'')
  .replace(/:{/g, '')
  .replace(/_:1,?/g, '_')
  .replace(/}+,/g, function(a){
    return 'abcdefghijklmnopqrstuvwxyz'[a.length - 1];
  })
}

W.decode = function(dict){
	dict = dict.replace(/_/g, '"_":1,')
		.replace(/\$/g, '"$"')
		.replace(/([A-Z])/g, '"$1":{')
		.replace(/[a-z]/g, function(a){
			return '}}}}}}}}}}}}}}}}}}}}}}}}}}'.slice(0, a.charCodeAt() - 97) + ','
		})
		.replace(/,}/g, '}')
	return JSON.parse(dict);
}

W.check = function(string){
	var obj = W.dict;
	var isWord = false, canBeWord = false;

	for (var i = 0; i < string.length; i++) {
		obj = obj[string.charAt(i)];

		if (!obj) {
			break;
		}

		if (i === string.length - 1){
			canBeWord = true;

			if (obj._) {
				isWord = true;
			}
		}
	}

	return {
		isWord: isWord,
		canBeWord: canBeWord
	};
};

W.map = function(array, fn) {
	var result = [];
	for (var i = 0; i < array.length; i ++){
		result.push(fn(array[i], i, array));
	}
	return result;
}

W.randomLetter = function(){
	var seed = (Math.random() * W.dict.$).toFixed();
	var letter;

	for (var i = W.chars.length - 1; i >= 0; i--) {

		letter = W.chars.charAt(i);
		seed -= W.dict[letter].$;
		
		if (seed <= 0) {
			break;
		}
	}

	return letter;
};

W.result = {_length:0};

W.output = function(string, history){
	if (string && W.result[string]) return;

	if (string) W.result._length += 1;

	var wordsCount =
		W.result._length === 0 ? 'nothing' :
		W.result._length === 1 ? 'one word' : ('<b>' +W.result._length + '</b> words');

	$('status').innerHTML = wordsCount;
	$('result').className = 'inline-block';
	
	if (!string) return;
	
	W.result[string] = history;

	var li = document.createElement('li');

	li.innerHTML = string.toLowerCase();
	$('output').appendChild(li);

	li.onmouseover = function(){
		W.highLight(history);
	};

	li.onmouseout = function(){
		W.clearHighLight();
	};
};

W.clearOutput = function(){
	W.result = {_length:0};
	$('output').innerHTML= '';
	$('status').innerHTML= '';
	$('result').className = '';
};

W.highLight = function(history){
	history = history.split(' ');

	for (var i = history.length - 2; i >= 0; i--) {
		$('B' + history[i]).className = 'active';
		$('O' + history[i]).innerHTML = i + 1;
	}
};

W.clearHighLight = function(){
	var x = 0, y = 0;
	while ($('B' + x + '-' + y)){
		while ($('B' + x + '-' + y)){
			$('B' + x + '-' +y).className = '';
			$('O' + x + '-' +y).innerHTML = '';
			y ++;
		}
		x ++;
		y = 0;
	}
};

W.checkInput = function (string) {
	var result = parseInt(string, 10);

	if (!result) {
		alert('Check your input.');
		return false;
	}

	return result;
};

window.$ = function(id){
	return document.getElementById(id);
};

var Board = W.Board = function(option){
	var self = this;
	
	option = option || {};

	self.width = option.width || 3;
	self.height =  option.height || 3;
	self.minLength = option.minLength || 3;
	self.letters = option.letters || [];
	
	self.finish = function(){		
		var pastTime = (+new Date() - self.startTime) / 1000;
		$('status').innerHTML += ', <b>' + pastTime + '</b> secondes';
	};

	$('solve').onclick = function() {
		var minLength = W.checkInput($('min-length').value);
		if (!minLength) return;

		self.minLength = minLength || wordLimit;
		self.solve();
	};

	$('random-fill').onclick = function() {
		self.fill(true);
	};

	$('new-board').onclick = function() {
		var width = W.checkInput($('board-width').value);
		if (!width) return;

		var height = W.checkInput($('board-height').value);
		if (!height) return;

		self.width = width;
		self.height = height;

		self.letters = [];
		self.fill();
	};

	var $modes = W.map(W.modes, function(mode){
		var $mode = $('mode-' + mode);
		$mode.onclick = function() {
			W.map($modes, function($mode){
				$mode.className = 'btn';
			})
			$mode.className = 'btn active';
			self.mode = mode;
			self.solve();
		}
		return $mode;
	})

	return self.fill();
};

Board.prototype.fill = function(random){
	var self = this;
	var html = '', x, y;
	var letters = [];

	for (x = 0; x < self.height; x ++) {

		letters.push([]);

		html += '<div class="board-line">';

		for (y = 0; y < self.width; y ++) {

			letters[x][y] =
				random
					? W.randomLetter()
					: self.letters[x] && (self.letters[x][y] || self.letters[x].charAt && self.letters[x].charAt(y)) || '';
			var id = x + '-' + y;
			html += '<span id="C' + id + '"><i id="O' + id + '"></i><input type="text" id="B' + id + '" value="'+ letters[x][y] +'"/></span>';
		}

		html += '</div>';
	}

	self.letters = letters;

	$('board').innerHTML = html;

	W.clearOutput();

	return self;
};

Board.prototype.getCellValue = function(x, y){
	return $('B' + x + '-' + y).value.toUpperCase();
};

Board.prototype.solve = function () {
	var self = this;
	var x, y;


	W.clearOutput();
	W.output();
	self.startTime = + new Date();

	for(x = 0; x < self.height; x++){
		for (y = 0; y < self.width; y++) {
			self.letters[x][y] = self.getCellValue(x, y);
		}
	}

	for(x = 0; x < self.height; x++){
		for (y = 0; y < self.width; y++) {
			self.walk(x, y, '', '');
		}
	}

	self.finish();

	return self;
};

Board.prototype.walk = function(x, y, history, string){
	var self = this;
	var letter = self.letters[x][y];

	if (!letter.length) return;

	history += x + '-' + y + ' ';

	function addLetter (letter) {
		var newString = string + letter;
		var checkResult = W.check(newString);
		var startX, startY, endX, endY, nextX, nextY, canWalk;

		if(!checkResult.canBeWord) {
			return;
		}

		if (newString.length >= self.minLength && checkResult.isWord) {
			W.output(newString, history);
		}

		if (self.mode == 'all') {
			startX = 0;
			startY = 0;
			endX = self.height - 1;
			endY = self.width - 1;
		} else {
			startX = x ? x - 1 : 0;
			startY = y ? y - 1 : 0;
			endX = (x == self.height - 1) ? x : x + 1;
			endY = (y == self.width - 1) ? y : y + 1;
		}

		for (nextX = startX; nextX <= endX; nextX ++){
			for (nextY = startY; nextY <= endY; nextY ++){
				canWalk = false;
				if (history.indexOf(nextX + '-' + nextY) === -1){
					if (self.mode == 'across') {
						canWalk = nextX == x || nextY == y;
					} else if (self.mode == 'x') {
						canWalk = nextX != x && nextY != y;
					} else {
						canWalk = true;
					}
				}
				if (canWalk) {
					self.walk(nextX, nextY, history, newString);
				}
			}
		}
	}

	if (letter === '?') {// wildcard
		var l = W.chars.length;
		for (var i = 0; i < l; i++) {
			addLetter(W.chars.charAt(i));
		}
	} else {
		addLetter(letter);
	}
};

})(this);
