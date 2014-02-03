var express = require("express"),
	app     = express(),
	server  = require('http').createServer(app),
	io      = require('socket.io').listen(server, {log: false}),
	WEBPORT = 3000;

/* EXPRESS WEB FRAMEWORK THINGS BELOW */
app.set('views', __dirname + '/WebApp');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/WebApp/public'));

// Routes
app.get('/', function(req, res) {
	res.render('index');
});

/* SOCKET IO THINGS BELOW */
io.sockets.on('connection', function (socket) {
	console.log('User connected with SessionID: ' + socket.id);
	socket.emit('connected', {message: 'Dies ist miene Wassamelone', socketid: socket.id});
	socket.on('message', function (data) {
		//DEBUGGING IF, ALLOWS SENDING OF PLAINTEXT INSTEAD OF OBJECTS AS A MESSAGE
		if(typeof data == 'string'){
			data = {message: data,room:'Derp'};
		}
		// console.log(data.message);
		socket.broadcast.to(data.room).emit('message', data.message);
	});
	socket.on('joinRoom', function(room) {
		console.log(socket.id + " JoinedRoon " + room);
		socket.join(room);
	});
	socket.on('leaveRoom', function(room) {
		socket.leave(room);
	});
	socket.on('test', function() {
		console.log('test');
	});
});

server.listen(WEBPORT);
console.log('Web Server Running on port ' + WEBPORT);
