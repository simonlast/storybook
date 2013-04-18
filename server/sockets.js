
var fs = require('fs');

var io;

var connect = function(socket){

};


exports.init = function(cio){
	io = cio;
	io.sockets.on('connection', connect);
}
