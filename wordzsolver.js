
var wordzSolver = {};

;(function(W) {

W.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

W.dict = {};
//处理完成后的 dict 结构是这样的:
//{
//	w: {
//    _c: 1, //字母计数
//		o: {
//			r:{
//				d: {
//					_:true, //单词末尾标记
//					s: {
//						_:true
//					}
//				}
//			}
//		}
//	}
//}

W.processWordList = function(callback){

	var dict = W.dict;
	var chars = W.chars;

	for (var i = chars.length - 1; i >= 0; i--) {
		dict[chars[i]] = {_c: 0};
	};

	//递归用的函数，at 为字符的索引， obj 为字典对象或其子对象
	function next (at, obj){

		var letter = W.wordList[at]

		//处理结束时
		if (!letter) {

			if (obj !== dict){
				obj._ = true; //标记最后一个单词
			}

			dict.state = 1;
			callback && callback();

			return
		}

		//当字符为空格时，obj 对象就是上个单词对应的结尾，做标记
		if(letter === ' '){
			obj._ = true;
			obj = dict;
		} else { //当字符为非空格时单词还未结束，为 obj 添加子元素
			obj[letter] = obj[letter] || {};
			dict[letter]._c += 1;
			obj = obj[letter];
		}

		//防止 Call Stack 溢出，防止浏览器卡死
		//各浏览器的 Call Stack 大小限制参考：[http://stackoverflow.com/questions/7826992/browser-javascript-stack-size-limit]
		if (at % 1000 === 0){
			setTimeout(function () {
				next(at + 1, obj)
			}, 0)
		} else {
			next(at + 1, obj)
		}
	}

	next(0, dict);
}

W.check = function(string){
	var obj = W.dict;
	var isWord = false, canBeWord = false;

	for (var i = 0; i < string.length; i++) {
		obj = obj[string[i]];

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
	}
}

W.randomLetter = function(){

	var seed = (Math.random() * W.wordList.length).toFixed();
	var letter;

	for (var i = W.chars.length - 1; i >= 0; i--) {

		letter = W.chars[i];
		seed -= W.dict[letter]._c;
		
		if (seed <= 0) {
			break;
		}
	}

	return letter;
}

W.result = {_length:0};

W.output = function(string, history){

	if (W.result[string]) return;
	
	W.result[string] = history;
	W.result._length += 1;

	var pastTime = (+new Date() - W.startTime) / 1e3;
	console.log(pastTime)

	var li = document.createElement('li');


	li.innerHTML = string.toLowerCase();
	$('output').appendChild(li);

	li.onmouseover = function(){
		W.highLight(history);
	}

	li.onmouseout = function(){
		W.clearHighLight();
	}
}

W.clearOutput = function(){
	W.result = {_length:0};
	$('output').innerHTML= '';
}

W.highLight = function(history){

	history = history.split(' ');

	for (var i = history.length - 2; i >= 0; i--) {
		$('B' + history[i]).className = 'active'
	}
}

W.clearHighLight = function(){
	var x = 0, y = 0;
	while ($('B' + x + '-' + y)){
		while ($('B' + x + '-' + y)){
			$('B' + x + '-' +y).className = ''
			y ++
		}
		x ++
		y = 0
	}
}

window.$ = function(id){
	return document.getElementById(id)
}

var Board = W.Board = function(option){

	var self = this;
	
	option = option || {};

	self.width = option.width || 3;
	self.height =  option.height || 3;
	self.minLength = option.minLength || 3;
	self.letters = option.letters || [];

	self.callStackSize = 0;	//防止 Call Stack 溢出用
	
	$('solve').onclick = function() {
		self.solve();
	}

	$('new-board').onclick = function() {
		self.width = +$('board-width').value;
		self.height = +$('board-height').value;

		self.letters = [];
		self.fill();
	}

	return self.fill();
}

Board.prototype.fill = function(random){

	var self = this;
	var html = '', x, y;
	var letters = [];

	for (x = 0; x < self.height; x ++) {

		letters.push([]);

		html += '<div class="board-line">';

		for (y = 0; y < self.width; y ++) {

			letters[x][y] = random ? W.randomLetter() : self.letters[x] && self.letters[x][y] || '';

			html += '<input type="text" id="B' + x + '-' + y + '" value="'+ letters[x][y] +'"/>';
		}

		html += '</div>';
	}

	self.letters = letters;

	$('board').innerHTML = html;

	W.clearOutput();

	return self;
}

Board.prototype.getCellValue = function(x, y){
	return $('B' + x + '-' + y).value.toUpperCase();
}

Board.prototype.solve = function () {

	var self = this;
	var x, y;

	self.minLength = +$('min-length').value || wordLimit;

	W.clearOutput();

	for(x = 0; x < self.height; x++){
		for (y = 0; y < self.width; y++) {
			self.letters[x][y] = self.getCellValue(x, y);
		}
	}

	for(x = 0; x < self.height; x++){
		for (y = 0; y < self.width; y++) {

			W.startTime = + new Date;

			self.walk(x, y, '', '');
		}
	}
	return self;
}

Board.prototype.walk = function(x, y, history, string){

	var self = this;
	var letter = self.letters[x][y];

	if (!letter.length) return;

	self.callStackSize ++

	history += x + '-' + y + ' ';

	function addLetter (letter) {

		self.callStackSize ++

		var newString = string + letter;
		var checkResult = W.check(newString);
		var startX, startY, endX, endY, nextX, nextY;

		if(!checkResult.canBeWord) {
			return
		}

		if (newString.length >= self.minLength && checkResult.isWord) {
			W.output(newString, history);
		}

		startX = x ? x - 1 : 0;
		startY = y ? y - 1 : 0;
		endX = (x == self.height - 1) ? x : x + 1;
		endY = (y == self.width - 1) ? y : y + 1;

		for (nextX = startX; nextX <= endX; nextX ++){
			for (nextY = startY; nextY <= endY; nextY ++){
				if (history.indexOf(nextX + '-' + nextY) === -1){
					if (self.callStackSize < 1000) {
						self.walk(nextX, nextY, history, newString);
					} else {
						(function(nextX, nextY){
							setTimeout(function(){
								self.callStackSize = 0;
								self.walk(nextX, nextY, history, newString)
							},0)
						})(nextX, nextY);
					}
				}
			}
		}
	}

	if (letter !== '?') {
		addLetter(letter);
	} else { //通配符
		for (var i = W.chars.length - 1; i >= 0; i--) {
			addLetter(W.chars[i]);
		}
	}
}

})(wordzSolver);
