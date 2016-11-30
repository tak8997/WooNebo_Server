'use strict';

var express = require('express');
var kiosk = express.Router();
var moment = require('moment');
require('underscore');

var models = require('../../models');
var limit = 10;


module.exports = kiosk;

//키오스크 리스트 페이지
kiosk.get('/', pagination, function(req, res) {
    var page = req.query.page || 1;

    //관리자가 등록한 키오스크 검색
    models.kiosk.findAll({
        where: {
            register: req.user.id
        },
        offset: (page - 1) * limit,
        limit: limit,
        //join media_files table
        include: [{
            model: models.mediaFile,
            attributes: ['file_name']
        }],
        raw: true
    }).then(function(kiosks) {

        //검색 결과를 매핑
        let result = kiosks.map(function(obj) {
            let value = obj;

            if (!obj.last_play_at) {
                value.last_play_at = "";
            } else {
                value.last_play_at = moment(obj.last_play_at).format('MM/DD HH:mm');
            }
            if (!obj['mediaFile.file_name']) {
                obj.last_file = "";
            } else {
                obj.last_file = obj['mediaFile.file_name'];
            }
            value.serial = obj.serial;
            value.create_at = moment(obj.create_at).format('MM/DD HH:mm');
            value.update_at = moment(obj.update_at).format('MM/DD HH:mm');

            return value;
        });

        //성공
        res.render('kiosk/index', { title: '키오스크 관리', kiosks: kiosks, locals: res.locals, admin: req.user });
    }).catch(function(err) {

        //에러
        res.status(411).send('<script>alert("error"); history.back();</script>');
        res.end();
    });
});

//키오스크 등록
kiosk.post('/', function(req, res) {
    let kiosk = {
        description: req.body.description,
        lat: req.body.lat,
        lng: req.body.lng,
        ble: req.body.ble,
        serial: req.body.serial,
        register: req.user.id
    };

    models.kiosk.create(kiosk).then(function() {

        //성공
        res.status(200).send('<script>alert("키오스크 등록 성공"); window.location.assign("/admins/kiosks")</script>');
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//키오스크 등록 포멧 페이지
kiosk.get('/new', function(req, res) {
    res.render('kiosk/new', { title: '키오스크 등록', kiosk: { id: 'auto', description: "", ble: "" }, admin: req.user });
});

//키오스크 상세 정보 페이지
kiosk.get('/:kioskId', function(req, res) {
    let kioskId = Number.parseInt(req.params.kioskId);

    if (!kioskId) {
        res.redirect('/admins');
    }

    //키오스크 아이디를 기반으로 검색
    models.kiosk.findOne({
        where: {
            id: kioskId
        },
        raw: true
    }).then(function(kiosk) {

        //성공
        res.render('kiosk/edit', { title: '키오스크 변경', kiosk: kiosk, admin: req.user  });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//키오스크 상세 정보 변경
kiosk.put('/:kioskId', function(req, res) {
    let kiosk = {
        description: req.body.description,
        lat: req.body.lat,
        lng: req.body.lng,
        ble: req.body.ble,
        serial: req.body.serial
    };
    let kioskId = req.params.kioskId;

    //아이디를 검색하여 정보를 변경
    models.kiosk.update(kiosk, {
        where: {
            id: kioskId
        }
    }).then(function() {

        //성공
        res.status(200).send('<script>alert("키오스크 변경 성공"); window.location.assign("/admins/kiosks")</script>');
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});


//페이지네이션 함수
function pagination(req, res, next) {
    let page = parseInt(req.query.page) || 1,
        num = page * limit;

    models.kiosk.count({
        where: {
            register: req.user.id
        }
    }).then(function(total) {
        res.locals.total = total;
        res.locals.pages = Math.ceil(total / limit);
        res.locals.page = page;
        if (num < total) res.locals.next = true;
        if (num > limit) res.locals.prev = true;
        next();
    });
}
