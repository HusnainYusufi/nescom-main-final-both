const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const logger = require('../../../modules/logger');


router.post('/signup', async (req, res, next) => {
    try {
        const result = await AuthService.signup(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in AuthController - Signup:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

router.post('/signup/admin', async (req, res, next) => {
    try {
        const result = await AuthService.signupAdmin(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in AuthController - Signup Admin:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const result = await AuthService.login(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in AuthController - Login:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

module.exports = router;
