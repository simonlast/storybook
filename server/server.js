 var express = require('express'),
  http = require('http'),
  connect = require('connect');

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

server.listen(process.argv[2] || 80);