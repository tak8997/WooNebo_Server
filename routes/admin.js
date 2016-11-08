'use strict';

var express = require('express');
var admin = express.Router();
var kiosk = express.Router();
var media = express.Router();
var product = express.Router();
var config = express.Router();

var passport = require('../config/passport-admin');
var models = require('../models');
var redirects = {
    successRedirect: '/admins',
    failureRedirect: '/admins/login'
}


module.exports = admin;

//admin index page
admin.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/admins/' + req.user.id + '/index');
    } else {
        res.redirect('admins/login');
    }
});

//로그인 여부 검사
admin.all('/:id/*', ensureAuthentication);
admin.param('id', function(req, res, next, id) {
    next();
})

//admin main page
admin.get('/:id/index', function(req, res) {
    res.render('admin', { title: 'admin page' });
});

admin.get('/:id/kiosks', function(req, res) {
    let id = req.params.id;

    models.kiosk.findAll({
        where: {
            register: id
        },
        raw: true
    }).then(function(kiosks) {
        res.json(kiosks);
        res.end();
    }).catch(function(err) {
        res.status(411).send('Error');
        res.end();
    });
});

admin.get('/:id/medias', media);
admin.get('/:id/products', product);
admin.get('/:id/configs', config);

//admin login page
admin.get('/login', function(req, res) {
    res.render('login', { title: 'login' });
});

//local authentication
admin.post('/login', passport.authenticate('admin-local', redirects));


//인증여부 세션 검사
function ensureAuthentication(req, res, next) {

    //로그인 여부 검사
    if (req.isAuthenticated()) {

        //요청 아이디와 로그인된 아이디를 검사
        if (req.user.id == req.params.id) {
            return next();
        } else {

            //현재 로그인중이지 않은 아이디로 요청시 자신의 메인페이지로 강제이동
            res.redirect('/admins/' + req.user.id + '/index');
        }
    } else {

        //비 로그인 시 로그인 페이지로 이동
        res.redirect('/admins/login');
    }
}
