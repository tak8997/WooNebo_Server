'use strict';

var express = require('express');
var moment = require('moment');
var admin = express.Router();
var kiosk = express.Router();
var media = express.Router();
var product = express.Router();
var config = express.Router();
require('underscore');

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

//admin main page
admin.get('/:id/index', function(req, res) {
    res.render('index', { title: 'admin page', admin: req.user });
});

admin.get('/:id/kiosks', function(req, res) {
    let id = req.params.id;

    models.kiosk.findAll({
        where: {
            register: id
        },
        include: [{
            model: models.mediaFile,
            attributes: ['file_name']
        }],
        raw: true
    }).then(function(kiosks) {
        let result = kiosks.map(function(obj) {
            let value = obj;

            if (!obj.last_play_at) {
                value.last_play_at = "";
            } else {
                value.last_play_at = moment(obj.last_play_at).format('MM/DD HH:mm');
            }
            value.create_at = moment(obj.create_at).format('MM/DD HH:mm');
            value.update_at = moment(obj.update_at).format('MM/DD HH:mm');

            return value;
        });
        res.render('kiosk/index', { title: '키오스크 관리', kiosks: kiosks, admin: req.user });
    }).catch(function(err) {
        res.status(411).send('<script>alert("error"); history.back();</script>');
        res.end();
    });
});
admin.post('/:id/kiosks', function(req, res) {
    let kiosk = {
        description: req.body.description,
        lat: req.body.lat,
        lng: req.body.lng,
        ble: req.body.ble,
        register: req.user.id
    };

    models.kiosk.create(kiosk).then(function() {
        res.redirect('/admins/' + req.user.id + "/kiosks");
    }).catch(function(err) {
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});
admin.get('/:id/kiosks/new', function(req, res) {
    res.render('kiosk/new', { title: '키오스크 등록', kiosk: { id: 'auto', description: "", ble: "" }, admin: req.user });
});
admin.get('/:id/kiosks/:kioskId', function(req, res) {
    let kioskId = Number.parseInt(req.params.kioskId);

    if (!kioskId) {
        res.redirect('/admins');
    }

    models.kiosk.findOne({
        where: {
            id: kioskId
        },
        raw: true
    }).then(function(kiosk) {
        res.render('kiosk/edit', { title: '키오스크 변경', kiosk: kiosk, admin: req.user  });
    }).catch(function(err) {
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});
admin.put('/:id/kiosks/:kioskId', function(req, res) {
    let kiosk = {
        description: req.body.description,
        lat: req.body.lat,
        lng: req.body.lng,
        ble: req.body.ble,
        update_at: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    let kioskId = req.params.kioskId;

    models.kiosk.update(kiosk, {
        where: {
            id: kioskId
        }
    }).then(function() {
        res.redirect('/admins/' + req.params.id + '/kiosks');
    }).catch(function(err) {
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

admin.get('/:id/medias', media);
admin.get('/:id/products', product);
admin.get('/:id/configs', config);

//admin login page
admin.get('/login', function(req, res) {
    res.render('login', { title: 'login', admin: req.user });
});
admin.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/admins');
});

//local authentication
admin.post('/login', passport.authenticate('admin-local', redirects));

admin.all('*', function(req, res) {
    res.redirect('/admins');
});


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
