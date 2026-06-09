import { api } from '../../plugins/axios'
import type {
  WorkOrderListParams,
  DailySummaryParams,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteWorkOrderPayload,
  UpdateStationJobStatusPayload,
  ScanOperatorPayload,          // [BARU]
} from '../../types/production-plan/work-order'

const BASE = '/production-plan/work-order'

const workOrderService = {

  // ── List & Detail ──────────────────────────────────────────────────────────

  getWorkOrders(params?: WorkOrderListParams) {
    return api.get(BASE, { params })
  },

  getWorkOrder(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  // [PERUBAHAN] getDailySummary kini menerima objek params lengkap (bukan hanya string tanggal)
  // agar bisa meneruskan filter shift_id dan stage ke BE
  getDailySummary(params?: DailySummaryParams) {
    return api.get(`${BASE}/daily-summary`, { params })
  },

  // ── Execution ──────────────────────────────────────────────────────────────

  startWorkOrder(id: number | string) {
    return api.post(`${BASE}/${id}/start`)
  },

  // ── Progress ──────────────────────────────────────────────────────────────

  getProgresses(id: number | string) {
    return api.get(`${BASE}/${id}/progresses`)
  },

  addProgress(id: number | string, data: AddProgressPayload) {
    return api.post(`${BASE}/${id}/progresses`, data)
  },

  // ── Issues ────────────────────────────────────────────────────────────────

  getIssues(id: number | string, resolved?: 'true' | 'false') {
    return api.get(`${BASE}/${id}/issues`, { params: resolved !== undefined ? { resolved } : undefined })
  },

  reportIssue(id: number | string, data: ReportIssuePayload) {
    return api.post(`${BASE}/${id}/issues`, data)
  },

  resolveIssue(id: number | string, issue_id: number | string, data: ResolveIssuePayload) {
    return api.put(`${BASE}/${id}/issues/${issue_id}/resolve`, data)
  },

  // ── Complete ──────────────────────────────────────────────────────────────

  completeWorkOrder(id: number | string, data: CompleteWorkOrderPayload) {
    return api.post(`${BASE}/${id}/complete`, data)
  },

  // ── Station Job ───────────────────────────────────────────────────────────

  updateStationJobStatus(
    wo_id:      number | string,
    station_id: number | string,
    job_id:     number | string,
    data:       UpdateStationJobStatusPayload,
  ) {
    return api.put(`${BASE}/${wo_id}/stations/${station_id}/jobs/${job_id}/status`, data)
  },

  // ── [FITUR BARU] Scan Operator ────────────────────────────────────────────
  //
  // Memanggil endpoint POST /work-orders/:id/stations/:station_id/jobs/:job_id/scan-operator
  // Payload: { operator_id } — ID operator yang didapat dari scan QR Code di lapangan.
  // BE akan memvalidasi urutan (sequence enforcer) dan mengupdate status job ke In_Progress
  // jika sebelumnya masih Pending.
  scanOperator(
    wo_id:      number | string,
    station_id: number | string,
    job_id:     number | string,
    data:       ScanOperatorPayload,
  ) {
    return api.post(`${BASE}/${wo_id}/stations/${station_id}/jobs/${job_id}/scan-operator`, data)
  },
}

export default workOrderService