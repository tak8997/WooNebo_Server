'use strict';

var express = require('express');
var kiosk = express.Router();
var moment = require('moment');
var request = require('request');
require('underscore');

var models = require('../models');
var util = require('../util');
var gps_maxDiatance = 100;


module.exports = kiosk;

//현재 위치나 BLE를 기반으로 하여 키오스크의 정보를 요청받는 REST
kiosk.get('/', function(req, res) {
    let options = {};

    //ble파라미터 존재 시
    if (req.query.ble) {
        options = {
            ble: req.query.ble
        }
    } else if (req.query.lat && req.query.lng) {

        //gps 파라미터 존재 시
        let lat = req.query.lat;
        let lng = req.query.lng;

        //최대 거리 파라미터 존재 시 (없을 경우 default value 사용)
        if (req.query.maxDistance) {
            gps_maxDiatance = req.query.maxDistance;
        }

        //현재 좌표와 최대 탐색 거리를 이용하여 좌표 범위를 역산
        let points = util.findPoints({ lat: lat, lng: lng }, gps_maxDiatance);

        options =  {
            lat: {
                $between: [points.lat.min, points.lat.max]
            },
            lng: {
                $between: [points.lng.min, points.lng.max]
            }
        }

    } else {

        //ble 또는 gps 파라미터가 없을 시
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();

        return;
    }

    //전달 받은 파라미터를 바탕으로 kiosk검색
    models.kiosk.findAll({
        where: options,
        include: [{

            //join media_files table
            model: models.mediaFile,
            include: [{

                //join media_file_configs table
                model: models.mediaFileConfig,
                include: [{

                    //join products table
                    model: models.product,
                    attributes: ['id', ['product_name', 'name'], 'description', 'image']
                }],
                attributes: ['play_time_at']
            }],
            attributes: ['total_play_time']
        }],
        attributes: ['id', 'description', 'last_play_at', 'image'],
        order: ['id', [models.mediaFile, models.mediaFileConfig, 'play_time_at']],
        raw: true
    }).then(function(kiosks) {
        let result = { kiosks: [], counts: 0 };
        let list = {};
        let playTimeAts = {};
        let length = 0;
        let validate = 0;
        let fileEnd = 0;

        //현재 재생 상품에 맞게 매핑
        kiosks.map(function(obj) {
            let playAt = moment(obj.last_play_at);
            let playTimeAt = Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
            let duration = moment(Date.now()).diff(playAt, 'seconds');
            let total = Number.parseInt(obj['mediaFile.total_play_time']);
            let totalDuration = total - duration;

            //총 광고 시간이 등록 된 것만 연산
            if (totalDuration > 0) {

                //파일 종료 시점이 가장 짧은 것 선택
                if ((fileEnd === 0) || (fileEnd > totalDuration)) {
                    fileEnd = totalDuration;
                }
            }

            if (!list[obj.id]) {

                //재생되지 않은 상품인지 확인
                if ((duration - playTimeAt) >= 0) {
                    list[obj.id] = {
                        desc: obj.description,
                        image: obj.image,
                        product_id: obj['mediaFile.mediaFileConfigs.product.id'],
                        product_name: obj['mediaFile.mediaFileConfigs.product.name'],
                        product_image: obj['mediaFile.mediaFileConfigs.product.image'],
                        product_desc: obj['mediaFile.mediaFileConfigs.product.description']
                    };
                    playTimeAts[obj.id] = Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
                    length++;
                }
            } else {

                //현재 재생되지 않았고 기록해 놨던 상품보다 나중에 재생되는 상품인지 확인
                if ((duration - playTimeAt) >= 0) {
                    if (playTimeAt > playTimeAts[obj.id]) {
                        list[obj.id] = {
                            desc: obj.description,
                            image: obj.image,
                            product_id: obj['mediaFile.mediaFileConfigs.product.id'],
                            product_name: obj['mediaFile.mediaFileConfigs.product.name'],
                            product_image: obj['mediaFile.mediaFileConfigs.product.image'],
                            product_desc: obj['mediaFile.mediaFileConfigs.product.description']
                        };
                        playTimeAts[obj.id] = obj['mediaFile.mediaFileConfigs.play_time_at'];
                    }
                } else {

                    //다음 polling timing 계산
                    let refresh = playTimeAt - duration;

                    if ((refresh < validate) || (validate === 0)) {
                        validate = refresh;
                    }
                }
            }
        });

        //총 광고 시간이 입력 된 경우에만 연산
        if (fileEnd > 0) {

            //파일 종료 시점이 더 짧을 경우
            if ((fileEnd < validate) || validate === 0) {
                validate = fileEnd;
            }
        }

        //최종 결과 생성
        for (let id in list) {
            list[id].id = id;
            result.kiosks.push(list[id]);
        }

        //성공
        result.counts = length;
        result.validate_seconds = validate;
        res.status(200).json(result);
        res.end();
    }).catch(function(err) {

        //에러
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();
    });
});

