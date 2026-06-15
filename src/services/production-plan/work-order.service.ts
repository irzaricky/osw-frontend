import { api } from '../../plugins/axios'
import type {
  WorkOrderListParams,
  DailySummaryParams,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteWorkOrderPayload,
  UpdateStationStatusPayload,
  UpdateMaterialActualPayload,
} from '../../types/production-plan/work-order'

const BASE = '/production-plan/work-order'

const workOrderService = {

  getWorkOrders(params?: WorkOrderListParams) {
    return api.get(BASE, { params })
  },

  getWorkOrder(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDailySummary(params?: DailySummaryParams) {
    return api.get(`${BASE}/daily-summary`, { params })
  },

  startWorkOrder(id: number | string) {
    return api.post(`${BASE}/${id}/start`)
  },

  completeWorkOrder(id: number | string, data: CompleteWorkOrderPayload) {
    return api.post(`${BASE}/${id}/complete`, data)
  },

  getProgresses(id: number | string) {
    return api.get(`${BASE}/${id}/progresses`)
  },

  addProgress(id: number | string, data: AddProgressPayload) {
    return api.post(`${BASE}/${id}/progresses`, data)
  },

  getIssues(id: number | string, resolved?: 'true' | 'false') {
    return api.get(`${BASE}/${id}/issues`, {
      params: resolved !== undefined ? { resolved } : undefined,
    })
  },

  reportIssue(id: number | string, data: ReportIssuePayload) {
    return api.post(`${BASE}/${id}/issues`, data)
  },

  resolveIssue(id: number | string, issue_id: number | string, data: ResolveIssuePayload) {
    return api.put(`${BASE}/${id}/issues/${issue_id}/resolve`, data)
  },

  updateStationStatus(
    wo_id:      number | string,
    station_id: number | string,
    data:       UpdateStationStatusPayload,
  ) {
    return api.put(`${BASE}/${wo_id}/stations/${station_id}/status`, data)
  },

  getMaterials(id: number | string) {
    return api.get(`${BASE}/${id}/materials`)
  },

  updateMaterialActual(
    wo_id:       number | string,
    material_id: number | string,
    data:        UpdateMaterialActualPayload,
  ) {
    return api.put(`${BASE}/${wo_id}/materials/${material_id}/actual`, data)
  },
}

export default workOrderService