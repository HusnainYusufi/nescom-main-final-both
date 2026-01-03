const IssueRepo = require('../repository/issue.repository')

class IssueService {
  static async addIssue(data) {
    if (!data?.project) return { status: 400, message: 'Project is required', result: null }
    if (!data?.title) return { status: 400, message: 'Title is required', result: null }
    if (!data?.set && !data?.structure && !data?.assembly && !data?.part) {
      return {
        status: 400,
        message: 'Select a set, structure, assembly, or part for this issue',
        result: null,
      }
    }
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
    const enriched = issues.map((issue) => {
      const payload = issue.toObject()
      let setName = null
      if (payload.set && payload.project?.sets?.length) {
        const match = payload.project.sets.find(
          (set) => String(set._id) === String(payload.set),
        )
        setName = match?.name || null
      }
      return {
        ...payload,
        setName,
        structureName: payload.structure?.name || null,
        assemblyName: payload.assembly?.name || null,
        partName: payload.part?.name || null,
      }
    })
    return { status: 200, message: 'Record Found', result: enriched }
  }
}

module.exports = IssueService
