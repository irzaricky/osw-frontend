import { api } from '../../plugins/axios'
import type { AnalyticsParams } from '../../types/production-plan/analytics'

const BASE = '/production-plan/analytics'

const productionAnalyticsService = {
  getExecutiveSummary(params?: AnalyticsParams) {
    return api.get(`${BASE}/executive-summary`, { params })
  },

  getProductionTrend(params?: AnalyticsParams) {
    return api.get(`${BASE}/production-trend`, { params })
  },

  getLineUtilization(params?: AnalyticsParams) {
    return api.get(`${BASE}/line-utilization`, { params })
  },

  getWorkOrderStatus(params?: AnalyticsParams) {
    return api.get(`${BASE}/work-order-status`, { params })
  },

  getOutputQuality(params?: AnalyticsParams) {
    return api.get(`${BASE}/output-quality`, { params })
  },

  getDowntimeByType(params?: AnalyticsParams) {
    return api.get(`${BASE}/downtime-by-type`, { params })
  },

  getTopDowntimeStations(params?: AnalyticsParams) {
    return api.get(`${BASE}/top-downtime-stations`, { params })
  },

  getDefectByType(params?: AnalyticsParams) {
    return api.get(`${BASE}/defect-by-type`, { params })
  },

  getLineEfficiency(params?: AnalyticsParams) {
    return api.get(`${BASE}/line-efficiency`, { params })
  },

  getOnTimeDelivery(params?: AnalyticsParams) {
    return api.get(`${BASE}/on-time-delivery`, { params })
  },

  getRescheduleFrequency(params?: AnalyticsParams) {
    return api.get(`${BASE}/reschedule-frequency`, { params })
  },

  getCapacityFeasibility(params?: AnalyticsParams) {
    return api.get(`${BASE}/capacity-feasibility`, { params })
  },

  getIssueDetails(params?: AnalyticsParams) {
    return api.get(`${BASE}/issue-details`, { params })
  }
}

export default productionAnalyticsService