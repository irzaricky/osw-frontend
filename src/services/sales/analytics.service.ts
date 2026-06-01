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
  },

  getSlaMetrics(params?: AnalyticsFilters) {
    return api.get(`${BASE}/sla`, { params })
  },

  getForecastVsSpo(params?: AnalyticsFilters) {
    return api.get(`${BASE}/forecast-vs-spo`, { params })
  },

  getTopCustomers(params?: AnalyticsFilters) {
    return api.get(`${BASE}/top-customers`, { params })
  },

  getForecastAnalytics(params?: AnalyticsFilters) {
    return api.get(`${BASE}/forecast`, { params })
  },

  getSprAnalytics(params?: AnalyticsFilters) {
    return api.get(`${BASE}/spr`, { params })
  }
}

export default analyticsService
