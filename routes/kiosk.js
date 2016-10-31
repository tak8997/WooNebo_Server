var express = require('express');
var kiosk = express();
var moment = require('moment');
var distance = require('gps-distance');
var db = require('../mysql');


module.exports = kiosk;

//현재 위치나 BLE를 기반으로 하여 키오스크의 정보를 요청받는 REST
kiosk.get('/', function(req, res) {
    var lat = req.query.lat;
    var lng = req.query.lng;
    var maxDistance = 10;
    var result = {};
    var sql = "select id, description, lat, lng from kiosks";

    db.query(sql, function (err, rows, fields) {
        if (err) {
            res.writeHead(500);
            res.end();
        };

        result.counts = rows.length;

        result.kiosks = [];

        for (i=0; i<rows.length; i++) {
            if (distance(rows[i].lat, rows[i].lng, lat, lng) <= maxDistance) {
                //To Do
            }

            result.kiosks[i] = {
                id: rows[i].id,
                desc: rows[i].description
            };
        }

        res.status(200).json(result);
        res.end();
    });
});

//키오스크에서 재생되는 상품의 상세 정보를 요청받는 REST
kiosk.get('/:id/products', function(req, res) {
    req.checkParams('id', 'Invalid kiosk id').isInt();

    var errors = req.validationErrors();

    if (errors) {
        res.status(411).json(errors);
        res.end();

        return false;
    }

    var kioskId = Number.parseInt(req.params.id);
    var currentTime = Date.now();
    var sql = "select p.id, p.product_name, p.description, p.price, p.url, k.last_play_at, m.play_time_at "
            + "from kiosks k, products p, media_file_configs m "
            + "where m.product_id = p.id "
            + "and m.file_id = k.last_play_file_id "
            + "and k.id = ? ";

    db.query(sql, kioskId, function(err, rows) {
        var period, index;
        var now = moment(Date.now());

        if (rows.length === 0) {
            res.writeHead(411, "Invalid Parameters");
            res.end();

            return;
        }

        if (err) throw err;

        //마지막 재생 시간부터 요청 시간 까지의 차이를 계산
        lastPlayTime = moment(rows[0].last_play_at, moment.ISO_8601);
        period = Math.round(moment.duration(now.diff(lastPlayTime)).asSeconds());

        //시간 차이와 삼품의 미디어 실행 시간을 비교하여 현재 재생되는 상품을 탐색
        for (i=0; i<rows.length; i++) {
            if (period > rows[i].play_time_at) {
                index = i;
            }
        }

        //결과를 json객체로 생성
        var result = {};
        result.id = rows[index].id;
        result.product_name = rows[index].product_name;
        result.description = rows[index].description;
        result.price = rows[index].price;
        result.url = rows[index].url;

        res.status(200).json(result);
        res.end();
    });
});

//키오스크가 현재 재생 정보를 보내는 REST
kiosk.post('/:id/play', function(req, res) {
    req.checkParams('id', 'Invalid kiosk id').isInt();
    req.checkBody('fileName', 'Invalid fileName').notEmpty().isString();
    // req.checkBody('playAt', 'Invalid datetime (playAt)').

    var errors = req.validationErrors();
    if (errors) {
        res.send("Parameter Validation error: " + utils.inspect(errors), 411);
        res.end();
    }

    var kioskId = req.params.id;
    var fileName = req.body.fileName;
    var playAt = req.body.playAt;
    var now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    var updateSql = "update kiosks "
                    + "set update_at = ?, last_play_at = ?, last_play_file_id = (select id from media_files where file_name = ?)"
                    + "where id = ? ";

    var insertSql = "insert into play_infos(file_id, kiosk_id, play_at) "
                    + "values((select id from media_files where file_name = ?), ?, ?)";

    //Tracsaction 으로 진행
    db.beginTransaction(function(err) {
        if (err) throw err;

        //play_infos 테이블에 기록
        db.query(insertSql, [fileName, kioskId, playAt], function(err, results) {
            if (err) {
                return db.rollback(function() {
                    res.writeHead(411);
                    res.end();
                });
            }

            //kiosks 테이블에 현재 재생 파일과 시작 시간 변경
            db.query(updateSql, [now, playAt, fileName, kioskId], function(err, results) {
                if (err) {
                    return db.rollback(function() {
                        res.writeHead(411);
                        res.end();
                    });
                }

                //커밋
                db.commit(function(err) {
                    if (err) {
                        return db.rollback(function() {
                            throw err;
                        });
                    }

                    res.writeHead(200);
                    res.end();
                });
            });
        });
    });
});
