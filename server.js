var express = require('express');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var app = express();
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

//요청 REST 로그
app.use(function(req, res, next) {
    console.log(req.method + ' ' + req.originalUrl);
    next();
});

//use json body-parser
app.use(bodyParser.json());

//use express-validator
app.use(validator());

//라우터 사용
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
