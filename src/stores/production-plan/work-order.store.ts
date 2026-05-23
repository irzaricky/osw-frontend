import { defineStore } from 'pinia'
import { ref }         from 'vue'
import workOrderService from '../../services/production-plan/work-order.service'
import type {
  WorkOrder,
  WorkOrderProgress,
  WorkOrderIssue,
  DailySummary,
  WorkOrderListParams,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteWorkOrderPayload,
  UpdateStationJobStatusPayload,
} from '../../types/production-plan/work-order'

export const useWorkOrderStore = defineStore('workOrder', () => {

  // ── State ──────────────────────────────────────────────────────────────────

  const workOrders   = ref<WorkOrder[]>([])
  const currentWO    = ref<WorkOrder | null>(null)
  const dailySummary = ref<DailySummary | null>(null)
  const progresses   = ref<WorkOrderProgress[]>([])
  const issues       = ref<WorkOrderIssue[]>([])

  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const loading    = ref(false)
  const saving     = ref(false)
  const error      = ref<string | null>(null)

  // ── List & Detail ──────────────────────────────────────────────────────────

  async function fetchWorkOrders(params: WorkOrderListParams = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getWorkOrders(params)
      if (data.status) {
        workOrders.value = data.data.rows
        meta.value = {
          page:       data.data.page,
          limit:      data.data.limit,
          total:      data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
    }
    finally {
      loading.value = false
    }
  }

  async function fetchWorkOrder(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getWorkOrder(id)
      if (data.status) currentWO.value = data.data
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function fetchDailySummary(work_date?: string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getDailySummary(work_date)
      if (data.status) dailySummary.value = data.data
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
    }
    finally {
      loading.value = false
    }
  }

  // ── Execution ──────────────────────────────────────────────────────────────

  async function startWorkOrder(id: number | string) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.startWorkOrder(id)
      if (data.status && currentWO.value) {
        currentWO.value = { ...currentWO.value, status: 'In_Progress' }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  async function fetchProgresses(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getProgresses(id)
      if (data.status) progresses.value = data.data
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
    }
    finally {
      loading.value = false
    }
  }

  async function addProgress(id: number | string, payload: AddProgressPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.addProgress(id, payload)
      if (data.status) {
        progresses.value = [data.data, ...progresses.value]
        if (currentWO.value) {
          currentWO.value = { ...currentWO.value, actual_quantity: payload.cumulative_qty }
        }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  // ── Issues ────────────────────────────────────────────────────────────────

  async function fetchIssues(id: number | string, resolved?: 'true' | 'false') {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getIssues(id, resolved)
      if (data.status) issues.value = data.data
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
    }
    finally {
      loading.value = false
    }
  }

  async function reportIssue(id: number | string, payload: ReportIssuePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.reportIssue(id, payload)
      if (data.status) {
        issues.value = [data.data, ...issues.value]
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  async function resolveIssue(id: number | string, issue_id: number | string, payload: ResolveIssuePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.resolveIssue(id, issue_id, payload)
      if (data.status) {
        const idx = issues.value.findIndex((i) => i.id === Number(issue_id))
        if (idx !== -1) issues.value[idx] = data.data
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  // ── Complete ──────────────────────────────────────────────────────────────

  async function completeWorkOrder(id: number | string, payload: CompleteWorkOrderPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.completeWorkOrder(id, payload)
      if (data.status && currentWO.value) {
        currentWO.value = {
          ...currentWO.value,
          status:          'Completed',
          actual_quantity: payload.actual_quantity,
        }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  // ── Station Job ───────────────────────────────────────────────────────────

  async function updateStationJobStatus(
    wo_id:      number | string,
    station_id: number | string,
    job_id:     number | string,
    payload:    UpdateStationJobStatusPayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.updateStationJobStatus(wo_id, station_id, job_id, payload)
      if (data.status && currentWO.value?.stations) {
        const station = currentWO.value.stations.find((s) => s.id === Number(station_id))
        if (station?.jobs) {
          const jobIdx = station.jobs.findIndex((j) => j.id === Number(job_id))
          if (jobIdx !== -1) station.jobs[jobIdx] = { ...station.jobs[jobIdx], ...data.data }
        }
      }
      return data
    }
    catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    }
    finally {
      saving.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearCurrentWO() {
    currentWO.value  = null
    progresses.value = []
    issues.value     = []
  }

  function clearList() {
    workOrders.value = []
    meta.value       = { page: 1, limit: 10, total: 0, totalPages: 0 }
  }

  // ── Expose ─────────────────────────────────────────────────────────────────

  return {
    workOrders,
    currentWO,
    dailySummary,
    progresses,
    issues,
    meta,
    loading,
    saving,
    error,

    fetchWorkOrders,
    fetchWorkOrder,
    fetchDailySummary,
    startWorkOrder,
    fetchProgresses,
    addProgress,
    fetchIssues,
    reportIssue,
    resolveIssue,
    completeWorkOrder,
    updateStationJobStatus,
    clearCurrentWO,
    clearList,
  }
})