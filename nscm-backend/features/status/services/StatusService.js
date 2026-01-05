const StatusRepo = require('../repository/status.repository')

class StatusService {
  static async addStatus(data) {
    if (!data?.project) return { status: 400, message: 'Project is required', result: null }
    if (!data?.set) return { status: 400, message: 'Set is required', result: null }
    if (!data?.assembly) return { status: 400, message: 'Assembly is required', result: null }
    if (!data?.part) return { status: 400, message: 'Part is required', result: null }
    const created = await StatusRepo.create(data)
    return { status: 200, message: 'Created', result: created }
  }

  static async updateStatus(id, data) {
    if (!id) return { status: 400, message: 'Status id is required', result: null }
    const updated = await StatusRepo.update(id, data)
    if (!updated) return { status: 404, message: 'Status entry not found', result: null }
    return { status: 200, message: 'Updated', result: updated }
  }

  static async getAllStatuses(filters) {
    const query = {}
    if (filters?.project) query.project = filters.project
    if (filters?.set) query.set = filters.set
    if (filters?.assembly) query.assembly = filters.assembly
    if (filters?.part) query.part = filters.part
    if (filters?.status) query.status = filters.status
    const results = await StatusRepo.getAll(query)
    return { status: 200, message: 'Record Found', result: results }
  }
}

module.exports = StatusService
