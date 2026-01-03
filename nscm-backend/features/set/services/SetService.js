const SetRepo = require('../repository/set.repository')

class SetService {
  static async addSet(data) {
    if (!data?.project) return { status: 400, message: 'Project is required', result: null }
    if (!data?.name) return { status: 400, message: 'Name is required', result: null }
    const set = await SetRepo.create(data)
    return { status: 200, message: 'Created', result: set }
  }

  static async updateSet(id, data) {
    if (!id) return { status: 400, message: 'Set id is required', result: null }
    const updated = await SetRepo.update(id, data)
    if (!updated) return { status: 404, message: 'Set not found', result: null }
    return { status: 200, message: 'Updated', result: updated }
  }

  static async getAllSets(filters) {
    const query = {}
    if (filters?.project) query.project = filters.project
    const sets = await SetRepo.getAll(query)
    return { status: 200, message: 'Record Found', result: sets }
  }
}

module.exports = SetService

