var express = require("express");
var app     = express();

app.set('views', __dirname + '/WebApp');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/WebApp/public'));


app.get('/', function(req, res) {
	res.render('index');
});


app.listen(3000);
console.log('listening on port 3000');
