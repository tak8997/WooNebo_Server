var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();

app.get('/', function(req, res) {
    res.send(req.query);
});

app.listen(3000, function() {
    console.log('Server started, localhost:3000');
});
