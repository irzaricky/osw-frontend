import { api } from '../../plugins/axios'

const stockMonitoringService = {
  getSummary() {
    return api.get('/warehouse/stock-monitoring/summary')
  },

  getParts() {
    return api.get('/warehouse/stock-monitoring/parts')
  },

  getPartLabels(partNumber: string) {
    return api.get(`/warehouse/stock-monitoring/parts/${partNumber}`)
  },

  getBins() {
    return api.get('/warehouse/stock-monitoring/bins')
  },

  getBinStocks(binId: number | string) {
    return api.get(`/warehouse/stock-monitoring/bins/${binId}`)
  }
}

export default stockMonitoringService