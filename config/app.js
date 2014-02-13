var env     = process.env.NODE_ENV || 'dev',
	path    = require('path'),
	package = require('../package.json'),
	express = require('express');
console.log('Loading app in '+ env + ' mode.');

global.App = {
	exp: express(),
	port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000,
	ip:   process.env.OPENSHIFT_NODEJS_IP   || process.env.IP   || "0.0.0.0",
	env: env,
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

var server  = require('http').createServer(App.exp),
	io      = require('socket.io').listen(server, {log: false});

/* EXPRESS WEB FRAMEWORK MiddleWare BELOW */
App.exp.set('views', App.appPath('WebApp'));
App.exp.set('view engine', 'jade');
App.exp.use(express.static(App.appPath('WebApp/public')));
App.exp.use(express.logger('dev'));

App.require("config/routes.js")(App.exp);
App.require("config/chatSockets.js")(io);
