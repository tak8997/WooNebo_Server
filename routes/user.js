'use strict';

var express = require('express');
var user = express.Router();
var sha256 = require('sha256');
var admin = require('firebase-admin');
var moment = require('moment');

var models = require('../models');


module.exports = user;

admin.initializeApp({
    credential: admin.credential.cert("./config/serviceAccountKey.json"),
    databaseURL: "https://woonebo-android.firebaseio.com"
});

//use auth router
user.post('/auth', function(req, res) {
    let idToken = req.body.idToken;

    admin.auth().verifyIdToken(idToken).then(function(decodedToken) {
        let user = {
            email: decodedToken.user_id,
            name: decodedToken.name
        }

        models.user.findOrCreate({
            where: user,
            raw: true
        }).then(function(result) {
            models.user.update({
                token: idToken,
                last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    id: result[0].id
                }
            }).then(function(result) {
                res.status(200);
                res.end();
            });
        }).catch(function(err) {
            res.status(401);
            res.end();
        });
    });
});
