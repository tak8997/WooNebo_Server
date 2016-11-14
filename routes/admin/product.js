'use strict';

var express = require('express');
var product = express.Router();
var moment = require('moment');

var models = require('../../models');
var limit = 5;


module.exports = product;

//관리자가 등록한 상품 리스트 페이지
product.get('/', pagination, function(req, res) {
    var page = req.query.page || 1;

    //관리자가 등록한 상품 검색
    models.product.findAll({
        where: {
            register: req.user.id
        },
        offset: (page - 1) * limit,
        limit: limit,
        raw: true
    }).then(function(products) {
        let result = products.map(function(product) {
            let value = product;

            value.create_at = moment(product.create_at).format('MM/DD HH:mm');
            value.update_at = moment(product.update_at).format('MM/DD HH:mm');
        });

        //성공
        res.render('product/index', { title: '상품 목록', products: products, locals: res.locals, admin: req.user });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

product.post('/', function(req, res) {
    let product = {
        description: req.body.description,
        price: req.body.price,
        product_name: req.body.name,
        url: req.body.url,
        image: req.body.image
    };
    product.register = req.user.id;

    models.product.create(product).then(function() {

        //성공
        res.send('<script>alert("등록 성공"); window.location.assign("/admins/products");</script>');
    }).catch(function(err) {
        console.log(err);
        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//등록 form 페이지
product.get('/new', function(req, res) {
    res.render('product/new', { title: '상품 등록', product: { product_name: "", description: "", price: "", url: "" }, admin: req.user });
});

//상품 상세 정보 페이지
product.get('/:productId', function(req, res) {
    let productId = Number.parseInt(req.params.productId);

    if (!productId) {
        res.redirect('/admins');
    }

    //상품 아이디를 기반으로 검색
    models.product.findOne({
        where: {
            id: productId
        },
        raw: true
    }).then(function(product) {

        console.log(product);

        //성공
        res.render('product/edit', { title: '상품 정보 변경', product: product, admin: req.user  });
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});

//상품 상세 정보 변경 페이지
product.put('/:productId', function(req, res) {
    let product = {
        description: req.body.description,
        price: req.body.price,
        product_name: req.body.name,
        url: req.body.url,
        image: req.body.image
    };
    let productId = req.params.productId;

    //상품 아이디로 검색하여 상세정보 변경
    models.product.update(product, {
        where: {
            id: productId
        }
    }).then(function() {

        //성공
        res.send('<script>alert("변경 성공"); window.location.assign("/admins/products");</script>');
    }).catch(function(err) {

        //실패
        res.status(500).send('<script>alert("error"); history.back();</script>');
    });
});


//페이지네이션
function pagination(req, res, next) {
    let page = parseInt(req.query.page) || 1,
        num = page * limit;

    models.product.count({
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