const IssueRepo = require('../repository/issue.repository')

class IssueService {
  static async addIssue(data) {
    if (!data?.project) return { status: 400, message: 'Project is required', result: null }
    if (!data?.title) return { status: 400, message: 'Title is required', result: null }
    const issue = await IssueRepo.create(data)
    return { status: 200, message: 'Created', result: issue }
  }

  static async updateIssue(id, data) {
    if (!id) return { status: 400, message: 'Issue id is required', result: null }
    const updated = await IssueRepo.update(id, data)
    if (!updated) return { status: 404, message: 'Issue not found', result: null }
    return { status: 200, message: 'Updated', result: updated }
  }

  static async getAllIssues(filters) {
    const query = {}
    if (filters?.project) query.project = filters.project
    if (filters?.status) query.status = filters.status
    if (filters?.severity) query.severity = filters.severity
    const issues = await IssueRepo.getAll(query)
    return { status: 200, message: 'Record Found', result: issues }
  }
}

module.exports = IssueService

