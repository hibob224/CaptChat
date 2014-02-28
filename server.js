require('./config/app.js');
//Below listens for SIGUSR2 signal used by 'nodemon' on shutdown
process.once('SIGUSR2', function () {
	App.stop();
	gracefulShutdown(function () {
	process.kill(process.pid, 'SIGUSR2');
	});
});

App.start();

