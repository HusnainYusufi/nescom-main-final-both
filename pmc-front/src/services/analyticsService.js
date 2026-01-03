// src/services/analyticsService.js
// Static offline placeholder for LAN / development

const analyticsService = {
  getDashboard: async () => {
    return {
      message: 'Static Dashboard Loaded',
      timestamp: new Date().toISOString(),
    }
  },
  getUserDashboard: async () => {
    return {
      message: 'Static User Dashboard Loaded',
      timestamp: new Date().toISOString(),
    }
  },
}

export default analyticsService
