Connection = {
	socket : {}, //Placeholder for socket connection, use Connection.connect(url) to connect
	sessionID : "NOT_CONNECTED", //Filled in on connect

	connect : function( connectionString ) {
		this.socket = io.connect(connectionString + "");
		this.listen('connected', function (data) {
			console.log(data.message);
			this.sessionID = data.socketid;
		});
		this.listen('message', function (data) {
			CaptChat.receiveMessage(data);
		});
		this.listen('pubKey', function (data) {
			console.log(data.key);
			Users[data.user].key = data.key;
		});

		var key = openpgp.generateKeyPair(1, 256, this.sessionID, this.sessionID);
		this.sendPubKey(key.publicKeyArmored);
		Users.addOwnKeys(key);
	},

	listen : function( event, callback ) {
		if (typeof event != 'string' || typeof callback != 'function' ) {
			console.error("Connection.listen(string,function)");
			return;
		}
		this.socket.on(event, callback);
	},

	sendEvent : function( event, data ) {
		this.socket.emit();
	},

	sendMessage : function( message ) {
		this.socket.emit('message', message);
	},

	joinRoom : function( room ) {
		this.socket.emit('joinRoom', room);
	},

	leaveRoom : function( room ) {
		this.socket.emit('leaveRoom', room);
	},

	sendPubKey : function( key ){
		if(arguments.length === 0) {
			console.error("please pass key into this function");
			return;
		}
		this.socket.emit('pubKey', key);
	}
};
