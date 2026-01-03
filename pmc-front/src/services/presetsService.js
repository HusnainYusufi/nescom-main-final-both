// src/services/presetBoxes.js
import api from './api'

const presetsService = {
  // Fetch all presets
  getPresets: async () => {
    const { data } = await api.get('/box-presets')
    return data.presets
  },

  // Create a new preset
  addPreset: async (preset) => {
    const { data } = await api.post('/box-presets', preset)
    return data
  },
}

export default presetsService
