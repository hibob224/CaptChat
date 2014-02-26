var mongoose = require('mongoose'),
	Schema	 = mongoose.Schema,
	username = require('./user');

var ContactSchema = new Schema({
	users 		: [String], //user[0] is requesting party, user[1] is the requested
	confirmed	: { type: Boolean, default: false, index: true },
	create		: { type: Date, default: Date.now }
});

ContactSchema.statics.findContactsOf = function (username, cb) {
	this.find({ users: { $in: [username] }, confirmed: true}, function (err, contacts) {
		if (err) throw err;

		var contactsNames = [];
		for (var i in contacts) {
		 contactsNames.push((username != contacts[i].users[0]) ? contacts[i].users[0] : contacts[i].users[1]);
		}

		cb(contactsNames);
	});
}

ContactSchema.statics.isContact = function (user1, user2, cb) { //Tests if user1 and user2 are contacts
	this.findOne({ users: {$in: [user1], $in: [user2] }}, function(err, contact) {
		if (err) throw err;

		if (!contact)
			cb(false, 'NOT CONTACT');
		else
			if (contact.confirmed)
				cb(true);
			else
				cb(false, 'NOT CONFIRMED');
	});
}

ContactSchema.statics.replyToRequest = function(requestingUser, requestedUser, reply,  cb) {	//Accept/Deny/Cancel requests. Order of users is important!
	this.findOne({ users: { $in: [requestingUser], $in: [requestedUser] }, confirmed: false }, function (err, contact) {
		if (err) throw err;

		if (!contact)
			cb(false, 'REQUEST DOESNT EXIST');
		else {
			if (reply === false) {
				contact.remove();
				cb(true, 'REQUEST DENIED/CANCELLED');
			}

			if (contact.users[1] == requestedUser) {
				contact.confirmed = true;
				contact.save();
				cb(true, 'REQUEST ACCEPTED');
			} else {
				cb(false, 'CANNOT BE ACCEPTED BY REQUESTER'); //Assuming user[1] is the requested party
			}
		}
	});
}

module.exports = mongoose.model('Contact', ContactSchema);
