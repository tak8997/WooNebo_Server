var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var router = require('./router');
var errorHandler = require('./errorHandler');

//요청 REST 로그
app.use(function(req, res, next) {
    console.log(req.method + ' ' + req.originalUrl);
    next();
});

//use json body-parser
app.use(bodyParser.json());

//라우터 사용
app.use(router);

//에러 처리
for (key in errorHandler) {
    app.use(errorHandler[key]);
}

//Listen
app.listen(3000, function() {
    console.log('Server started, localhost:3000');
});
