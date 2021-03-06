var mongoose = require('mongoose'),
	Schema   = mongoose.Schema,
	bcrypt   = require('bcrypt-nodejs'),
	LOCK_TIME = 2 * 60 * 60 * 1000, //2 hours
	MAX_LOGIN_ATTEMPTS = 5,
	SALT_WORK_FACTOR   = 10;

var UserSchema = new Schema({
	username: {type: String, required: true, select: true, unique: true},
	password: {type: String, required: true},
	contacts: [String], //Confirmed Contacts
	requesting: [String], //Requests sent by user
	requests: [String], //Requests received

	//Properties for stopping Brute Forcing
	loginAttempts: {type: Number, required: true, default: 0},
	lockUntil: {type: Number}
}, {autoIndex: App.env === 'dev'});

var reasons = UserSchema.statics.failedLogin = {
	NOT_FOUND: 0,
	PASSWORD_INCORRECT: 1,
	MAX_ATTEMPTS: 2
};

UserSchema.virtual('isLocked').get(function() {
	return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre('save', function(next) {
	var user = this;

	// Only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();

	// Generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);

		// Hash the password using our new salt
		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) return next(err);

			// Override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

UserSchema.methods.incLoginAttempts = function(cb) {
	// If we have a previous lock that has expired, restart at 1
	if (this.lockUntil && this.lockUntil < Date.now()) {
		return this.update({
			$set: { loginAttempts: 1 },
			$unset: { lockUntil: 1 }
		}, cb);
	}
	// Otherwise we're incrementing
	var updates = { $inc: { loginAttempts: 1 } };
	// Lock the account if we've reached max attempts and it's not locked already
	if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
		updates.$set = { lockUntil: Date.now() + LOCK_TIME };
	}
	return this.update(updates, cb);
};

UserSchema.statics.getAuthenticated = function(username, password, cb) {
	this.findOne({ username: username }, 'password', function(err, user) {
		if (err) return cb(err);

		// make sure the user exists
		if (!user) {
			return cb(null, null, reasons.NOT_FOUND);
		}

		// check if the account is currently locked
		if (user.isLocked) {
			// just increment login attempts if account is already locked
			return user.incLoginAttempts(function(err) {
				if (err) return cb(err);
				return cb(null, null, reasons.MAX_ATTEMPTS);
			});
		}

		// test for a matching password
		user.comparePassword(password, function(err, isMatch) {
			if (err) return cb(err);

			// check if the password was a match
			if (isMatch) {
				// if there's no lock or failed attempts, just return the user
				if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
				// reset attempts and lock info
				var updates = {
					$set: { loginAttempts: 0 },
					$unset: { lockUntil: 1 }
				};
				return user.update(updates, function(err) {
					if (err) return cb(err);
					return cb(null, user);
				});
			}

			// password is incorrect, so increment login attempts before responding
			user.incLoginAttempts(function(err) {
				if (err) return cb(err);
				return cb(null, null, reasons.PASSWORD_INCORRECT);
			});
		});
	});
};

UserSchema.statics.sendRequest = function(requester, requestee, cb) {
	if( typeof cb !== 'function' ) cb = function(){};
	this.find({$or: [{$and: [{username: requester}, {requesting: {$in:[requestee]}}]}, {$and: [{username:requestee},{requests: {$in:[requester]}}]}]}, function (err, users) {
		if (err) throw err;

		if (users.length !== 0) {
			cb('Request already exists.');
		} else {
			User.find({username: {$in: [requester, requestee]}}, function (err, users) {
				if (err) throw err;
				if (users.length != 2) {
					return cb('Users not found.');
				} else {
					if (users[0].username == requester) {
						users[0].requesting.push(requestee);
						users[1].requests.push(requester);
					} else {
						users[1].requesting.push(requestee);
						users[0].requests.push(requester);
					}
					users[0].save();
					users[1].save();
					return cb('Request sent');
				}
			});
		}
	});
};

UserSchema.methods.sendRequest = function(requestee, cb){
	if( typeof cb !== 'function' ) cb = function(){};
	this.model('User').sendRequest(this.username, requestee, cb);
};

UserSchema.statics.addContact = function(user1, user2, cb) { //Add users to each others contacts (and remove from requests if present)
	if( typeof cb !== 'function' ) cb = function(){};
	function addContact (userToAdd) {
		return function (err, user) {
			if (err) throw err;
			if (user.contacts.indexOf(userToAdd) === -1) {
				if (user.requests.indexOf(userToAdd) >= 0)  //Remove userToAdd from requests (if there)
					user.requests.splice(user.requests.indexOf(userToAdd), 1);
				if (user.requesting.indexOf(userToAdd) >= 0) //Remove userToAdd from requesting (if there)
					user.requesting.splice(user.requesting.indexOf(userToAdd), 1);

				user.contacts.push(userToAdd);				//Add userToAdd to contacts
				user.save();
			}
		};
	}

	this.findOne({ username: user1, requests: { $in: [user2] }}, function(err, user) {
		if (err) throw err;

		if (!user) {
			cb('Request doesn\'t exist.');
		} else {
			User.findOne({ username: user1 }, addContact(user2));
			User.findOne({ username: user2 }, addContact(user1));
		}
	});
};

UserSchema.statics.getContacts = function(name, cb) {
	this.findOne({ username: name }, function(err, user) {
		if (err) throw err;

		if (user) {
			cb(user.contacts);
		}
	});
};

UserSchema.methods.addContact = function(user2, cb) {
	if( typeof cb !== 'function' ) cb = function(){};
	this.model('User').addContact(this.username, user2, cb);
};

module.exports = mongoose.model('User', UserSchema);
