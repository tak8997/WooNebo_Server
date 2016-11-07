var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy  = require('passport-facebook').Strategy;
var moment = require('moment');
var sha256 = require('sha256');

var models = require('../models');


module.exports = passport;

passport.use('admin-local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(email, password, callback) {
        models.admin.findOne({
            where: {
                email: email
            },
            attributes: ['id', 'email', ['pwd', 'password'], 'name'],
            raw: true
        }).then(function(admin) {
            if (!admin) return callback(null, false);
            if (admin.password !== password) return callback(null, false);

            models.admin.update({
                last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    id: admin.id
                }
            }).then(function() {
                return callback(null, admin);
            });
        }).catch(function(err) {
            callback(err);
        });
    }
));

passport.serializeUser(function(admin, done) {
    done(null, admin);
});
passport.deserializeUser(function(admin, done) {
    models.admin.findById(admin.id).then(function(admin) {
        done(null, admin);
    }).catch(function(err) {
        done(err);
    });
});
