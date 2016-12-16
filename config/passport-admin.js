import passport from 'passport';
import Local from 'passport-local';
import moment from 'moment';
import sha256 from 'sha256';

import models from '../models';

var LocalStrategy = Local.Strategy;


module.exports = passport;

passport.use('admin-local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, (email, password, callback)=>{
        models.admin.findOne({
            where: {
                email: email
            },
            attributes: ['id', 'email', ['pwd', 'password'], 'name'],
            raw: true
        }).then((admin)=>{
            if (!admin) return callback(null, false);
            if (admin.password !== sha256(password)) return callback(null, false);

            models.admin.update({
                last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    id: admin.id
                }
            }).then(()=>{
                return callback(null, admin);
            });
        }).catch((err)=>{
            callback(err);
        });
    }
));

passport.serializeUser((admin, done)=>{
    done(null, admin);
});
passport.deserializeUser((admin, done)=>{
    models.admin.findById(admin.id).then((admin)=>{
        done(null, admin);
    }).catch((err)=>{
        done(err);
    });
});
