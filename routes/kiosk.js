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

        // //ble 또는 gps 파라미터가 없을 시
        // res.status(411);
        // res.end();
    }

    //전달 받은 파라미터를 바탕으로 kiosk검색
    models.kiosk.findAll({
        options,
        include: [{

            //join media_files table
            model: models.mediaFile,
            include: [{

                //join media_file_configs table
                model: models.mediaFileConfig,
                include: [{

                    //join products table
                    model: models.product,
                    attributes: [['product_name', 'name'], 'description', 'image']
                }],
                attributes: ['play_time_at']
            }],
            attributes: []
        }],
        attributes: ['id', 'description', 'last_play_at'],
        raw: true
    }).then(function(kiosks) {
        let result = { kiosks: [], counts: 0 };
        let list = {};
        let playTimeAts = {};
        let length = 0;

        //현재 재생 상품에 맞게 매핑
        kiosks.map(function(obj) {
            if (!list[obj.id]) {
                let playAt = moment(obj.last_play_at);
                let playTimeAt = Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
                let duration = moment(Date.now()).diff(playAt, 'seconds');

                //재생되지 않은 상품인지 확인
                if ((duration - playTimeAt) >= 0) {
                    list[obj.id] = {
                        desc: obj.description,
                        product_name: obj['mediaFile.mediaFileConfigs.product.name'],
                        product_image: obj['mediaFile.mediaFileConfigs.product.image'],
                        product_desc: obj['mediaFile.mediaFileConfigs.product.description']
                    };
                    playTimeAts[obj.id] = Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
                    length++;
                }
            } else {
                let playAt = moment(obj.last_play_at);
                let playTimeAt = Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
                let duration = moment(Date.now()).diff(playAt, 'seconds');

                //현재 재생되지 않았고 기록해 놨던 상품보다 나중에 재생되는 상품인지 확인
                if (((duration - playTimeAt) >= 0) && (playTimeAt > playTimeAts[obj.id])) {
                    list[obj.id] = {
                        desc: obj.description,
                        product_name: obj['mediaFile.mediaFileConfigs.product.name'],
                        product_image: obj['mediaFile.mediaFileConfigs.product.image'],
                        product_desc: obj['mediaFile.mediaFileConfigs.product.description']
                    };
                    playTimeAts[obj.id] = obj['mediaFile.mediaFileConfigs.play_time_at'];
                }
            }
        });

        //최종 결과 생성
        for(let id in list) {
            list[id].id = id;
            result.kiosks.push(list[id]);
        }

        //성공
        result.counts = length;
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
    models.kiosk.findAll({
        where: {
            id: kioskId
        },
        include: [{

            //join media_files table
            model: models.mediaFile,
            include: [{

                //join media_file_configs table
                model: models.mediaFileConfig,
                include: [{

                    //join products table
                    model: models.product,
                    attributes: [['product_name', 'name'], 'price', 'description', 'image', 'url']
                }],
                attributes: ['play_time_at']
            }],
            attributes: []
        }],
        attributes: ['last_play_at'],
        raw: true
    }).then(function(products) {

        //키오스크 재생으로부터 지난 시간
        let duration = moment(Date.now()).diff(products[0].last_play_at, 'seconds');

        //현재 시점에 재생 되고 있는 상품 선택
        let product = products.reduce(function(memo, obj) {
            let after = duration - Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
            let before = duration - Number.parseInt(memo['mediaFile.mediaFileConfigs.play_time_at']);

            if ((after <= before) && (after >= 0)) {
                return obj;
            } else {
                return memo;
            }
        }, { 'mediaFile.mediaFileConfigs.play_time_at': 0 });

        //결과로 보내 줄 파라미터 매핑
        let result = {
            id: product['mediaFile.mediaFileConfigs.product.id'],
            name: product['mediaFile.mediaFileConfigs.product.name'],
            price: product['mediaFile.mediaFileConfigs.product.price'],
            desc: product['mediaFile.mediaFileConfigs.product.description'],
            image: product['mediaFile.mediaFileConfigs.product.image'],
            url: product['mediaFile.mediaFileConfigs.product.url']
        };

        //성공
        res.status(200).json(result);
        res.end();
    }).catch(function(err) {

        //실패
        res.status(411);
        res.end();
    });
});

//키오스크가 현재 재생 정보를 보내는 REST
kiosk.post('/:id/play', function(req, res) {
    
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

        //에러 처리
        res.status(411);
        res.end();
    });
});


//인증여부 세션 검사
function ensureAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return next();

        // res.status(401);
        // res.end();
    }
}
