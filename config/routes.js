module.exports = function(exp, passport) {

	exp.get('/', function (req, res) {
		if(req.isAuthenticated()){
			res.render('index', {openshift: process.env.OPENSHIFT_NODEJS_PORT ? true : false});
		} else {
			res.redirect('/login');
		}
	});

	exp.get('/register', function (req, res) { //Regular register page request
		res.render('register');
	});

	exp.get('/login', function (req, res) {
		res.render('login');
	});

	// exp.post('/login', function (req, res, next){
	// 	passport.authenticate('local-signup', function (err, user, info) {
	// 		if (err) return next(err);
	// 		if (!user) {
	// 			req.session.message = [info.message];
	// 			return res.redirect('/login');
	// 		}
	// 		req.logIn(user, function (err){
	// 			if (err) return next(err);
	// 			return res.redirect('/');
	// 		});
	// 	})(req,res,next);
	// });

	exp.post('/login', passport.authenticate('local-login', {
		successRedirect:'/',
		failureRedirect: '/login',
	}));

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
