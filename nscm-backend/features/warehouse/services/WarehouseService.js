const WarehouseRepo = require('../repository/warehouse.repository')

class WarehouseService {
  static async getAll() {
    const list = await WarehouseRepo.getAll()
    return { status: 200, message: 'Record Found', result: list }
  }

  static async add(data) {
    if (!data?.name) {
      return { status: 400, message: 'Name is required', result: null }
    }
    const created = await WarehouseRepo.create(data)
    return { status: 200, message: 'Created', result: created }
  }
}

module.exports = WarehouseService


