'use strict';

import express from 'express';
import moment from 'moment';
import models from '../models';
var product = express.Router();


module.exports = product;

//상품 상세 정보를 전달하는 REST
product.get('/:id', ensureAuthentication, (req, res)=>{
    let id = req.params.id;

    models.product.findOne({
        where: {
            id: id
        },
        attributes: ['id', ['description', 'desc'], ['product_name', 'name'], 'image', 'url', 'price'],
        raw: true
    }).then((result)=>{

        models.searchLog.create({ user_id: res.locals.user, product_id: result.id, search_at: moment().format('YYYY-MM-DD HH:mm:ss') });

        res.status(200).json(result);
        res.end();

    }).catch((err)=>{
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();
    });
});

//facebook의 좋아요 버튼과 동일한 기능 REST
product.post('/:id/star', ensureAuthentication, (req, res)=>{
    let id = req.params.id;

    models.popularity.create({
        user_id: res.locals.user,
        product_id: id
    }).then(()=>{
        res.status(200).json({ msg: "Success" });
        res.end();
    }).catch((err)=>{
        res.status(411).json({ msg: "Invalid Parameters" });
        res.end();
    });
});


//인증여부 세션 검사
function ensureAuthentication(req, res, next) {
    let token;

    if (req.method === "GET") {
        token = req.query.idToken;
    } else {
        token = req.body.idToken;
    }

    models.user.findOne({
        where: {
            token: token
        },
        attributes: ['id'],
        raw: true
    }).then((result)=>{
        if (!result) {

            //사용자 존재하지 않음
            res.status(401).json({ msg: "UnAuthorized" });
            res.end();
        } else {

            //인증된 사용자
            res.locals.user = result.id;
            next();
        }
    }).catch((err)=>{

        //에러
        res.status(500).json({ msg: "error" });
        res.end();
    });
}
