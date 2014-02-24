var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	User = require('../models/user.js');

passport.use('local-login', new LocalStrategy(
	function(username, password, done){
		console.log('Authenticating user');
		User.getAuthenticated(username, password, function(err, user, reason) {
			if (err) throw err;

			if (user) { //Login success
				return done(null, user);
			}

			//Login failed, display reason
			var reasons = User.failedLogin;
			switch (reason) {
			case reasons.NOT_FOUND:
			case reasons.PASSWORD_INCORRECT:
				return done(null,false, {message: 'Incorrect Username/Password' });
			case reasons.MAX_ATTEMPTS:
				return done(null,false,{message: 'Max Attempts'});
			}
		});
	}
));

passport.use('local-signup', new LocalStrategy(
	function (username, password, done) {
		var newUser = new User({
			username: username,
			password: password
		});

		User.findOne({username: username}, function(err, user) {
			if (user) {
				return done(null, false, {message: 'User exists.'});
			} else {
				newUser.save(function(err) {
					if (err) done(err);
					return done(null, newUser);
				});
			}
		});
	}
));


passport.serializeUser(function(user, done) {
	done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

module.exports = passport;