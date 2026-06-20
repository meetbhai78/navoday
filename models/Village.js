const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  district: { type: String, default: '' },
  state: { type: String, default: '' }
});

module.exports = mongoose.model('Village', villageSchema);