//키오스크에서 재생되는 상품을 요청받는 REST
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
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();
    });
});

//키오스크가 현재 재생 정보를 보내는 REST
kiosk.post('/:serial/play', function(req, res) {

    //Transaction 시작
    models.sequelize.transaction(function(t) {
        if (!req.body.fileName) {
            throw null;
        }

        let playAt = moment().format("YYYY-MM-DD HH:mm:ss");
        let kioskSerial = req.params.serial;
        let fileName = req.body.fileName;
        let now = moment().format("YYYY-MM-DD HH:mm:ss");

        //해당 키오스크의 관리자 탐색
        return models.kiosk.findOne({
            where: {
                serial: kioskSerial
            },
            attributes: ['id', 'register'],
            raw: true,
            transaction: t
        }).then(function(kiosk) {
            return models.mediaFile.findOne({
                where: {
                    register: kiosk.register,
                    file_name: fileName
                },
                attributes: ['id'],
                raw: true,
                transaction: t
            }).then(function(file) {

                //등록 되지 않은 파일을 실행 한 경우
                if (!file) {

                    //Pending 상태로 파일을 등록
                    return models.mediaFile.create({
                        register: kiosk.register,
                        file_name: fileName,
                        status: "pending"
                    }).then(function() {

                        //성공
                        res.status(200).json({ msg: "success" });
                        res.end();
                    });
                }

                //키오스크에 현재 실행파일과 실행 시간을 기록
                return models.kiosk.update({
                    last_play_at: playAt,
                    last_play_file_id: file.id
                }, {
                    where: {
                        serial: kioskSerial
                    },
                    transaction: t
                }).then(function(result) {

                    //실행 로그 기록
                    return models.playInfo.create({
                        file_id: file.id,
                        kiosk_id: kiosk.id,
                        play_at: now
                    }, {
                        transaction: t
                    }).then(function(result) {

                        //성공
                        res.status(200).json({ msg: "success" });
                        res.end();
                    });
                });
            });
        }).catch(function(err) {

            //실패시 롤백
            t.rollback();

            //에러 처리
            res.status(411).json({ msg: "Invalid Parameters" });
            res.end();
        });
    });
});

//키오스크 실행 시 받는 REST
kiosk.get('/:serial/initialize', function(req, res) {
    let serial = req.params.serial;
    let adv_req = {
        url: "http://menucloud.co.kr/devices/" + serial + ".json",
        json: true
    }

    request.get(adv_req, function(err, response, body) {
        res.json(body);
    });
});


//인증여부 세션 검사
function ensureAuthentication(req, res, next) {
    models.user.findOne({
        where: {
            token: req.query.idToken
        },
        attributes: ['id'],
        raw: true
    }).then(function(result) {
        if (!result) {

            //사용자 존재하지 않음
            res.status(401).json({ msg: "UnAuthorized" });
            res.end();
        } else {

            //인증된 사용자
            res.locals.user = result.id;
            next();
        }
    }).catch(function(err) {

        //에러
        res.status(500).json({ msg: "error" });
        res.end();
    });
}
