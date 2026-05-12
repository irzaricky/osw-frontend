import { api } from '../../plugins/axios'

export interface WarehouseAnalyticsParams {
  date_from?: string
  date_to?: string
  warehouse_area_id?: number
  part_category?: string
  part_number?: string
  movement_type?: string
}

const warehouseAnalyticsService = {
  getExecutiveSummary(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/executive-summary', { params })
  },

  getStockMovement(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/stock-movement', { params })
  },

  getFastMoving(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/fast-moving', { params })
  },

  getSlowMoving(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/slow-moving', { params })
  },

  getUtilization(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/utilization', { params })
  },
  getFifoCompliance(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/fifo-compliance', { params })
  },

getAgingDistribution(params?: WarehouseAnalyticsParams) {
    return api.get('/warehouse/analytics/aging-distribution', { params })
  },
  getInventoryValue(params?: WarehouseAnalyticsParams) {
  return api.get('/warehouse/analytics/inventory-value', { params })
},

getTopInventoryValue(params?: WarehouseAnalyticsParams) {
  return api.get('/warehouse/analytics/top-inventory-value', { params })
},
getInventoryHealth(params?: WarehouseAnalyticsParams) {
  return api.get('/warehouse/analytics/inventory-health', { params })
},
getCriticalParts(params?: WarehouseAnalyticsParams) {
  return api.get('/warehouse/analytics/critical-parts', { params })
},


}

export default warehouseAnalyticsService