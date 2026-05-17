/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import sdoService, { type SdoParams } from '../../services/sales/sdo.service'
import type { Sdo, SdoDropdownVehicle, SdoDropdownDriver } from '../../types/sales/sdo'

export const useSdoStore = defineStore('sdo', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const sdos = ref<Sdo[]>([])
  const detail = ref<Sdo | null>(null)
  const vehicles = ref<SdoDropdownVehicle[]>([])
  const drivers = ref<SdoDropdownDriver[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // ─── Kanban State ───────────────────────────────────────────────────────────
  const kanbanSdos = ref<Record<string, Sdo[]>>({})
  const kanbanMeta = ref<Record<string, { page: number; total: number; totalPages: number; loading: boolean }>>({})
  const kanbanFilters = ref<Record<string, { customer_id?: number | null; start_date?: string; end_date?: string }>>({})

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function fetchSdos(params: SdoParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await sdoService.getSdos(params)
      const data = response.data
      if (data.status) {
        sdos.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SDOs:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSdoById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sdoService.getSdoById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error fetching SDO ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownVehicles() {
    try {
      const response = await sdoService.getDropdownVehicles()
      const data = response.data
      if (data.status) {
        vehicles.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching vehicles dropdown:', e)
    }
  }

  async function fetchDropdownDrivers() {
    try {
      const response = await sdoService.getDropdownDrivers()
      const data = response.data
      if (data.status) {
        drivers.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching drivers dropdown:', e)
    }
  }

  async function createSdo(data: { delivery_plan_id: number; vehicle_id: number; driver_id: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await sdoService.createSdo(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error creating SDO:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSdoStatus(id: number | string, formData: FormData) {
    loading.value = true
    error.value = null
    try {
      const response = await sdoService.updateSdoStatus(id, formData)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error updating SDO status ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadSdoPdf(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await sdoService.downloadSdoPdf(id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `SDO-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      error.value = 'Failed to download PDF document'
      console.error('Error downloading SDO PDF:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ─── Kanban Actions ──────────────────────────────────────────────────────────
  async function fetchKanbanByStatus(status: string, params: SdoParams = {}, append = false) {
    if (!kanbanMeta.value[status]) {
      kanbanMeta.value[status] = { page: 1, total: 0, totalPages: 0, loading: false }
    }

    const targetMeta = kanbanMeta.value[status]
    if (targetMeta.loading) return

    if (append && targetMeta.totalPages > 0 && targetMeta.page >= targetMeta.totalPages) return

    targetMeta.loading = true
    try {
      const page = append ? targetMeta.page + 1 : 1
      const columnFilters = kanbanFilters.value[status] || {}
      const response = await sdoService.getSdos({ ...params, ...columnFilters, delivery_status: status, page })
      const data = response.data

      if (data.status) {
        if (append) {
          kanbanSdos.value[status] = [...(kanbanSdos.value[status] || []), ...data.data.rows]
        } else {
          kanbanSdos.value[status] = data.data.rows
        }

        kanbanMeta.value[status] = {
          page: data.data.page,
          total: data.data.count,
          totalPages: data.data.totalPages,
          loading: false
        }
      }
    } catch (e: any) {
      console.error(`Error fetching Kanban [${status}]:`, e)
    } finally {
      targetMeta.loading = false
    }
  }

  function resetKanban() {
    kanbanSdos.value = {}
    kanbanMeta.value = {}
  }

  return {
    // State
    sdos,
    detail,
    vehicles,
    drivers,
    loading,
    error,
    meta,
    // Actions
    fetchSdos,
    fetchSdoById,
    fetchDropdownVehicles,
    fetchDropdownDrivers,
    createSdo,
    updateSdoStatus,
    downloadSdoPdf,
    // Kanban
    kanbanSdos,
    kanbanMeta,
    kanbanFilters,
    fetchKanbanByStatus,
    resetKanban
  }
})
