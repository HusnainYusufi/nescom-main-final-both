const Role = require('../model/Role.model');

class RoleRepository {
    static async create(data) {
        return await Role.create(data);
    }

    static async getByName(name) {
        return await Role.findOne({ name }).exec();
    }

    static async getAll() {
        return await Role.find({}).exec();
    }
}

module.exports = RoleRepository;
