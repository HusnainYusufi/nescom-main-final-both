const AssemblyRepo = require('../repository/assembly.repository');

class AssemblyService {
  static async addAssembly(data) {
    try {
      const { type, parentAssembly } = data;

      if (type === 'sub-assembly') {
        if (!parentAssembly) {
          return { status: 400, message: 'Parent assembly is required for a sub-assembly', result: null };
        }

        const parent = await AssemblyRepo.findById(parentAssembly);
        if (!parent) {
          return { status: 400, message: 'Parent assembly not found', result: null };
        }

        if (parent.type === 'sub-assembly') {
          return { status: 400, message: 'Sub-assemblies cannot be nested under another sub-assembly', result: null };
        }
      } else if (parentAssembly) {
        return { status: 400, message: 'Parent assembly is only applicable for sub-assemblies', result: null };
      }

      const assembly = await AssemblyRepo.create(data);
      return { status: 200, message: 'Created', result: assembly };
    } catch (error) {
      throw error;
    }
  }

  static async getAllAssemblies() {
    try {
      const assemblies = await AssemblyRepo.getAll();
      return { status: 200, message: 'Record Found', result: assemblies };
    } catch (error) {
      throw error;
    }
  }

  static async getAssemblyById(id) {
    try {
      if (!id) {
        return { status: 400, message: 'Assembly ID is required', result: null };
      }
      const assembly = await AssemblyRepo.findById(id);
      if (!assembly) {
        return { status: 404, message: 'Assembly not found', result: null };
      }
      return { status: 200, message: 'Record Found', result: assembly };
    } catch (error) {
      throw error;
    }
  }

  static async updateAssembly(id, data) {
    try {
      if (!id) {
        return { status: 400, message: 'Assembly ID is required', result: null };
      }
      const updated = await AssemblyRepo.updateById(id, data);
      if (!updated) {
        return { status: 404, message: 'Assembly not found', result: null };
      }
      return { status: 200, message: 'Updated', result: updated };
    } catch (error) {
      throw error;
    }
  }

  static async deleteAssembly(id) {
    try {
      if (!id) {
        return { status: 400, message: 'Assembly ID is required', result: null };
      }
      const deleted = await AssemblyRepo.deleteById(id);
      if (!deleted) {
        return { status: 404, message: 'Assembly not found', result: null };
      }
      return { status: 200, message: 'Deleted', result: deleted };
    } catch (error) {
      throw error;
    }
  }

  static async findAssembliesByIds(ids) {
    try {
      return await AssemblyRepo.findByIds(ids);
    } catch (error) {
      throw error;
    }
  }

  static async addQcReport(assemblyId, qcReport) {
    try {
      if (!qcReport?.title) {
        return { status: 400, message: 'Title is required', result: null };
      }
      const updated = await AssemblyRepo.addQcReport(assemblyId, qcReport);
      if (!updated) {
        return { status: 404, message: 'Assembly not found', result: null };
      }
      return { status: 200, message: 'Created', result: updated };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AssemblyService;
