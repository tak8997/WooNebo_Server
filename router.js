import express from 'express';
import kiosk from './routes/kiosk';
import product from './routes/product';
import admin from './routes/admin';
import user from './routes/user';
import upload from './config/upload';
import image from './config/image';

var router = express.Router();


module.exports = router;

router.use('/kiosks', kiosk);
router.use('/admins', admin);
router.use('/products', product);
router.use('/users', user);
router.use('/uploads', upload);
router.use('/images', image);
