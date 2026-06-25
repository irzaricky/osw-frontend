import { api } from '../../plugins/axios'

export interface ProductionWo {
  wo_id: number
  wo_number: string
  planned_quantity: number

  part_id: number
  part_number: string
  part_name: string

  station?: {
    id: number
    name: string
  } | null
}

export interface ProductionResultPayload {
  production_wo_id?: number | null
  production_date: string
  shift_id: number
  station_id: number
  part_id: number
  material_part_id: number
  planning_qty: number
  actual_qty: number
  total_ok: number
  total_ng: number
  remarks?: string
}

export interface ReplacementPayload {
  production_result_id: number
  station_id: number
  material_part_id: number
  qty_replacement: number
  replacement_reason?: string
}

export interface ScrapPayload {
  production_result_id: number
  scrap_date: string
  part_id: number
  material_part_id: number
  qty_scrap: number
  weight_per_pcs?: number
  remarks?: string
}

const productionMaterialControlService = {
  getDashboard() {
    return api.get('/production/production-material-control/dashboard')
  },

  getProductionResults(params?: Record<string, any>) {
    return api.get('/production/production-material-control/production-results', { params })
  },

  createProductionResult(data: ProductionResultPayload) {
    return api.post('/production/production-material-control/production-results', data)
  },

  getReplacements(params?: Record<string, any>) {
    return api.get('/production/production-material-control/replacements', { params })
  },
  createReplacement(data: ReplacementPayload) {
    return api.post('/production/production-material-control/replacements', data)
  },

  getScraps(params?: Record<string, any>) {
    return api.get('/production/production-material-control/scraps', { params })
  },

  createScrap(data: ScrapPayload) {
    return api.post('/production/production-material-control/scraps', data)
  },

  getBufferStatus(params?: Record<string, any>) {
    return api.get('/production/production-material-control/buffer-status', { params })
  },
  getDropdowns() {
    return api.get('/production/production-material-control/dropdowns')
  },
  getBomMaterials(productPartId: number | string) {
    return api.get(`/production/production-material-control/bom-materials/${productPartId}`)
  },
  getReplacementsByProductionResult(productionResultId: number | string) {
    return api.get(`/production/production-material-control/production-results/${productionResultId}/replacements`)
  },
  getProductionWos() {
    return api.get('/production/production-material-control/production-wos')
  },

  getProductionWoMaterialLabels(
  productionWoId: number | string,
  stationId: number | string
) {
  return api.get(
    `/production/production-material-control/production-wos/${productionWoId}/stations/${stationId}/material-labels`
  )
},

  getBufferTransactions(params?: Record<string, any>) {
    return api.get('/production/production-material-control/buffer-transactions', { params })
  },

  getReplacementForScrap(productionResultId: number | string) {
    return api.get(`/production/production-material-control/production-results/${productionResultId}/replacements-for-scrap`)
  }
  
}

export default productionMaterialControlService