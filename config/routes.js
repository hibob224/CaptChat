module.exports = function(exp) {
	exp.get('/', function(req, res) {
		res.render('index', {openshift: process.env.OPENSHIFT_NODEJS_PORT ? true : false});
	});
};
