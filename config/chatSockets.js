module.exports = function(io){
	/* SOCKET IO THINGS BELOW */
	io.sockets.on('connection', function (socket) {
		//Emit Connected message
		socket.emit('connect', {message: 'Dies ist miene Wassamelone', socketid: socket.id});

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
			console.log(data.username + ' connected with SessionID: ' + socket.id);
			App.users[data.username] = {
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
	});

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

	function getUserFromSocket (socket) {
		for (var k in App.users) {
			if (App.users.hasOwnProperty(k)) {
				if (App.users[k].sessionid === socket) return k;
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
