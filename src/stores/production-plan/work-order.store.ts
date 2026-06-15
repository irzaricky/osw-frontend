import { defineStore } from 'pinia'
import { ref }         from 'vue'
import workOrderService from '../../services/production-plan/work-order.service'
import type {
  WorkOrder,
  WorkOrderProgress,
  WorkOrderIssue,
  WorkOrderMaterial,
  DailySummary,
  WorkOrderListParams,
  DailySummaryParams,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteWorkOrderPayload,
  UpdateStationStatusPayload,
  UpdateMaterialActualPayload,
} from '../../types/production-plan/work-order'

export const useWorkOrderStore = defineStore('workOrder', () => {

  // ── State ──────────────────────────────────────────────────────────────────
  const workOrders   = ref<WorkOrder[]>([])
  const currentWO    = ref<WorkOrder | null>(null)
  const dailySummary = ref<DailySummary | null>(null)
  const progresses   = ref<WorkOrderProgress[]>([])
  const issues       = ref<WorkOrderIssue[]>([])
  const materials    = ref<WorkOrderMaterial[]>([])

  const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const loading = ref(false)
  const saving  = ref(false)
  const error   = ref<string | null>(null)

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
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
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
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDailySummary(params?: DailySummaryParams) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getDailySummary(params)
      if (data.status) dailySummary.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
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
        currentWO.value = {
          ...currentWO.value,
          status:            'In_Progress',
          actual_start_time: data.data?.actual_start_time ?? new Date().toISOString(),
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function completeWorkOrder(id: number | string, payload: CompleteWorkOrderPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.completeWorkOrder(id, payload)
      if (data.status && currentWO.value) {
        currentWO.value = {
          ...currentWO.value,
          status:           'Completed',
          actual_quantity:  data.data?.actual_quantity ?? payload.actual_quantity,
          actual_end_time:  data.data?.actual_end_time ?? new Date().toISOString(),
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
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
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
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
          currentWO.value = {
            ...currentWO.value,
            actual_quantity:     data.data.cumulative_qty_good ?? currentWO.value.actual_quantity,
            cumulative_qty_good: data.data.cumulative_qty_good,
          }
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
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
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function reportIssue(id: number | string, payload: ReportIssuePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.reportIssue(id, payload)
      if (data.status) issues.value = [data.data, ...issues.value]
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function resolveIssue(
    id:       number | string,
    issue_id: number | string,
    payload:  ResolveIssuePayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.resolveIssue(id, issue_id, payload)
      if (data.status) {
        const idx = issues.value.findIndex((i) => i.id === Number(issue_id))
        if (idx !== -1) issues.value[idx] = data.data
        if (currentWO.value?.issues) {
          const issueIdx = currentWO.value.issues.findIndex((i) => i.id === Number(issue_id))
          if (issueIdx !== -1) currentWO.value.issues[issueIdx] = data.data
        }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Station Status ────────────────────────────────────────────────────────

  async function updateStationStatus(
    wo_id:      number | string,
    station_id: number | string,
    payload:    UpdateStationStatusPayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.updateStationStatus(wo_id, station_id, payload)
      if (data.status && currentWO.value?.stations) {
        const idx = currentWO.value.stations.findIndex((s) => s.id === Number(station_id))
        if (idx !== -1) currentWO.value.stations[idx] = { ...currentWO.value.stations[idx], ...data.data }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Materials ─────────────────────────────────────────────────────────────

  async function fetchMaterials(id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getMaterials(id)
      if (data.status) materials.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function updateMaterialActual(
    wo_id:       number | string,
    material_id: number | string,
    payload:     UpdateMaterialActualPayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.updateMaterialActual(wo_id, material_id, payload)
      if (data.status) {
        const idx = materials.value.findIndex((m) => m.id === Number(material_id))
        if (idx !== -1) materials.value[idx] = { ...materials.value[idx], ...data.data }
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearCurrentWO() {
    currentWO.value  = null
    progresses.value = []
    issues.value     = []
    materials.value  = []
  }

  function clearList() {
    workOrders.value = []
    meta.value       = { page: 1, limit: 10, total: 0, totalPages: 0 }
  }

  return {
    workOrders,
    currentWO,
    dailySummary,
    progresses,
    issues,
    materials,
    meta,
    loading,
    saving,
    error,
    fetchWorkOrders,
    fetchWorkOrder,
    fetchDailySummary,
    startWorkOrder,
    completeWorkOrder,
    fetchProgresses,
    addProgress,
    fetchIssues,
    reportIssue,
    resolveIssue,
    updateStationStatus,
    fetchMaterials,
    updateMaterialActual,
    clearCurrentWO,
    clearList,
  }
})