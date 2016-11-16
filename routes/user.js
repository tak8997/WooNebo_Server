'use strict';

var express = require('express');
var user = express.Router();
var sha256 = require('sha256');
var admin = require('firebase-admin');

var models = require('../models');


module.exports = user;

admin.initializeApp({
    credential: admin.credential.cert("./config/serviceAccountKey.json"),
    databaseURL: "https://woonebo-android.firebaseio.com"
})
//use auth router
user.post('/auth', function(req, res) {
    let idToken = req.body.idToken;

    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        console.log(decodedToken);
    });
});
