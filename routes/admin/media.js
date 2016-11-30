'use strict';

var express = require('express');
var media = express.Router();
var moment = require('moment');

var models = require('../../models');
var limit = 10;


module.exports = media;

//등록 파일 리스트 페이지
media.get('/', pagination, function(req, res) {
    var page = req.query.page || 1;

    //관리자가 등록한 상품 검색
    models.mediaFile.findAll({
        where: {
            register: req.user.id
        },
        offset: (page - 1) * limit,
        limit: limit,
        raw: true
    }).then(function(result) {

        //결과 매핑
        let files = result.map(function(file) {
            let obj = {
                id: file.id,
                name: file.file_name,
                description: file.description,
                totalPlayTime: file.total_play_time
            }

            if (file.status === "pending") {
                obj.description = "등록 확인이 필요합니다.";
            }

            return obj;
        });

        //성공
        res.render('media/index', { title: '파일 목록', files: files, locals: res.locals, admin: req.user });
    }).catch(function(err) {
        console.log(err);

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//파일 정보 등록 페이지
media.post('/', function(req, res) {
    let post = req.body;

    //파일 정보 저장
    models.mediaFile.create({
        file_name: post.name,
        description: post.description,
        total_play_time: post.total_play_time,
        register: req.user.id,
        status: "accepted"
    }).then(function(file) {
        let configs = [];
        let products = [];
        let playAts = [];

        if (typeof post.product === 'string') {

            //한개의 매핑 정보가 있을 경우
            configs.push({
                file_id: req.params.id,
                product_id: post.product,
                play_time_at: post.playAt
            });
        } else {

            //키값 매핑 후 배열로 생성
            for (let i=0; i < post.product.length; i++) {
                configs.push({
                    file_id: req.params.id,
                    product_id: post.product[i],
                    play_time_at: post.playAt[i]
                });
            };
        }

        //config 리스트 저장
        models.mediaFileConfig.bulkCreate(configs).then(function() {

            //성공
            res.send('<script>alert("등록 성공"); window.location.assign("/admins/medias");</script>');
        });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//새로운 파일 등록 form 페이지
media.get('/new', function(req, res) {

    //해당 관리자가 등록한 상품의 목록 검색
    models.product.findAll({
        where: {
            register: req.user.id
        },
        raw: true
    }).then(function(result) {
        let products = result;

        //페이지 로딩
        res.render('media/new', {
            title: '파일 등록',
            file: { id: 'auto', name: "", description: "" },
            configs: [],
            products: products,
            admin: req.user
        })
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//파일 정보 변경 form 페이지
media.get('/:id', function(req, res) {

    //id를 기반으로 검색
    models.mediaFile.findOne({
        where: {
            id: req.params.id
        },
        raw: true
    }).then(function(result) {

        //key값 매핑
        let file = {
            id: result.id,
            name: result.file_name,
            description: result.description,
            totalPlayTime: result.total_play_time
        };

        //해당 파일의 config정보 검색
        models.mediaFileConfig.findAll({
            where: {
                file_id: file.id
            },

            //join products table
            include: [{
                model: models.product
            }],
            order: 'play_time_at',
            raw: true
        }).then(function(result) {
            let configs = result;

            //해당 관리자가 등록한 상품 목록 검색
            models.product.findAll({
                where: {
                    register: req.user.id
                },
                raw: true
            }).then(function(result) {
                let products = result;

                //성공
                res.render('media/edit', {
                    title: '파일 정보 변경',
                    file: file,
                    configs: configs,
                    products: products,
                    admin: req.user
                });
            });
        });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//파일 정보 변경 REST
media.put('/:id', function(req, res) {
    let post = req.body;

    //파일 정보 변경
    models.mediaFile.update({
        register: req.user.id,
        file_name: post.name,
        description: post.description,
        total_play_time: post.total_play_time,
        status: "accepted"
    }, {
        where: {
            id: req.params.id
        },
        raw: true
    }).then(function(result) {
        if (result[0] !== 1) {
            throw null;
        }

        //해당 파일의 파일-상품 정보 전부 삭제 후 재 등록
        models.mediaFileConfig.destroy({
            where: {
                file_id: req.params.id
            }
        }).then(function() {
            let configs = [];

            if (typeof post.product === 'string') {

                //한개의 매핑 정보가 있을 경우
                configs.push({
                    file_id: req.params.id,
                    product_id: post.product,
                    play_time_at: post.playAt
                });
            } else {

                //키값 매핑 후 배열로 생성
                for (let i=0; i < post.product.length; i++) {
                    configs.push({
                        file_id: req.params.id,
                        product_id: post.product[i],
                        play_time_at: post.playAt[i]
                    });
                };
            }

            //입력 받은 파일-상품 config 저장
            models.mediaFileConfig.bulkCreate(configs).then(function() {

                //성공
                res.send('<script>alert("변경 성공"); window.location.assign("/admins/medias");</script>');
            });
        });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//파일 정보를 지우는 REST
media.delete('/:id', function(req, res) {
    let id = req.params.id;

    //전달 받은 파일이 해당 관리자의 소유인지 확인
    models.mediaFile.count({
        where: {
            id: id,
            register: req.user.id
        }
    }).then(function(result) {

        //자신이 등록한 상품이 아닌 것을 지우려는 접근
        if (result === 0) {
            res.status(401).send('<script>alert("잘못된 접근입니다."); history.back();</script>');
            return;
        }

        //해당 파일의 파일-상품 정보 삭제
        models.mediaFileConfig.destroy({
            where: {
                file_id: id
            }
        }).then(function() {
            models.kiosk.update({
                last_play_file_id: null
            }, {
                where: {
                    last_play_file_id: id
                }
            }).then(function() {
                models.playInfo.destroy({
                    where: {
                        file_id: id
                    }
                }).then(function() {
                    models.mediaFile.destroy({
                        where: {
                            id: id
                        }
                    }).then(function() {
                        res.send('<script>alert("삭제 성공"); window.location.assign("/admins/medias");</script>')
                    }).catch(function(err) {

                        //실패
                        res.status(500).send('<script>alert("error"); history.back();</script>');
                    });
                });
            });
        });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});


//페이지네이션
function pagination(req, res, next) {
    let page = parseInt(req.query.page) || 1,
        num = page * limit;

    models.mediaFile.count({
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
