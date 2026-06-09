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

  exportForecastExcel(params?: AnalyticsFilters) {
    return api.get(`${BASE}/forecast-export`, {
      params,
      responseType: 'blob'
    })
  },

  exportSprExcel(params?: AnalyticsFilters) {
    return api.get(`${BASE}/spr-export`, {
      params,
      responseType: 'blob'
    })
  },

  exportSpoExcel(params?: AnalyticsFilters) {
    return api.get(`${BASE}/spo-export`, {
      params,
      responseType: 'blob'
    })
  },

  exportSdpExcel(params?: AnalyticsFilters) {
    return api.get(`${BASE}/sdp-export`, {
      params,
      responseType: 'blob'
    })
  },

  exportSdoExcel(params?: AnalyticsFilters) {
    return api.get(`${BASE}/sdo-export`, {
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
  },

  getSpoAnalytics(params?: AnalyticsFilters) {
    return api.get(`${BASE}/spo`, { params })
  },

  getSdoAnalytics(params?: AnalyticsFilters) {
    return api.get(`${BASE}/sdo`, { params })
  }
}

export default analyticsService
