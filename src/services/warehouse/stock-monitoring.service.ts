import { api } from '../../plugins/axios'

export interface StockMonitoringParams {
  search?: string
  warehouse_area_id?: number
  status?: string
  part_category?: string
  low_stock_only?: boolean
  aging_only?: boolean
  low_capacity_only?: boolean
}

const stockMonitoringService = {
  getSummary() {
    return api.get('/warehouse/stock-monitoring/summary')
  },

  getParts(params?: StockMonitoringParams) {
    return api.get('/warehouse/stock-monitoring/parts', { params })
  },

  getPartLabels(partNumber: string) {
    return api.get(`/warehouse/stock-monitoring/parts/${partNumber}`)
  },

  getBins(params?: StockMonitoringParams) {
    return api.get('/warehouse/stock-monitoring/bins', { params })
  },

  getBinStocks(binId: number | string) {
    return api.get(`/warehouse/stock-monitoring/bins/${binId}`)
  }
}

export default stockMonitoringService