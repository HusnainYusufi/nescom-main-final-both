const bcrypt = require('bcrypt');
const UserRepo = require('../repository/user.repository');
const RoleRepo = require('../../role/repository/role.repository');
const { httpsCodes } = require('../../../modules/constants');
const { language } = require('../../../language/language');

class UserService {

    static normalizeUserInput(data = {}, defaultRoleName = null) {
        const username = (data.username || data.name || '').trim();
        const email = (data.email || '').trim().toLowerCase();
        const password = data.password || '';
        const roleName = defaultRoleName || data.roleName || data.role || null;
        const phoneNumber = data.phoneNumber || data.phone || '';

        return {
            username,
            email,
            password,
            roleName,
            profilePic: data.profilePic || '',
            cnic: data.cnic || '',
            address: data.address || '',
            phoneNumber
        };
    }

    static async resolveRole(roleName) {
        if (!roleName) return null;
        return await RoleRepo.getByName(roleName);
    }

    static async addUser(data, roleName = null) {
        try {
            const normalized = UserService.normalizeUserInput(data, roleName);
            const { username, email, password } = normalized;

            if (!username || !email || !password) {
                return { status: httpsCodes.BAD_REQUEST, message: language.BAD_REQUEST };
            }

            const existingUser = await UserRepo.getByEmail(email) || await UserRepo.getByUsername(username);

            if (existingUser) {
                return { status: httpsCodes.CONFLICT, message: language.USER_ALREADY_EXIST };
            }

            const role = await UserService.resolveRole(normalized.roleName);
            if (normalized.roleName && !role) {
                return { status: httpsCodes.UNPROCESSED_REQUEST, message: 'Invalid role' };
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userData = {
                username,
                email,
                password: hashedPassword,
                role: role ? role._id : null,
                profilePic: normalized.profilePic,
                cnic: normalized.cnic,
                address: normalized.address,
                phoneNumber: normalized.phoneNumber
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

    static async addUsersBulk(users = [], roleName = null) {
        const payload = Array.isArray(users) ? users : [];
        if (!payload.length) {
            return { status: httpsCodes.BAD_REQUEST, message: language.BAD_REQUEST };
        }

        const seenEmails = new Set();
        const seenUsernames = new Set();
        const created = [];
        const failed = [];

        for (const [index, rawUser] of payload.entries()) {
            const normalized = UserService.normalizeUserInput(rawUser, roleName);
            const { username, email, password } = normalized;

            if (!username || !email || !password) {
                failed.push({
                    index,
                    email: email || null,
                    username: username || null,
                    reason: language.BAD_REQUEST
                });
                continue;
            }

            const emailKey = email.toLowerCase();
            const usernameKey = username.toLowerCase();

            if (seenEmails.has(emailKey) || seenUsernames.has(usernameKey)) {
                failed.push({
                    index,
                    email,
                    username,
                    reason: 'Duplicate user in request payload'
                });
                continue;
            }

            seenEmails.add(emailKey);
            seenUsernames.add(usernameKey);

            const existingUser = await UserRepo.getByEmail(email) || await UserRepo.getByUsername(username);
            if (existingUser) {
                failed.push({
                    index,
                    email,
                    username,
                    reason: language.USER_ALREADY_EXIST
                });
                continue;
            }

            const role = await UserService.resolveRole(normalized.roleName);
            if (normalized.roleName && !role) {
                failed.push({
                    index,
                    email,
                    username,
                    reason: 'Invalid role'
                });
                continue;
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userData = {
                username,
                email,
                password: hashedPassword,
                role: role ? role._id : null,
                profilePic: normalized.profilePic,
                cnic: normalized.cnic,
                address: normalized.address,
                phoneNumber: normalized.phoneNumber
            };

            const createdUser = await UserRepo.create(userData);
            created.push(createdUser);
        }

        const status = failed.length
            ? (created.length ? httpsCodes.UNPROCESSED_REQUEST : httpsCodes.BAD_REQUEST)
            : httpsCodes.RECORD_CREATED;

        return {
            status,
            message: failed.length ? 'Some users could not be created' : 'Created',
            result: {
                created,
                failed
            }
        };
    }
}

module.exports = UserService;
