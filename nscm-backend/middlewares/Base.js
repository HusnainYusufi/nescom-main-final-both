"use strict";

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { httpsCodes } = require('../modules/constants');
const { language } = require('../language/language');
const { unless } = require('express-unless');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');
require('dotenv').config();

class Base {
    constructor() { }

    static async init(app) {
        app.use(bodyParser.json({ limit: '100mb' }));
        app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }));
        app.use(cookieParser());


        const toNumber = (value, fallback) => {
            const parsed = parseInt(value, 10);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        const createLimiter = ({ windowMs, max, message }) => rateLimit({
            windowMs,
            max,
            message,
            standardHeaders: true,
            legacyHeaders: false
        });

        const defaultWindowMs = toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000);
        const defaultMax = toNumber(process.env.RATE_LIMIT_MAX, 20);

        const loginLimiter = createLimiter({
            windowMs: toNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_WINDOW_MS, defaultWindowMs),
            max: toNumber(process.env.LOGIN_RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX, 10),
            message: 'Too many login attempts, please try again shortly.'
        });

        const registerLimiter = createLimiter({
            windowMs: toNumber(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_WINDOW_MS, defaultWindowMs),
            max: toNumber(process.env.REGISTER_RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX, 10),
            message: 'Too many registration attempts, please try again shortly.'
        });

        const otpLimiter = createLimiter({
            windowMs: toNumber(process.env.OTP_RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_WINDOW_MS, defaultWindowMs),
            max: toNumber(process.env.OTP_RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX, 10),
            message: 'Too many OTP requests, please try again shortly.'
        });

        const publicLimiter = createLimiter({
            windowMs: defaultWindowMs,
            max: defaultMax,
            message: 'Too many requests, please slow down.'
        });

        app.use('/api/auth/login', loginLimiter);
        app.use('/api/auth/register', registerLimiter);
        app.use('/api/auth/signup', registerLimiter);
        app.use('/api/auth/signup/admin', registerLimiter);
        app.use('/api/auth/verify/otp', otpLimiter);
        app.use(['/api/auth/accept-invite', '/api/auth/reset-password', '/api/auth/forgotPassword', '/api/auth/verifyToken'], publicLimiter);


        await connectDB();

        Base.authenticate.unless = unless;


        app.use(Base.authenticate.unless({
            path: [
                { url: "/api/auth/login", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/register", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/signup", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/signup/admin", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/verify/otp", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/accept-invite", methods: ['GET', 'POST'] },
                { url: "/api/warehouse/add", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/reset-password", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/forgotPassword", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/verifyToken", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/auth/verifyToken", methods: ['GET', 'PUT', 'POST'] },
                { url: /^\/api\/orders\/[^/]+\/status-overview$/, methods: ['GET'] },
                { url: /^\/api\/orders\/[^/]+\/customer-tracking$/, methods: ['GET'] },
                { url: "/api/role/all", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/role/add", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/user/add", methods: ['GET', 'PUT', 'POST'] },
                { url: "/api/user/add/password", methods: ['GET', 'PUT', 'POST'] },
                { url: new RegExp('^/api/getFiles/.*'), methods: ['GET', 'PUT', 'POST'] },
                // ------------- PUBLIC TRACKING -------------
                // main query-style endpoint: GET /api/tracking?ref=...
                { url: /^\/api\/tracking$/, methods: ['GET', 'OPTIONS'] },
                // SEO/path-style endpoint: GET /api/tracking/{ref}
                { url: /^\/api\/tracking\/[^/]+$/, methods: ['GET', 'OPTIONS'] },



            ]
        }));

        app.use((req, res, next) => {

            res.header('Access-Control-Allow-Origin', '*');

            // Allow specific headers
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

            // Allow specific HTTP methods
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');


            if (req.method === 'OPTIONS') {
                return res.status(200).end(); // Respond OK to preflight request
            }


            next();
        });


        app.listen(process.env.PORT, () => {
            console.log('Server running on port', process.env.PORT);
        });

        app.get('/', async (req, res) => {
            return res.json("Welcome to ganna healing");
        });
    }

    static async authenticate(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token == null) {
                return res.status(httpsCodes.UNAUTHORIZE_CODE).json({ message: language.INVALID_AUTH_TOKEN });
            }

            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
                if (err) {
                    return res.status(httpsCodes.UNAUTHORIZE_CODE).json({ message: language.INVALID_AUTH_TOKEN });
                }
                req.user = user;
                next(); // Only call next() if no error occurs
            });
        } catch (error) {
            console.log(error);
            return res.status(httpsCodes.INTERNAL_SERVER_ERROR).json({ message: language.SERVER_ERROR });
        }
    }
}

module.exports = {
    Base
};
