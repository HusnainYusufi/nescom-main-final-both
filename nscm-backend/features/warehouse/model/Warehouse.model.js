const mongoose = require('mongoose')

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false },
)

const ContactSchema = new mongoose.Schema(
  {
    person: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false },
)

const WarehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: AddressSchema, default: {} },
    contact: { type: ContactSchema, default: {} },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Warehouse', WarehouseSchema)


