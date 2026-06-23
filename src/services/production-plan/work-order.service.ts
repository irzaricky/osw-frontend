import { api } from '../../plugins/axios'
import type {
  WorkOrderListParams,
  DailySummaryParams,
  StartWorkOrderPayload,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteStationPayload,
  UpdateStationStatusPayload,
  UpdateMaterialActualPayload,
} from '../../types/production-plan/work-order'

const BASE = '/production-plan/work-order'

const workOrderService = {

  // ── WO Line ──────────────────────────────────────────────────────────────────

  getWorkOrders(params?: WorkOrderListParams) {
    return api.get(BASE, { params })
  },

  getWorkOrder(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDailySummary(params?: DailySummaryParams) {
    return api.get(`${BASE}/daily-summary`, { params })
  },

  startWorkOrder(id: number | string, data?: StartWorkOrderPayload) {
    return api.post(`${BASE}/${id}/start`, data ?? {})
  },

  checkMaterials(id: number | string) {
    return api.get(`${BASE}/${id}/materials/check`)
  },

  // ── WO Station ───────────────────────────────────────────────────────────────

  getStationDetail(wo_id: number | string, station_id: number | string) {
    return api.get(`${BASE}/${wo_id}/stations/${station_id}`)
  },

  completeStation(wo_id: number | string, station_id: number | string, data: CompleteStationPayload) {
    return api.post(`${BASE}/${wo_id}/stations/${station_id}/complete`, data)
  },

  updateStationStatus(wo_id: number | string, station_id: number | string, data: UpdateStationStatusPayload) {
    return api.put(`${BASE}/${wo_id}/stations/${station_id}/status`, data)
  },

  // ── Station Progress ─────────────────────────────────────────────────────────

  getStationProgresses(wo_id: number | string, station_id: number | string) {
    return api.get(`${BASE}/${wo_id}/stations/${station_id}/progresses`)
  },

  addStationProgress(wo_id: number | string, station_id: number | string, data: AddProgressPayload) {
    return api.post(`${BASE}/${wo_id}/stations/${station_id}/progresses`, data)
  },

  // ── Station Issues ───────────────────────────────────────────────────────────

  getStationIssues(wo_id: number | string, station_id: number | string, resolved?: 'true' | 'false') {
    return api.get(`${BASE}/${wo_id}/stations/${station_id}/issues`, {
      params: resolved !== undefined ? { resolved } : undefined,
    })
  },

  reportStationIssue(wo_id: number | string, station_id: number | string, data: ReportIssuePayload) {
    return api.post(`${BASE}/${wo_id}/stations/${station_id}/issues`, data)
  },

  resolveStationIssue(
    wo_id:      number | string,
    station_id: number | string,
    issue_id:   number | string,
    data:       ResolveIssuePayload,
  ) {
    return api.put(`${BASE}/${wo_id}/stations/${station_id}/issues/${issue_id}/resolve`, data)
  },

  // ── Station Materials ────────────────────────────────────────────────────────

  getStationMaterials(wo_id: number | string, station_id: number | string) {
    return api.get(`${BASE}/${wo_id}/stations/${station_id}/materials`)
  },

  updateStationMaterialActual(
    wo_id:       number | string,
    station_id:  number | string,
    material_id: number | string,
    data:        UpdateMaterialActualPayload,
  ) {
    return api.put(`${BASE}/${wo_id}/stations/${station_id}/materials/${material_id}/actual`, data)
  },
}

export default workOrderService