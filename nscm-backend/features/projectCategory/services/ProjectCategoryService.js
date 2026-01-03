const ProjectCategoryRepo = require('../repository/projectCategory.repository');

class ProjectCategoryService {
  static async addCategory(data) {
    try {
      const category = await ProjectCategoryRepo.create(data);
      return { status: 200, message: 'Created', result: category };
    } catch (error) {
      throw error;
    }
  }

  static async getAllCategories() {
    try {
      const categories = await ProjectCategoryRepo.getAll();
      return { status: 200, message: 'Record Found', result: categories };
    } catch (error) {
      throw error;
    }
  }

  static async getCategoryById(id) {
    try {
      return await ProjectCategoryRepo.getById(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProjectCategoryService;
