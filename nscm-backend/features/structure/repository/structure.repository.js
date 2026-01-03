const Structure = require('../model/Structure.model');

class StructureRepository {
  static async create(data) {
    return await Structure.create(data);
  }

  static async findByIds(ids) {
    return await Structure.find({ _id: { $in: ids } }).exec();
  }

  static async getAll() {
    return await Structure.find({}).exec();
  }
}

module.exports = StructureRepository;
