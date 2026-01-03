const WarehouseModel = require('../model/Warehouse.model')

class WarehouseRepository {
  static async getAll() {
    return WarehouseModel.find().sort({ createdAt: -1 })
  }

  static async create(data) {
    return WarehouseModel.create(data)
  }
}

module.exports = WarehouseRepository


