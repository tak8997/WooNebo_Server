'use strict';

var express = require('express');
var user = express.Router();
var auth = express.Router();
var sha256 = require('sha256');
var moment = require('moment');

var models = require('../models');
var passport = require('../config/passport-user');
var redirects = {
    successRedirect: '/users/auth/success',
    failureRedirect: '/users/auth/failure'
}


module.exports = user;

//use auth router
user.use('/auth', auth);

//유저 생성
user.post('/', function(req, res) {
    let data = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        age: req.body.age,
        sex: req.body.sex
    }

    //등록된 유저인지 확인
    models.user.findOne({
        where: {
            email: data.email
        },
        raw: true
    }).then(function(result) {

        //등록되지 않은 유저의 경우
        if (!result) {

            //유저 생성
            models.user.create(data).then(function(){
                res.status(200);
                res.end();
            });

        } else {

            //등록된 유저의 경우
            throw null;
        }
    }).catch(function(err) {

        //에러 처리
        res.status(411);
        res.end();
    });
});

//유저 정보 변경
user.put('/:email', function(req, res) {
    let email = req.params.email;
    let password = req.body.password;
    let data = {
        name: req.body.name,
        age: req.body.age,
        sex: req.body.sex
    }

    //유저 정보를 검색하여 변경
    models.user.update(data, {
        where: {
            email: email,
            pwd: sha256(password)
        }
    }).then(function(result) {

        //변경된 레코드가 있는지 확인
        if (result[0] === 0) throw null;

        //성공
        res.status(200);
        res.end();

    }).catch(function(err) {

        //실패
        res.status(411);
        res.end();
    })
});

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

//facebook OAuth by access_token
auth.post('/facebook', passport.authenticate('token-facebook'), function(req, res) {
    res.status(200);
    res.end();
});

//local authentication
auth.post('/local', passport.authenticate('user-local', redirects));
