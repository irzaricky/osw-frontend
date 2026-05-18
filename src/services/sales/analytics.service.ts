import { api } from '../../plugins/axios'
import type { AnalyticsFilters } from '../../types/sales/analytics'

const BASE = '/sales/analytics'

const analyticsService = {
  getSummary(params?: AnalyticsFilters) {
    return api.get(`${BASE}/summary`, { params })
  },

  getTrends(params?: AnalyticsFilters) {
    return api.get(`${BASE}/trends`, { params })
  },

  exportExcel(params?: AnalyticsFilters) {
    return api.get(`${BASE}/export`, {
      params,
      responseType: 'blob'
    })
  }
}

export default analyticsService
