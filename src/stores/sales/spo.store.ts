import { defineStore } from 'pinia'
import { ref } from 'vue'
import spoService, { type SpoParams } from '../../services/sales/spo.service'
import type { Spo, SpoSdoHistory, SprDropdownItem } from '../../types/sales/spo'

export const useSpoStore = defineStore('spo', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const spos = ref<Spo[]>([])
  const detail = ref<Spo | null>(null)
  const sdoHistory = ref<SpoSdoHistory | null>(null)

  // ─── Kanban State ───────────────────────────────────────────────────────────
  const kanbanSpos = ref<Record<string, Spo[]>>({})
  const kanbanMeta = ref<Record<string, { page: number; total: number; totalPages: number; loading: boolean }>>({})
  const kanbanFilters = ref<Record<string, { customer_id?: number | null; start_date?: string; end_date?: string }>>({})

  // ─── Dropdowns ──────────────────────────────────────────────────────────────
  const statusDropdown = ref<string[]>([])
  const customersDropdown = ref<{ id: number; name: string; customer_code: string }[]>([])
  const sprDropdown = ref<SprDropdownItem[]>([])

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function fetchSpos(params: SpoParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.getSpos(params)
      const data = response.data
      if (data.status) {
        spos.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching SPOs:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSpoById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.getSpoById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownStatus() {
    try {
      const response = await spoService.ddStatus()
      if (response.data?.status) {
        statusDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching status dropdown:', e)
    }
  }

  async function fetchDropdownCustomers() {
    try {
      const response = await spoService.ddCustomers()
      if (response.data?.status) {
        customersDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching customers dropdown:', e)
    }
  }

  async function fetchSprDropdown() {
    try {
      const response = await spoService.listSpr()
      if (response.data?.status) {
        sprDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching SPR dropdown:', e)
    }
  }

  async function createSpo(data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.createSpo(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSpo(id: number | string, data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.updateSpo(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSpo(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.deleteSpo(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: number | string, data: { status: string; remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.updateStatus(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSdoHistory(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await spoService.getSdoHistory(id)
      const data = response.data
      if (data.status) {
        sdoHistory.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchKanbanByStatus(status: string, params: SpoParams = {}, append = false) {
    if (!kanbanMeta.value[status]) {
      kanbanMeta.value[status] = { page: 1, total: 0, totalPages: 0, loading: false }
    }

    const targetMeta = kanbanMeta.value[status]
    if (targetMeta.loading) return

    // If appending, check if we have more pages
    if (append && targetMeta.totalPages > 0 && targetMeta.page >= targetMeta.totalPages) return

    targetMeta.loading = true
    try {
      const page = append ? targetMeta.page + 1 : 1
      const columnFilters = kanbanFilters.value[status] || {}
      const response = await spoService.getSpos({ ...params, ...columnFilters, status, page })
      const data = response.data

      if (data.status) {
        if (append) {
          kanbanSpos.value[status] = [...(kanbanSpos.value[status] || []), ...data.data.rows]
        } else {
          kanbanSpos.value[status] = data.data.rows
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
    kanbanSpos.value = {}
    kanbanMeta.value = {}
  }

  return {
    // State
    spos,
    detail,
    sdoHistory,
    // Dropdowns
    statusDropdown,
    customersDropdown,
    sprDropdown,
    // Pagination
    meta,
    loading,
    error,
    // Actions
    fetchSpos,
    fetchSpoById,
    fetchDropdownStatus,
    fetchDropdownCustomers,
    fetchSprDropdown,
    createSpo,
    updateSpo,
    deleteSpo,
    updateStatus,
    fetchSdoHistory,
    // Kanban
    kanbanSpos,
    kanbanMeta,
    kanbanFilters,
    fetchKanbanByStatus,
    resetKanban
  }
})
