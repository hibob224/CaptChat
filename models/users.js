var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	username: {type: String, required: true, select: true, unique: true},
	password: {type: String, required: true, select: false}
}, {autoIndex: App.env === 'dev'});

var User = mongoose.model('User', userSchema);

module.exports = User;
