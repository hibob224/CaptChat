module.exports = function(exp) {

	exp.get('/', function(req, res) {
		res.render('index', {openshift: process.env.OPENSHIFT_NODEJS_PORT ? true : false});
	});

	exp.get('/register', function(req, res) { //Regular register page request
		res.render('register');
	});

	exp.post('/register', function(req, res) { //Register form POST request
		if (req.param('regUser') === null || req.param('regPass') === null) { //Missing field
			res.send('Registering requires both a username and password.', 400);
		}

		var newUser = new User({
			username: req.param('regUser'),
			password: req.param('regPass')
		});

		User.findOne({username: newUser.username}, function(err, user) {
			if (user) {
				res.send('User exists.', 400);
			} else {
				newUser.save(function(err) {
					if (err) res.send(err, 400);

					res.send('User added', 200);
				});
			}
		});
	});
};
