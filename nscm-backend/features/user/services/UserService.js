const bcrypt = require('bcrypt');
const UserRepo = require('../repository/user.repository');
const RoleRepo = require('../../role/repository/role.repository');
const { httpsCodes } = require('../../../modules/constants');
const { language } = require('../../../language/language');

class UserService {

    static async addUser(data, roleName = null) {
        try {
            const { username, email, password } = data;

            if (!username || !email || !password) {
                return { status: httpsCodes.BAD_REQUEST, message: language.BAD_REQUEST };
            }

            const existingUser = await UserRepo.getByEmail(email) || await UserRepo.getByUsername(username);

            if (existingUser) {
                return { status: httpsCodes.CONFLICT, message: language.USER_ALREADY_EXIST };
            }

            let role = null;
            if (roleName) {
                role = await RoleRepo.getByName(roleName);
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userData = {
                username,
                email,
                password: hashedPassword,
                role: role ? role._id : null,
                profilePic: data.profilePic || '',
                cnic: data.cnic || '',
                address: data.address || '',
                phoneNumber: data.phoneNumber || ''
            };

            const createdUser = await UserRepo.create(userData);

            return { status: httpsCodes.RECORD_CREATED, message: "Created", result: createdUser };

        } catch (error) {
            throw error;
        }

    }

    static async getUserByEmailOrUsername(identifier) {
        const byEmail = await UserRepo.getByEmail(identifier);
        if (byEmail) return byEmail;
        return await UserRepo.getByUsername(identifier);
    }

    static async getAllUsers() {
        const list = await UserRepo.getAll();
        return { status: httpsCodes.SUCCESS_CODE, message: "Record Found", result: list };
    }
}

module.exports = UserService;
