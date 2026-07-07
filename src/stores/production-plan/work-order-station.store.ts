import { defineStore } from 'pinia'
import { ref }         from 'vue'
import workOrderService from '../../services/production-plan/work-order.service'
import type {
  WorkOrder,
  WorkOrderStationDetail,
  WorkOrderOutputPart,
  WorkOrderProgress,
  WorkOrderIssue,
  WorkOrderMaterial,
  AddProgressPayload,
  ReportIssuePayload,
  ResolveIssuePayload,
  CompleteStationPayload,
  UpdateMaterialActualPayload,
} from '../../types/production-plan/work-order'

export const useWorkOrderStationStore = defineStore('workOrderStation', () => {

  // ── State ────────────────────────────────────────────────────────────────────

  const parentWO       = ref<WorkOrder | null>(null)
  const currentStation = ref<WorkOrderStationDetail | null>(null)
  const outputParts    = ref<WorkOrderOutputPart[]>([])
  const progresses     = ref<WorkOrderProgress[]>([])
  const issues         = ref<WorkOrderIssue[]>([])
  const materials      = ref<WorkOrderMaterial[]>([])

  const loading = ref(false)
  const saving  = ref(false)
  const error   = ref<string | null>(null)

  // ── Station Detail ───────────────────────────────────────────────────────────

  async function fetchStationDetail(wo_id: number | string, station_id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getStationDetail(wo_id, station_id)
      if (data.status) {
        parentWO.value       = data.data.wo
        currentStation.value = data.data.station
        outputParts.value    = data.data.output_parts
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function completeStation(wo_id: number | string, station_id: number | string, payload: CompleteStationPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.completeStation(wo_id, station_id, payload)
      if (data.status && currentStation.value) {
        currentStation.value = {
          ...currentStation.value,
          status:          'Completed',
          actual_quantity: payload.actual_quantity,
          completed_at:    data.data?.completed_at ?? new Date().toISOString(),
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

  // ── Progress ─────────────────────────────────────────────────────────────────

  async function fetchProgresses(wo_id: number | string, station_id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getStationProgresses(wo_id, station_id)
      if (data.status) progresses.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function addProgress(wo_id: number | string, station_id: number | string, payload: AddProgressPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.addStationProgress(wo_id, station_id, payload)
      if (data.status) {
        progresses.value = [data.data, ...progresses.value]
        if (currentStation.value) {
          currentStation.value = {
            ...currentStation.value,
            actual_quantity: data.data.cumulative_qty_good ?? currentStation.value.actual_quantity,
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

  async function editLastProgress(wo_id: number | string, station_id: number | string, payload: AddProgressPayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.editLastStationProgress(wo_id, station_id, payload)
      if (data.status) {
        // Ganti record pertama (terakhir dilaporkan) dengan record baru
        progresses.value = [data.data, ...progresses.value.slice(1)]
        if (currentStation.value) {
          currentStation.value = {
            ...currentStation.value,
            actual_quantity: data.data.cumulative_qty_good ?? currentStation.value.actual_quantity,
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

  // ── Issues ───────────────────────────────────────────────────────────────────

  async function fetchIssues(wo_id: number | string, station_id: number | string, resolved?: 'true' | 'false') {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getStationIssues(wo_id, station_id, resolved)
      if (data.status) issues.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function reportIssue(wo_id: number | string, station_id: number | string, payload: ReportIssuePayload) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.reportStationIssue(wo_id, station_id, payload)
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
    wo_id:      number | string,
    station_id: number | string,
    issue_id:   number | string,
    payload:    ResolveIssuePayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.resolveStationIssue(wo_id, station_id, issue_id, payload)
      if (data.status) {
        const idx = issues.value.findIndex((i) => i.id === Number(issue_id))
        if (idx !== -1) issues.value[idx] = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Materials ────────────────────────────────────────────────────────────────

  async function fetchMaterials(wo_id: number | string, station_id: number | string) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await workOrderService.getStationMaterials(wo_id, station_id)
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
    station_id:  number | string,
    material_id: number | string,
    payload:     UpdateMaterialActualPayload,
  ) {
    saving.value = true
    error.value  = null
    try {
      const { data } = await workOrderService.updateStationMaterialActual(wo_id, station_id, material_id, payload)
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

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function clearStation() {
    parentWO.value       = null
    currentStation.value = null
    progresses.value     = []
    issues.value         = []
    materials.value      = []
  }

  return {
    parentWO,
    currentStation,
    outputParts,
    progresses,
    issues,
    materials,
    loading,
    saving,
    error,
    fetchStationDetail,
    completeStation,
    fetchProgresses,
    addProgress,
    editLastProgress,
    fetchIssues,
    reportIssue,
    resolveIssue,
    fetchMaterials,
    updateMaterialActual,
    clearStation,
  }
})