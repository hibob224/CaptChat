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
		socket.set('username', socket.handshake.user.username); //socket.get(username, function (err, username) {}) works now.

		//Emit Connected message
		socket.emit('connect', {message: 'Dies ist miene Wassamelone', socketid: socket.id, username: socket.handshake.user.username });
		// Listeners
		//Give Contacts Event is for development only and should not be used in production!
		socket.on('giveContacts', function (data){
			if(data instanceof Array && data.length > 0) {
				//Automatically removes anything which isn't a string from the contacts array
				App.users[getUserFromSocket(socket.id)].contacts = data;
			} else {
				sendError('giveContacts', 'giveContacts requires array of contacts');
			}
		});
		socket.on('disconnect', function (){
			for (var prop in App.users) {
				if (App.users.hasOwnProperty(prop)) {
					if (App.users[prop].sessionid === socket.id) {
						delete App.users[prop];
					}
				}
			}
		});
		socket.on('userInfo', function (data){
			if( typeof data !== 'object' || !data.hasOwnProperty('pubKey')) {
				sendError('userInfo', 'Data sent did not contain pubKey');
				return;
			}
			console.log(socket.handshake.user.username + ' connected with SessionID: ' + socket.id);
			App.users[socket.handshake.user.username] = {
				sessionid : socket.id,
				pubKey : data.pubKey,
			};
			console.log('Connected users:', listUsers()); //Console logging connected users each time a conneciton is made
		});
		socket.on('startChat', function (recipient) {
			if( !recipient ){
				sendError('startChat', 'No recipient sent');
				return;
			}
			var data = {};
			if (App.users.hasOwnProperty(recipient)) { //Check if the requested recipient is connected
				data.name = socket.handshake.user.username;
				console.log("startChat:", data.name, "->", recipient);
				data.pubKey = App.users[data.name].pubKey;
				sendMessage(recipient, data, 'startChat');
			} else {
				sendError('notConnected', 'User \'' + recipient + '\' is not connected');
			}
		});
		socket.on('message', function (data) {
			if( typeof data === 'object' && data ) {
				if( typeof data.message === 'string' || typeof data.user === 'string' ) {
					if (App.users.hasOwnProperty(data.user)) {
						var message = {};
						message.message = data.message;
						message.from	= socket.handshake.user.username;
						sendMessage(data.user, message);
					} else { sendError('message', 'Recipient not connected'); }
					return;
				} else { sendError('message', 'Data object sent with incorrect message/user'); }
			} else { sendError('message', 'Data object not sent'); }
		});
		socket.on('joinRoom', function (room) {
			console.log(socket.id + ' JoinedRoon ' + room);
			socket.join(room);
		});
		socket.on('leaveRoom', function (room) {
			socket.leave(room);
		});
		//Request your contacts list, can't request for a specific user, just the one your socket is associated with.
		socket.on('requestContacts', function (){
			sendContacts(socket);
		});

		socket.on('acceptRequest', function (username) {
			User.addContact(socket.handshake.user.username, username, console.log);
		});

		socket.on('sendRequest', function (username) {
			User.sendRequest(socket.handshake.user.username, username, console.log );
		});

		socket.on('reqKey', function (username) {
			if (App.users.hasOwnProperty(username)) {
				socket.emit('reqKey', {username: username, pubKey: App.users[username].pubKey});
			} else {
				sendError('reqKey', 'User: ' + username + ' not connected.');
			}
		});

		//***Socket Methods***//
		/*
		 * @param {String} err Name of the error
		 * @param {String} message The message to display with the error
		 * @param {Any} extra Optional extra data to send can be any type
		 */
		function sendError (err, message, extra) {
			var data = (typeof extra !== 'undefined' ? { err: err, message: message, extra: extra } : { err: err, message: message });
			socket.emit('error', data);
		}
		//Emits this socket's contacts
		function sendContacts () {
			User.getContacts(socket.handshake.user.username, function (contacts) {
				socket.emit('contacts', contacts);
			});
		}
	});


	//This is for debugging, returns list of connected usersnames
	function listUsers () {
		var keys = [];
		for (var k in App.users) {
			if (App.users.hasOwnProperty(k)) {
				keys.push(k);
			}
		}
		return keys;
	}

	//DEPRECIATED use socket.get('username', function(err, username){}); where you can
	//Or use socket.handshake.user.username
	//Takes a Socket or a socketID (prefer explicit passing of id)
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
