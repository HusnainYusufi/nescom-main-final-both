const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserService = require('../../user/services/UserService');
const { httpsCodes } = require('../../../modules/constants');
const { language } = require('../../../language/language');

class AuthService {

    static async signup(data, roleName = 'user') {
        return await UserService.addUser(data, roleName);
    }

    static async signupAdmin(data) {
        return await this.signup(data, 'admin');
    }

    static async login(data) {
        try {
            const { identifier, password } = data;

            if (!identifier || !password) {
                return { status: httpsCodes.BAD_REQUEST, message: language.BAD_REQUEST };
            }

            const user = await UserService.getUserByEmailOrUsername(identifier);

            if (!user) {
                return { status: httpsCodes.NOT_FOUND, message: language.NOT_FOUND };
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return { status: httpsCodes.UNAUTHORIZE_CODE, message: language.INVALID_CREDENTIALS };
            }

            const tokenPayload = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || null
            };

            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

            return {
                status: httpsCodes.SUCCESS_CODE,
                message: 'Login Successful',
                result: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        profilePic: user.profilePic,
                        cnic: user.cnic,
                        address: user.address,
                        phoneNumber: user.phoneNumber
                    }
                }
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = AuthService;
