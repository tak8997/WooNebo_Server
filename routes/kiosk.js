'use strict';

var express = require('express');
var kiosk = express.Router();
var moment = require('moment');
require('underscore');

var models = require('../models');
var gps_maxDiatance = 100;


module.exports = kiosk;

//현재 위치나 BLE를 기반으로 하여 키오스크의 정보를 요청받는 REST
kiosk.get('/', ensureAuthentication, function(req, res) {
    let options = { where: {} };

    //ble파라미터 존재 시
    if (req.query.ble) {
        options = {
            where: {
                ble: req.query.ble
            }
        }
    } else if (req.query.lat && req.query.lng) {

        //gps 파라미터 존재 시
        let lat = req.query.lat;
        let lng = req.query.lng;

        //최대 거리 파라미터 존재 시 (없을 경우 default value 사용)
        if (req.query.maxDistance) {
            gps_maxDiatance = req.query.maxDistance;
        }

        options = {
            where: {
                lat: {

                },
                lng: {

                }
            }
        }
    } else {

        //ble 또는 gps 파라미터가 없을 시
        res.status(411);
        res.end();
    }

    //전달 받은 파라미터를 바탕으로 kiosk검색
    models.kiosk.findAll(options).then(function(rows) {
        let result = {};

        //조회 결과가 없을 경우 에러 처리
        if (rows.length === 0) throw null;

        //결과값 기록
        result.count = rows.length;
        result.kiosks = rows.map(function(obj) { return { id: obj.id, desc: obj.description }});

        //성공
        res.status(200).json(result);
        res.end();
    }).catch(function(err) {

        //에러
        res.status(411);
        res.end();
    });
});

//키오스크에서 재생되는 상품의 상세 정보를 요청받는 REST
kiosk.get('/:id/products', ensureAuthentication, function(req, res) {
    let kioskId = Number.parseInt(req.params.id);

    //키오스크 id를 통해 현재 실행중인 파일 조회
    models.kiosk.findOne({
        where: {
            id: kioskId
        },
        attributes: [['last_play_at', 'playAt'], ['last_play_file_id', 'fileId']],
        raw: true
    }).then(function(result) {
        let fileId = result.fileId;
        let playAt = moment(result.playAt);
        let duration = moment(Date.now()).diff(playAt, 'seconds');

        //파일 아이디와 파일의 실행 시간을 통해 현재 광고중인 상품을 조회
        models.mediaFileConfig.findOne({
            where: {
                file_id: fileId,
                play_time_at: {
                    $lt: duration
                }
            },
            order: [['play_time_at', 'DESC']],
            attributes: [['product_id', 'productId']],
            raw: true
        }).then(function(result) {

            //상품의 상세 정보를 조회
            models.product.findOne({
                where: {
                    id : result.productId
                },
                attributes: ['id', ['product_name', 'name'], 'price', ['description', 'desc'], 'url'],
                raw: true
            }).then(function(result) {

                //성공 시 상품 상세정보 전송
                res.status(200).json(result);
            });
        });
    }).catch(function(err) {

        //실패
        res.status(411);
        res.end();
    });
});

//키오스크가 현재 재생 정보를 보내는 REST
kiosk.post('/:id/play', function(req, res) {
    let sequelize = require('sequelize');

    //Transaction 시작
    models.sequelize.transaction(function(t) {
        if (!req.body.playAt || !req.body.fileName) {
            throw null;
        }

        let playAt = moment(req.body.playAt).format("YYYY-MM-DD HH:mm:ss");
        let kioskId = req.params.id;
        let fileName = req.body.fileName;
        let now = moment().format("YYYY-MM-DD HH:mm:ss");

        //파일이름을 통해 해당파일의 id조회
        return models.mediaFile.findOne({
            where: {
                file_name: fileName
            },
            attributes: ['id'],
            raw: true,
            transaction: t
        }).then(function(file) {

            //키오스크에 현재 실행파일과 실행 시간을 기록
            return models.kiosk.update({
                last_play_at: playAt,
                last_play_file_id: file.id
            }, {
                where: {
                    id: kioskId
                },
                transaction: t
            }).then(function(result) {

                //실행 로그 기록
                return models.playInfo.create({
                    file_id: file.id,
                    kiosk_id: kioskId,
                    play_at: now
                }, {
                    transaction: t
                }).then(function(result) {

                    //실행 성공시 커밋
                    t.commit();
                    res.status(200);
                    res.end();
                });
            });
        }).catch(function(err) {

            //실패시 롤백
            t.rollback();
            next();
        });
    }).catch(function(err) {
        res.status(411);
        res.end();
    });
});


function ensureAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return next();
        
        res.status(401).json({ error: "Unauthorized" })
        res.end();
    }
}
