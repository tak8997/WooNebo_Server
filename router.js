var express = require('express');
var kiosk = require('./routes/kiosk');
var admin = require('./routes/admin');
var user = require('./routes/user');
var upload = require('./config/upload');
var image = require('./config/image');
var router = express.Router();


module.exports = router;

router.use('/kiosks', kiosk);
router.use('/admins', admin);
router.use('/users', user);
router.use('/uploads', upload);
router.use('/images', image);
