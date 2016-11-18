'use strict';

var express = require('express');
var moment = require('moment');
var admin = express.Router();
require('underscore');

var passport = require('../../config/passport-admin');
var models = require('../../models');
var kiosk = require('./kiosk');
var product = require('./product');
var media = require('./media');
var redirects = {
    successRedirect: '/admins',
    failureRedirect: '/admins/login'
}


module.exports = admin;

//admin index page
admin.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        models.searchLog.findAll({
            where: {
                search_at: {
                    $gte: moment().subtract(1, 'days').format('YYYY-MM-DD')
                }
            },
            include: [
                {
                    model: models.product,
                    where: {
                        register: req.user.id
                    },
                    attributes: [['product_name', 'name']]
                }
            ],
            attributes: [
                [ models.sequelize.fn('count', '*'), 'counts' ]
            ],
            group: 'product_id',
            order: 'counts DESC',
            limit: 10,
            raw: true
        }).then(function(result) {
            let daily = result.map(function(product) {
                return { name: product['product.name'], counts: product.counts };
            });

            models.searchLog.findAll({
                where: {
                    search_at: {
                        $gte: moment().subtract(1, 'months').format('YYYY-MM-DD')
                    }
                },
                include: [
                    {
                        model: models.product,
                        where: {
                            register: req.user.id
                        },
                        attributes: [['product_name', 'name']]
                    }
                ],
                attributes: [
                    [ models.sequelize.fn('count', '*'), 'counts' ]
                ],
                group: 'product_id',
                order: 'counts DESC',
                limit: 10,
                raw: true
            }).then(function(result) {
                let monthly = result.map(function(product) {
                    return { name: product['product.name'], counts: product.counts };
                });

                res.render('index', { title: 'admin page', data: { daily: daily, monthly: monthly }, admin: req.user });
            });
        }).catch(function(err) {
            res.status(500);
            res.end();
        });
    } else {
        res.redirect('admins/login');
    }
});

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

//관리자 메뉴 사용
admin.use('/kiosks', ensureAuthentication, kiosk);
admin.use('/products', ensureAuthentication, product);
admin.use('/medias', ensureAuthentication, media);

//존재하지 않는 REST접근시 index 페이지로 이동
admin.all('*', function(req, res) {
    res.redirect('/admins');
});


//인증여부 세션 검사
function ensureAuthentication(req, res, next) {

    //로그인 여부 검사
    if (req.isAuthenticated()) {
        next();
    } else {

        //비 로그인 시 로그인 페이지로 이동
        res.redirect('/admins/login');
    }
}
