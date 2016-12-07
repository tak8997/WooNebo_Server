'use strict';

var express = require('express');
var product = express.Router();
var moment = require('moment');

var models = require('../models');


module.exports = product;

product.get('/:id', ensureAuthentication, function(req, res) {
    let id = req.params.id;

    models.product.findOne({
        where: {
            id: id
        },
        attributes: ['id', ['description', 'desc'], ['product_name', 'name'], 'image', 'url', 'price'],
        raw: true
    }).then(function(result) {

        models.searchLog.create({ user_id: res.locals.user, product_id: result.id, search_at: moment().format('YYYY-MM-DD HH:mm:ss') });

        res.status(200).json(result);
        res.end();

    }).catch(function(err) {
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();
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
