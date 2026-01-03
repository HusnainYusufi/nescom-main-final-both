const QualificationTestRepo = require('../repository/qualificationTest.repository')

class QualificationTestService {
  static async addTest(data) {
    try {
      if (!data?.project || !data?.part) {
        return { status: 400, message: 'Project and Part are required', result: null }
      }
      if (!data?.title) {
        return { status: 400, message: 'Title is required', result: null }
      }
      const test = await QualificationTestRepo.create(data)
      return { status: 200, message: 'Created', result: test }
    } catch (error) {
      throw error
    }
  }

  static async getAllTests(filters) {
    try {
      const query = {}
      if (filters?.project) query.project = filters.project
      if (filters?.part) query.part = filters.part
      if (filters?.status) query.status = filters.status
      const tests = await QualificationTestRepo.getAll(query)
      return { status: 200, message: 'Record Found', result: tests }
    } catch (error) {
      throw error
    }
  }
}

module.exports = QualificationTestService

