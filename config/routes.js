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

	exp.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/login');
	});

	exp.post('/login', passport.authenticate('local-login', {
		successRedirect: '/',
		failureRedirect: '/login',
	}));

	exp.post('/register', passport.authenticate('local-signup', {
		successRedirect: '/',
		failureRedirect: '/register'
	}));
};
