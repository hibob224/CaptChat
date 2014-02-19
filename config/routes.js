module.exports = function(exp) {

	exp.get('/', function(req, res) {
		res.render('index', {openshift: process.env.OPENSHIFT_NODEJS_PORT ? true : false});
	});

	exp.get('/register', function(req, res) { //Regular register page request
		res.render('register');
	});

	exp.get('/login', function(req, res) {
		res.render('login');
	});

	exp.post('/login', function(req, res) {
		if (req.param('user') === null || req.param('pass') === null) {
			res.send('Missing username or password', 400);
		}

		User.getAuthenticated(req.param('user'), req.param('pass'), function(err, user, reason) {
			if (err) throw err;

			if (user) { //Login success
				res.send('Login success (tho not really)', 200);
				return;
			}

			//Login failed, display reason
			var reasons = User.failedLogin;
			switch (reason) {
			case reasons.NOT_FOUND:
			case reasons.PASSWORD_INCORRECT:
				res.send('Username/Password Incorrect', 400);
				break;
			case reasons.MAX_ATTEMPTS:
				res.send('Max Attempts');
				break;
			}
		});
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
