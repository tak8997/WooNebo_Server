'use strict';

import express from 'express';
import sha256 from 'sha256';
import firebase from 'firebase-admin';
import moment from 'moment';
import models from '../models';
var user = express.Router();


module.exports = user;

//firebase 초기화 작업
firebase.initializeApp({
    credential: firebase.credential.cert("./config/serviceAccountKey.json"),
    databaseURL: "https://woonebo-android.firebaseio.com"
});

//firebase token auth
user.post('/auth', (req, res)=>{
    let idToken = req.body.idToken;

    //Firebase에 저장된 데이터를 idToken을 이용하여 로드
    firebase.auth().verifyIdToken(idToken).then((decodedToken)=>{
        let user = {
            email: decodedToken.user_id,
            name: decodedToken.name
        }

        //로드한 데이터를 이용하여 유저 생성 or 탐색
        models.user.findOrCreate({
            where: user,
            raw: true
        }).then((result)=>{
            models.user.update({
                token: idToken,
                last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    id: result[0].id
                }
            }).then((result)=>{

                //성공
                res.status(200).json({ msg: "success" });
                res.end();
            });
        });
    }).catch((err)=>{

        //실패
        res.status(401).json({ msg: "UnAuthorized" });
        res.end();
    });
});
