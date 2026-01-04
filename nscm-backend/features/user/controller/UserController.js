const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const logger = require('../../../modules/logger');


router.post('/add', async (req, res, next) => {
    try {
        const result = await UserService.addUser(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in UserController - Add User:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

router.post('/bulk-add', async (req, res, next) => {
    try {
        const users = Array.isArray(req.body) ? req.body : req.body?.users;
        const result = await UserService.addUsersBulk(users);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in UserController - Bulk Add Users:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

router.get('/all', async (req, res, next) => {
    try {
        const result = await UserService.getAllUsers();
        const status = result?.status || 200;
        return res.status(status).json(result);
    } catch (error) {
        logger.error('Error in UserController - Get All Users:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

module.exports = router;
