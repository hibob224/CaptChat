var env     = process.env.NODE_ENV || process.env.OPENSHIFT_NODEJS_IP ? 'openshift' : 'dev',
	path	= require('path'),
	package = require('../package.json'),
	express = require('express');
console.log('Loading app in '+ env + ' mode.');

global.App = {
	exp: express(),
	port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000,
	ip:   process.env.OPENSHIFT_NODEJS_IP   || process.env.IP   || "0.0.0.0",
	env:  env,
	version: package.version,
	mongoStr: 'mongodb://localhost:27017/captchat',
	users: {},
	root: path.join(__dirname, '..'),
	appPath: function(path){
		return this.root + '/' + path;
	},
	require: function(path) {
		return require(this.appPath(path));
	},
	start: function() {
		if(!this.started){
			this.started = true;
			server.listen(App.port, App.ip);
			console.log('Web Server Running on ' + App.ip + ':' + App.port);
		}
	},
};

var server = require('http').createServer(App.exp),
	io     = require('socket.io').listen(server, {log: false});

/* EXPRESS WEB FRAMEWORK MiddleWare BELOW */
App.exp.set('views', App.appPath('WebApp'));
App.exp.set('view engine', 'jade');
App.exp.use(express.static(App.appPath('WebApp/public')));
App.exp.use(express.logger('dev'));
App.exp.use(express.bodyParser());

//MONGO DB CONNECTION THINGS
if(App.env === 'openshift'){
	App.mongoStr = "mongodb://" +
		process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		process.env.OPENSHIFT_APP_NAME;
}

App.require("config/database.js")(App.mongoStr);
User = App.require('models/user');
App.require("config/routes.js")(App.exp);
App.require("config/chatSockets.js")(io);

var testUser = new User({
	username: 'JAMAL',
	password: 'Toblerone'
});

User.findOne({username: 'JAMAL'}, function(err, user) {
	if(err) throw err;

	if(user) {
		console.log('User already there');
	} else {
		testUser.save(function(err) {
			if (err) throw err;

			// Attempt to authenticate user
			User.getAuthenticated('JAMAL', 'Tyrone', function(err, user, reason) {
				if (err) throw err;

				// Login was successful if we have a user
				if (user) {
					// handle login success
					console.log('login success');
					return;
				}

				// Otherwise we can determine why we failed
				var reasons = User.failedLogin;
				switch (reason) {
					case reasons.NOT_FOUND:
					case reasons.PASSWORD_INCORRECT:
						console.log('Username/Password Incorrect');
						break;
					case reasons.MAX_ATTEMPTS:
						console.log('Max Attempts');
						// Send email or otherwise notify user that account is temporarily locked
						break;
				}
			});
		});
	}
});
