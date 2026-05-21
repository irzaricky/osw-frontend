import { defineStore } from 'pinia'
import { ref } from 'vue'
import mpoService, { type MpoParams } from '../../services/material/mpo.service'
import type { Mpo, MpoDropdownSupplier, MpoSourceData } from '../../types/material/mpo'

export const useMpoStore = defineStore('mpo', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const mpos = ref<Mpo[]>([])
  const detail = ref<Mpo | null>(null)

  // ─── Dropdowns ──────────────────────────────────────────────────────────────
  const statusDropdown = ref<string[]>([])
  const sourceDropdown = ref<{ label: string; source_type: 'mrp' | 'mpr'; source_id: number }[]>([])
  const supplierDropdown = ref<MpoDropdownSupplier[]>([])

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Actions ──────────────────────────────────────────────────────────────────

  async function fetchMpos(params: MpoParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await mpoService.getMpos(params)
      const data = response.data
      if (data.status) {
        mpos.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MPOs:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMpoById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mpoService.getMpoById(id)
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
      const response = await mpoService.ddStatus()
      if (response.data?.status) {
        statusDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching status dropdown:', e)
    }
  }

  async function fetchDropdownSource() {
    try {
      const response = await mpoService.ddSource()
      if (response.data?.status) {
        sourceDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching source dropdown:', e)
    }
  }

  async function fetchDropdownSupplier(params?: { search?: string; part_ids?: string }) {
    try {
      const response = await mpoService.ddSupplier(params)
      if (response.data?.status) {
        supplierDropdown.value = response.data.data
      }
    } catch (e: any) {
      console.error('Error fetching supplier dropdown:', e)
    }
  }

  // Fetch supplier untuk satu part_id — dipakai per baris di tabel
  async function fetchDropdownSupplierForPart(partId: number): Promise<{ id: number; name: string }[]> {
    try {
      const response = await mpoService.ddSupplier({ part_ids: String(partId) })
      if (response.data?.status) {
        return response.data.data.map((s: any) => ({ id: s.id, name: s.name }))
      }
      return []
    } catch (e: any) {
      console.error('Error fetching supplier for part:', e)
      return []
    }
  }

  async function loadSourceData(sourceType: 'mpr' | 'mrp', sourceId: number | string): Promise<MpoSourceData | null> {
    try {
      const response = await mpoService.getSourceData(sourceType, sourceId)
      if (response.data?.status) {
        return response.data.data
      }
      return null
    } catch (e: any) {
      console.error('Error loading source data:', e)
      throw e
    }
  }

  async function createMpo(data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await mpoService.createMpo(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMpo(id: number | string, data: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await mpoService.updateMpo(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteMpo(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mpoService.deleteMpo(id)
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
      const response = await mpoService.updateStatus(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMdoHistory(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mpoService.getMdoHistory(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    mpos,
    detail,
    // Dropdowns
    statusDropdown,
    sourceDropdown,
    supplierDropdown,
    // Pagination
    meta,
    loading,
    error,
    // Actions
    fetchMpos,
    fetchMpoById,
    fetchDropdownStatus,
    fetchDropdownSource,
    fetchDropdownSupplier,
    fetchDropdownSupplierForPart,
    loadSourceData,
    createMpo,
    updateMpo,
    deleteMpo,
    updateStatus,
    fetchMdoHistory
  }
})