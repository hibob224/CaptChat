require('./config/app.js');

//MONGO DB CONNECTION THINGS
if(App.env === 'openshift'){
	App.mongoStr = "mongodb://" +
		process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		process.env.OPENSHIFT_APP_NAME;
}

App.start();
