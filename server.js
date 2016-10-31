var express = require('express');
var app = express();
var router = require('./router');

app.use(function(req, res, next) {
    console.log(req.method + ' ' + req.originalUrl);
    next();
});

app.use(router);

app.listen(3000, function() {
    console.log('Server started, localhost:3000');
});
