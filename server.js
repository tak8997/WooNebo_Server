var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var passport = require('passport');
var router = require('./router');
var errorHandler = require('./errorHandler');
// var https = require('https');
// var fs = require('fs');
// var key = fs.readFileSync('./key.pem');
// var cert = fs.readFileSync('./cert.pem');
// var options = {
//     key: key,
//     cert: cert
// };

//use template engine ejs
app.engine('ejs', require('ejs-locals'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

//regist public directory
app.use(express.static(__dirname + '/public'));

//use passport required
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

//use body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//요청 REST 로그
app.use(function(req, res, next) {
    console.log(req.method + ' ' + req.originalUrl);
    next();
});

//라우터 등록
app.use(router);

//정의 되지 않은 페이지 오류
app.all("*", function(req, res) {
    res.writeHead(404, "Not exist pages");
    res.end();
});

//Unhandling 에러 처리
app.use(errorHandler);

//Listen
app.listen(3000, function() {
    console.log("server started, localhost:3000");
});

// //https protocol
// https.createServer(options, app).listen(3000, function() {
//     console.log('Server started, localhost:3000');
// });
