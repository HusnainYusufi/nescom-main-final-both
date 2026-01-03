const User = require('../model/User.model');

class UserRepository {
    static async create(data) {
        return await User.create(data);
    }

    static async getByEmail(email) {
        return await User.findOne({ email }).exec();
    }

    static async getByUsername(username) {
        return await User.findOne({ username }).exec();
    }

    static async getById(id) {
        return await User.findById(id).exec();
    }

    static async getAll() {
        return await User.find({}).exec();
    }
}

module.exports = UserRepository;
