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

    //ble 파라미터 존재 시
    if (req.query.ble) {
        options = {
            ble: req.query.ble
        }
    }

    //gps 파라미터 존재
    if (req.query.lat && req.query.lng) {

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

    }

    if (Object.keys(options).legnth === 0) {

        //ble 또는 gps 파라미터가 없을 시
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();

        return;
    }

    //전달 받은 파라미터를 바탕으로 kiosk검색
    models.kiosk.findAll({
        where: options,
        attributes: ['id', ['description', 'desc'], 'image'],
        raw: true
    }).then(function(kiosks) {
        let result = { kiosks: [], counts: 0 };

        kiosks.forEach(function(obj) {
            result.kiosks.push(obj);
            result.counts++;
        })

        //성공
        res.status(200).json(result);
        res.end();
    }).catch(function(err) {

        //에러
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();
    });
});

//키오스크에서 재생되는 상품을 요청받는 REST
kiosk.get('/:id/products', function(req, res) {
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
                attributes: ['play_time_at', 'display_time']
            }],
            attributes: ['total_play_time']
        }],
        attributes: ['last_play_at'],
        order: [[models.mediaFile, models.mediaFileConfig, 'play_time_at']],
        raw: true
    }).then(function(products) {
        let result = displayProducts(products);

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

//키오스크(mcBoard) 실행 시 받는 REST
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

//광고 화면에 노출 중인 상품 리스트를 선택하는 함수
function displayProducts(products) {
    let result = { products: [], validate_time: 0 };
    let duration = moment().diff(products[0].last_play_at, 'seconds');
    let total = Number.parseInt(products[0]['mediaFile.total_play_time']);
    let validate = total - duration;
    let candidate = { playAt: 0, product: {} };

    //키오스크에서 어떠한 파일도 실행하지 않았을 경우
    if (products[0].last_play_at === null) {
        return result;
    }

    //키오스크와 동기화 되어 있지 않음
    if (validate < 0) {
        if (total !== 0) {
            return result;
        } else {
            validate = total;
        }
    }

    //노출중인 상품 선택
    products.map(function(obj) {
        let playAt = Number.parseInt(obj['mediaFile.mediaFileConfigs.play_time_at']);
        let displayTime = Number.parseInt(obj['mediaFile.mediaFileConfigs.display_time']);

        //현재 노출중일 지도 모르는 상품
        if (duration >= playAt) {

            //현재 노출중인 상품
            if (duration < playAt + displayTime) {
                let product = {
                    id: obj['mediaFile.mediaFileConfigs.product.id'],
                    name: obj['mediaFile.mediaFileConfigs.product.name'],
                    desc: obj['mediaFile.mediaFileConfigs.product.description'],
                    image: obj['mediaFile.mediaFileConfigs.product.image']
                }

                result.products.push(product);
            } else {

                //이미 노출이 끝난 상품
                if (candidate.playAt < playAt || playAt === 0) {

                    //타임라인이 비어있는 경우를 대비한 후보 상품
                    let product = {
                        id: obj['mediaFile.mediaFileConfigs.product.id'],
                        name: obj['mediaFile.mediaFileConfigs.product.name'],
                        desc: obj['mediaFile.mediaFileConfigs.product.description'],
                        image: obj['mediaFile.mediaFileConfigs.product.image']
                    }

                    candidate.playAt = playAt;
                    candidate.product = product;
                }
            }
        } else {

            //아직 노출되지 않은 상품
            if (validate > playAt - duration) {
                validate = playAt - duration;
            }
        }
    });

    //타임라인이 비어있는 경우 후보상품을 전달
    if (result.products.length === 0) {
        result.products.push(candidate.product);
    } else {
        if (validate === 0) {
            validate = 1;
        }
    }

    result.validate_time = validate;

    return result;
}
