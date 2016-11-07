'use strict';

var express = require('express');
var admin = express.Router();

var passport = require('../config/passport-admin');
var redirects = {
    successRedirect: '/admins',
    failureRedirect: '/admins/login'
}


module.exports = admin;

//admin index page
admin.get('/', ensureAuthentication, function(req, res) {
    res.render('admin', { title: 'admin page' });
});

//admin login page
admin.get('/login', function(req, res) {
    res.render('login', { title: 'login' });
});

//local authentication
admin.post('/login', passport.authenticate('admin-local', redirects));

function ensureAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/admins/login');
    }
}
