Connection = {
	socket : {}, //Placeholder for socket connection, use Connection.connect(url) to connect
	sessionID : "NOT_CONNECTED", //Filled in on connect

	connect : function( connectionString ) {
		Connection.socket = io.connect(connectionString + "");
		Connection.listen('connected', function (data) {
			console.log(data.message);
			Connection.sessionID = data.socketid;
		});
		Connection.listen('message', function(data) {
			console.log(data);
			CaptChat.receiveMessage(data);
		});
	},

	listen : function( event, callback ) {
		if (typeof event != 'string' || typeof callback != 'function' ) {
			console.log("Connection.listen(string,function)")
			return;
		}
		Connection.socket.on(event, callback);
	},

	sendEvent : function( event, data ) {
		Connection.socket.emit()
	},

	sendMessage : function (message) {
		Connection.socket.emit('message', message);
	},

	joinRoom : function (room) {
		Connection.socket.emit('joinRoom', room);
	},

	leaveRoom : function(room) {
		Connection.socket.emit('leaveRoom', room);
	}
};
