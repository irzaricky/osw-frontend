// services/material/analytics.service.ts
import { api } from '../../plugins/axios'
import type { MaterialAnalyticsParams } from '../../types/material/analytics'

const BASE = '/material/analytics'

const materialAnalyticsService = {
  getMrpAnalytics(params?: MaterialAnalyticsParams) {
    return api.get(`${BASE}/mrp`, { params })
  },

  getMprAnalytics(params?: MaterialAnalyticsParams) {
    return api.get(`${BASE}/mpr`, { params })
  },

  getMpoAnalytics(params?: MaterialAnalyticsParams) {
    return api.get(`${BASE}/mpo`, { params })
  },

  getMdoAnalytics(params?: MaterialAnalyticsParams) {
    return api.get(`${BASE}/mdo`, { params })
  },
}

export default materialAnalyticsService