const StructureRepo = require('../repository/structure.repository');

class StructureService {
  static async addStructure(data) {
    try {
      const structure = await StructureRepo.create(data);
      return { status: 200, message: 'Created', result: structure };
    } catch (error) {
      throw error;
    }
  }

  static async getAllStructures() {
    try {
      const structures = await StructureRepo.getAll();
      return { status: 200, message: 'Record Found', result: structures };
    } catch (error) {
      throw error;
    }
  }

  static async findStructuresByIds(ids) {
    try {
      return await StructureRepo.findByIds(ids);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StructureService;
