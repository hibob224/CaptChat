Connection = {
	socket : {}, //Placeholder for socket connection, use Connection.connect(url) to connect
	sessionID : "NOT_CONNECTED", //Filled in on connect

	connect : function( connectionString ) {
		this.socket = io.connect(connectionString + "");
		this.listen('connect', function (data) {
			console.log(data.message);
			Users.self.username = data.username;
			this.sessionID = data.socketid;
			var key = openpgp.generateKeyPair(1, 256, this.sessionID, this.sessionID);
			Users.addOwnKeys(key);
			Connection.sendEvent('userInfo', {pubKey:key.publicKeyArmored});
			Connection.giveContacts(['john', 'mary']);
		});
		this.listen('message', function (data) {
			CaptChat.receiveMessage(data);
		});
		this.listen('pubKey', function (data) {
			console.log(data.key);
			Users[data.user].key = data.key;
		});
		this.listen('startChat', function (data) {
			Users.addContact(data.name, data.pubKey);
			console.log(data.name);
		});
		this.listen('error', function (data) {
			console.error(data);
		});
		this.listen('contacts', function (data) {
			Users.contacts = data;
			console.log(Users.contacts);
		});
	},

	startChat : function (recipient) {
		if(recipient) this.socket.emit('startChat', recipient);
	},

	listen : function( event, callback ) {
		if (typeof event != 'string' || typeof callback != 'function' ) {
			console.error("Connection.listen(string,function)");
			return;
		}
		this.socket.on(event, callback);
	},

	sendEvent : function( event, data ) {
		this.socket.emit(event, data);
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
	},

	requestContacts : function () {
		this.socket.emit('requestContacts');
	},

	//Contacts should be an array of strings atm
	sendContacts : function( contacts ){
		if( !(contacts instanceof Array)) {
			console.error("sendContacts(contacts) => Contacts != Array");
			return;
		}
		this.socket.emit('giveContacts', contacts);
	},

	acceptRequest : function (username) {
		this.socket.emit('acceptRequest', username);
	}
};
