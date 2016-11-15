var passport = require('passport');
var TokenFacebookStrategy = require('./passport-facebook-token').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var shortid = require('shortid');
var moment = require('moment');
var sha256 = require('sha256');

var models = require('../models');


module.exports = passport;

passport.use('user-local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(email, password, callback) {
        models.user.findOne({
            where: {
                email: email
            },
            attributes: ['id', 'email', ['pwd', 'password']],
            raw: true
        }).then(function(user) {
            if (!user) return callback(null, false);
            if (user.password !== sha256(password)) return callback(null, false);

            models.user.update({
                last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    id: user.id
                }
            }).then(function() {
                return callback(null, user);
            });
        }).catch(function(err) {
            callback(err);
        });
    }
));
passport.use(new TokenFacebookStrategy({
        clientID: 1428399880510956,
        clientSecret: "9d5b45ea0e843e7c1651c6bf401b39a4",
        profileFields: ['id', 'displayName']
    }, function(accessToken, refreshToken, profile, callback) {
        models.user.findOrCreate({
            where: {
                email: profile.id,
                name: profile.displayName
            },
            defaults: {
                pwd: sha256(shortid.generate())
            },
            raw: true
        }).then(function(user) {
            user = user[0];
            user.accessToken = accessToken;

            models.user.update({
                last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    email: profile.id
                }
            });

            return callback(null, user);

        }).catch(function(err) {
            callback(err);
        });
    })
);


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    models.user.findById(user.id).then(function(user) {
        done(null, user);
    }).catch(function(err) {
        done(err);
    });
});
