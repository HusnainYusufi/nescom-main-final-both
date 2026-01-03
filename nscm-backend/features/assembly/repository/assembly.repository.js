const Assembly = require('../model/Assembly.model');

class AssemblyRepository {
  static async create(data) {
    return await Assembly.create(data);
  }

  static async findById(id) {
    return await Assembly.findById(id).exec();
  }

  static async findByIds(ids) {
    return await Assembly.find({ _id: { $in: ids } }).exec();
  }

  static async getAll() {
    return await Assembly.find({}).populate('parentAssembly').exec();
  }

  static async addQcReport(id, qcReport) {
    return await Assembly.findByIdAndUpdate(
      id,
      { $push: { qcReports: qcReport } },
      { new: true }
    ).exec();
  }
}

module.exports = AssemblyRepository;
