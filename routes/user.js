'use strict';

var express = require('express');
var user = express.Router();
var auth = express.Router();

var passport = require('../config/passport-user');
var redirects = {
    successRedirect: '/users/success',
    failureRedirect: '/users/failure'
}

module.exports = user;

user.use('/auth', auth);

//authentication success
auth.get('/sucess', function(req, res) {
    res.status(200);
    res.end();
});
//authentication failure
auth.get('/failure', function(req, res) {
    res.status(401);
    res.end();
});

//user facebook OAuth
auth.post('/facebook', passport.authenticate('token-facebook'), function(req, res) {
    res.status(200);
    res.end();
});

//user local authentication
auth.post('/local', passport.authenticate('user-local', redirects));
