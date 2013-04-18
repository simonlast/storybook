 var express = require('express'),
 	http = require('http'),
 	connect = require('connect');
 	//sio = require('socket.io'),
 	//sockets = require('./sockets');

var saticServer = connect()
  .use(connect.static('public'))
  .use(connect.directory('public'))
  .use(connect.cookieParser());

var app = express();

app.configure( function(){
  app.use(saticServer);
  app.use(express.errorHandler());
  app.use(express.bodyParser());
});

var server = http.createServer(app);

//var io = sio.listen(server,  { log: false });

server.listen(80);

//sockets.init(io);