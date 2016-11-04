'use strict';

var express = require('express');
var admin = express.Router();


module.exports = admin;

admin.get('/', function(req, res) {
    res.render('test', { title: 'hello' });
});
