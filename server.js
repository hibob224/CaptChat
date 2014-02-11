var express = require("express"),
	app     = express(),
	server  = require('http').createServer(app),
	io      = require('socket.io').listen(server, {log: false}),
	WEBPORT = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000,
	WEBIP   = process.env.OPENSHIFT_NODEJS_IP   || process.env.IP   || "0.0.0.0";

/* EXPRESS WEB FRAMEWORK THINGS BELOW */
app.set('views', __dirname + '/WebApp');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/WebApp/public'));
app.use(express.logger('dev'));

// Routes
app.get('/', function(req, res) {
	res.render('index', {openshift: process.env.OPENSHIFT_NODEJS_PORT ? true : false});
});

var users = {};

/* SOCKET IO THINGS BELOW */
io.sockets.on('connection', function (socket) {
	//Emit Connected message
	socket.emit('connect', {message: 'Dies ist miene Wassamelone', socketid: socket.id});

	// Listeners
	socket.on('disconnect', function (data){
		var username;
		for (var prop in users) {
			if (users.hasOwnProperty(prop)) {
				if (users[prop].sessionid === socket.id) {
					delete users[prop];
				}
			}
		}
	});
	socket.on('userInfo', function (data){
		console.log(data.username + ' connected with SessionID: ' + socket.id);
		users[data.username] = {
			sessionid : socket.id,
			pubKey : data.pubKey,
		};
		listUsers();
		socket.join(socket.id);
	});
	socket.on('message', function (data) {
		if (users.hasOwnProperty(data.user)) {
			socket.broadcast.to(users[data.user].sessionid).emit('message', data.message);
		}
	});
	socket.on('joinRoom', function (room) {
		console.log(socket.id + " JoinedRoon " + room);
		socket.join(room);
	});
	socket.on('leaveRoom', function (room) {
		socket.leave(room);
	});
});

//This is for debugging, shows list of connected usersnames
function listUsers () {
	var keys = [];
	for (var k in users) {
		if (users.hasOwnProperty(k)) {
			keys.push(k);
		}
	}
	console.log(keys);
}

server.listen(WEBPORT, WEBIP);
console.log('Web Server Running on ' + WEBIP + ':' + WEBPORT);
