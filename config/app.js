var env     = process.env.NODE_ENV || process.env.OPENSHIFT_NODEJS_IP ? 'openshift' : 'dev',
	path	= require('path'),
	package = require('../package.json'),
	express = require('express'),
	MongoStore = require('express-session-mongo');
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
	stop: function() {
		if(this.started){
			//Do Shutdown things
		}
	}
};

var server = require('http').createServer(App.exp),
	io     = require('socket.io').listen(server, {log: false});
	passport = App.require('config/passport.js');

var sessionStore = new MongoStore();

//MONGO DB CONNECTION THINGS
if(App.env === 'openshift'){
	App.mongoStr = "mongodb://" +
		process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		process.env.OPENSHIFT_APP_NAME;
	var customServer = new Server(process.env.OPENSHIFT_MONGODB_DB_HOST, process.env.OPENSHIFT_MONGODB_DB_PORT, { auto_reconnect: true });
	sessionStore = new MongoStore({ server: customServer});
}

/* EXPRESS WEB FRAMEWORK MiddleWare BELOW */
App.exp.set('views', App.appPath('WebApp'));
App.exp.set('view engine', 'jade');
App.exp.use(express.static(App.appPath('WebApp/public')));
App.exp.use(express.logger('dev'));
App.exp.use(express.cookieParser());
App.exp.use(express.bodyParser());
App.exp.use(express.session({store: sessionStore, secret: 'TappestKake'}));
App.exp.use(function (req, res, next){
	if ( req.method == 'POST' && req.url == '/login' ) {
		if ( req.body.rememberme ) {
			req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
		} else {
			req.session.cookie.expires = false;
		}
	}
	next();
});
App.exp.use(passport.initialize());
App.exp.use(passport.session());


App.require("config/database.js")(App.mongoStr);
User = App.require('models/user');
Contact = App.require('models/contacts');
App.require("config/routes.js")(App.exp, passport);
App.require("config/chatSockets.js")(io, sessionStore, express);

// var newContact = new Contact({
// 	users: ['jim', 'bob']
// });
// newContact.save();
// newContact = new Contact({
// 	users: ['jamal', 'jim']
// });
// newContact.save();
// newContact = new Contact({
// 	users: ['bob', 'jamal']
// });
// newContact.save();
