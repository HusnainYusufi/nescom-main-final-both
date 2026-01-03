const ProjectRepo = require('../repository/project.repository');
const ProjectCategoryService = require('../../projectCategory/services/ProjectCategoryService');
const AssemblyService = require('../../assembly/services/AssemblyService');
const StructureService = require('../../structure/services/StructureService');

class ProjectService {
  static async addProject(data) {
    try {
      const { code, category, sets = [], structures = [] } = data;

      const existingProject = await ProjectRepo.getByCode(code);
      if (existingProject) {
        return { status: 400, message: 'Project code already exists', result: null };
      }

      const categoryRecord = await ProjectCategoryService.getCategoryById(category);
      if (!categoryRecord) {
        return { status: 400, message: 'Invalid project category', result: null };
      }

      let assembliesToValidate = [];
      sets.forEach((set) => {
        if (Array.isArray(set.assemblies)) {
          assembliesToValidate = assembliesToValidate.concat(set.assemblies);
        }
      });

      if (assembliesToValidate.length) {
        const uniqueAssemblyIds = [...new Set(assembliesToValidate.map(String))];
        const foundAssemblies = await AssemblyService.findAssembliesByIds(uniqueAssemblyIds);
        if (foundAssemblies.length !== uniqueAssemblyIds.length) {
          return { status: 400, message: 'One or more assemblies are invalid', result: null };
        }

        const assembliesMap = new Map(foundAssemblies.map((assembly) => [String(assembly._id), assembly]));
        for (const set of sets) {
          if (!Array.isArray(set.assemblies) || !set.assemblies.length) continue;

          const setAssembliesAsStrings = set.assemblies.map(String);
          for (const assemblyId of setAssembliesAsStrings) {
            const assembly = assembliesMap.get(assemblyId);

            if (assembly?.type === 'sub-assembly') {
              const parentAssemblyId = assembly.parentAssembly ? String(assembly.parentAssembly) : null;
              if (!parentAssemblyId || !setAssembliesAsStrings.includes(parentAssemblyId)) {
                return {
                  status: 400,
                  message: `Sub-assembly "${assembly.name}" must reference a valid parent assembly within the same set`,
                  result: null
                };
              }
            }
          }
        }
      }

      // Validate structures at either top-level or within sets (new preferred location)
      let structuresToValidate = Array.isArray(structures) ? [...structures] : [];
      sets.forEach((set) => {
        if (Array.isArray(set.structures)) {
          structuresToValidate = structuresToValidate.concat(set.structures);
        }
      });

      if (structuresToValidate.length) {
        const uniqueStructureIds = [...new Set(structuresToValidate.map(String))];
        const foundStructures = await StructureService.findStructuresByIds(uniqueStructureIds);
        if (foundStructures.length !== uniqueStructureIds.length) {
          return { status: 400, message: 'One or more structures are invalid', result: null };
        }
      }

      const project = await ProjectRepo.create(data);
      return { status: 200, message: 'Created', result: project };
    } catch (error) {
      throw error;
    }
  }

  static async getAllProjects() {
    try {
      const projects = await ProjectRepo.getAll();
      return { status: 200, message: 'Record Found', result: projects };
    } catch (error) {
      throw error;
    }
  }

  static async updateProjectStatus(id, status) {
    try {
      if (!status) {
        return { status: 400, message: 'Status is required', result: null };
      }
      const updated = await ProjectRepo.updateById(id, { status });
      if (!updated) {
        return { status: 404, message: 'Project not found', result: null };
      }
      return { status: 200, message: 'Updated', result: updated };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProjectService;
