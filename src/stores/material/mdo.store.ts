// stores/material/mdo.store.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import mdoService, { type MdoParams, type MdoCreatePayload, type MdoPreviewSplitParams } from '../../services/material/mdo.service'
import type { Mdo, MdoDropdownWarehouse, MdoDropdownDock, MdoDropdownMpo, MdoDropdownVehicle, MdoPreviewSplit } from '../../types/material/mdo'

export const useMdoStore = defineStore('mdo', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const orders = ref<Mdo[]>([])
  const detail = ref<Mdo | null>(null)
  const warehouses = ref<MdoDropdownWarehouse[]>([])
  const docks = ref<MdoDropdownDock[]>([])
  const mpoItems = ref<MdoDropdownMpo[]>([])
  const vehicles = ref<MdoDropdownVehicle[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Backend returns: total, page, limit, total_pages (not totalPages)
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  })

  // ─── State khusus list bawah yang dipaginate ───────────────────────────────
  // SENGAJA DIPISAH dari `orders`/`meta`/`loading` di atas. `orders` dipakai
  // oleh Timeline Gantt dan HARUS selalu lengkap (semua MDO pada rentang
  // tanggal terpilih) agar staf gudang tidak salah baca jadwal dock akibat
  // data yang terpotong pagination. List bawah ini boleh dipotong per halaman
  // karena cuma untuk kenyamanan scroll, bukan sumber kebenaran visual jadwal.
  const paginatedOrders = ref<Mdo[]>([])
  const loadingList = ref(false)
  const listMeta = ref({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  })

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function fetchMdoList(params: MdoParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await mdoService.getMdoList(params)
      const data = response.data
      if (data.status) {
        orders.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.total,
          total_pages: data.data.total_pages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching MDO list:', e)
    } finally {
      loading.value = false
    }
  }

  // Fetch khusus untuk list bawah yang dipaginate. Tidak menyentuh `orders`
  // atau `loading` milik Timeline Gantt — keduanya independen secara sengaja.
  async function fetchMdoListPaginated(params: MdoParams = {}) {
    loadingList.value = true
    error.value = null
    try {
      const response = await mdoService.getMdoList(params)
      const data = response.data
      if (data.status) {
        paginatedOrders.value = data.data.rows
        listMeta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.total,
          total_pages: data.data.total_pages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching paginated MDO list:', e)
    } finally {
      loadingList.value = false
    }
  }

  async function fetchMdoById(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mdoService.getMdoById(id)
      const data = response.data
      if (data.status) {
        detail.value = data.data
      }
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error fetching MDO ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdownWarehouses() {
    try {
      const response = await mdoService.getDropdownWarehouses()
      const data = response.data
      if (data.status) warehouses.value = data.data
    } catch (e: any) {
      console.error('Error fetching warehouses dropdown:', e)
    }
  }

  // Docks require `date` param from backend
  async function fetchDropdownDocks(params: { date: string; exclude_id?: number | string }) {
    try {
      const response = await mdoService.getDropdownDocks(params)
      const data = response.data
      if (data.status) docks.value = data.data
    } catch (e: any) {
      console.error('Error fetching docks dropdown:', e)
    }
  }

  async function fetchDropdownMpo(params?: { search?: string }) {
    try {
      const response = await mdoService.getDropdownMpo(params)
      const data = response.data
      if (data.status) mpoItems.value = data.data
    } catch (e: any) {
      console.error('Error fetching MPO dropdown:', e)
    }
  }

  // Vehicles require `date` param from backend
  async function fetchDropdownVehicles(params: { date: string; exclude_id?: number | string }) {
    try {
      const response = await mdoService.getDropdownVehicles(params)
      const data = response.data
      if (data.status) vehicles.value = data.data
    } catch (e: any) {
      console.error('Error fetching vehicles dropdown:', e)
    }
  }

  async function previewSplit(params: MdoPreviewSplitParams): Promise<MdoPreviewSplit | null> {
    try {
      const response = await mdoService.previewSplit(params)
      const data = response.data
      if (data.status) return data.data as MdoPreviewSplit
      return null
    } catch (e: any) {
      console.error('Error fetching preview split:', e)
      return null
    }
  }

  async function createMdo(data: MdoCreatePayload) {
    loading.value = true
    error.value = null
    try {
      const response = await mdoService.createMdo(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error creating MDO:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMdo(id: number | string, data: Partial<MdoCreatePayload> & { save_as?: 'draft' | 'scheduled' }) {
    loading.value = true
    error.value = null
    try {
      const response = await mdoService.updateMdo(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error updating MDO ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteMdo(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mdoService.deleteMdo(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error deleting MDO ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Advances status: scheduled → in_transit → arrived
  async function advanceMdoStatus(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await mdoService.advanceMdoStatus(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error(`Error advancing MDO status ${id}:`, e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    orders,
    detail,
    warehouses,
    docks,
    mpoItems,
    vehicles,
    loading,
    error,
    meta,
    // State list bawah (dipaginate, terpisah dari Gantt)
    paginatedOrders,
    loadingList,
    listMeta,
    // Actions
    fetchMdoList,
    fetchMdoListPaginated,
    fetchMdoById,
    fetchDropdownWarehouses,
    fetchDropdownDocks,
    fetchDropdownMpo,
    fetchDropdownVehicles,
    previewSplit,
    createMdo,
    updateMdo,
    deleteMdo,
    advanceMdoStatus,
  }
})