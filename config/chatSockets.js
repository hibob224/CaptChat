module.exports = function(io, sessionStore, express){
	var passportSocketIo = require('passport.socketio');

	io.set('authorization', passportSocketIo.authorize({
		cookieParser: express.cookieParser,
		secret: 'TappestKake',
		store: sessionStore,
		success: onAuthorizeSuccess,
		fail: onAuthorizeFail
	}));

	function onAuthorizeSuccess (data, accept) {
		console.log('success:', data.user.username);
		accept(null, true);
	}

	function onAuthorizeFail (data, message, err, accept) {
		if(err) throw err;
		console.log('failed connection to socket.io:', message);

		accept(null, false);
	}

	/* SOCKET IO THINGS BELOW */
	io.sockets.on('connection', function (socket) {
		//Emit Connected message
		socket.emit('connect', {message: 'Dies ist miene Wassamelone', socketid: socket.id, username: socket.handshake.user.username });
		socket.on('giveContacts', function (data){
			App.users[getUserFromSocket(socket.id)].contacts = data;
		});

		// Listeners
		socket.on('disconnect', function (data){
			var username;
			for (var prop in App.users) {
				if (App.users.hasOwnProperty(prop)) {
					if (App.users[prop].sessionid === socket.id) {
						delete App.users[prop];
					}
				}
			}
		});
		socket.on('userInfo', function (data){
			console.log(socket.handshake.user.username + ' connected with SessionID: ' + socket.id);
			App.users[socket.handshake.user.username] = {
				sessionid : socket.id,
				pubKey : data.pubKey,
			};
			listUsers();
		});
		socket.on('startChat', function (recipient) {
			var data = {};
			if (App.users.hasOwnProperty(recipient)) { //Check if the requested recipient is connected
				data.name = getUserFromSocket(socket.id);
				console.log(data.name);
				data.pubKey = App.users[data.name].pubKey;
				sendMessage(recipient, data, 'startChat');
			} else {
				socket.emit('error', {err:'notConnected', message:'User \'' + recipient + '\' is not connected'});
			}
		});
		socket.on('message', function (data) {
			if (App.users.hasOwnProperty(data.user)) {
				sendMessage(data.user, data.message);
			}
		});
		socket.on('joinRoom', function (room) {
			console.log(socket.id + " JoinedRoon " + room);
			socket.join(room);
		});
		socket.on('leaveRoom', function (room) {
			socket.leave(room);
		});
		//Request your contacts list, can't request for a specific user, just the one your socket is associated with.
		socket.on('requestContacts', function (){
			sendContacts(socket);
		});

		socket.on('acceptRequest', function(username) {
			User.addContact(getUserFromSocket(socket.id), username, function(message) {
				console.log(message);
			});
		});

		socket.on('sendRequest', function(username) {
			User.sendRequest(getUserFromSocket(socket.id), username, function(message) {
				console.log(message);
			});
		});
	});

	//Takes an entire socket, infers username from the socket, emits that sockets contacts
	function sendContacts (socket) {
		var user = getUserFromSocket(socket.id);
		if( user ) {
			socket.emit('contacts', App.users[user].contacts);
		}
	}

	//This is for debugging, shows list of connected usersnames
	function listUsers () {
		var keys = [];
		for (var k in App.users) {
			if (App.users.hasOwnProperty(k)) {
				keys.push(k);
			}
		}
		console.log(keys);
		return keys;
	}

	//Takes a socketID not a socket (socket.id)
	function getUserFromSocket (socketID) {
		if (socketID.hasOwnProperty('id') ) { socketID = socketID.id; } //SocketID is an entire socket, not an ID
		for (var k in App.users) {
			if (App.users.hasOwnProperty(k)) {
				if (App.users[k].sessionid === socketID) return k;
			}
		}
		return false;
	}

	/* Sends messages to indavidual connected clients
	 * @param {String} recipient Username not socketID
	 * @param {Object} data Data Object to be sent
	 * @param {String} type Optional event type, default: 'message'
	 */
	function sendMessage (recipient, data, type) {
		type = type || 'message';
		if (App.users.hasOwnProperty(recipient)) {
			io.sockets.socket(App.users[recipient].sessionid).emit(type, data);
		}
	}
};
