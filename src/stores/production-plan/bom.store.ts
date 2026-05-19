import { defineStore } from 'pinia'
import { ref } from 'vue'
import bomService from '../../services/production-plan/bom.service'
import type {
  Bom,
  BomDocStatus,
  BomActivationStatus,
  BomDropdownItem,
  BomListParams,
  CreateBomPayload,
  UpdateBomPayload,
  AddBomDetailPayload,
  UpdateBomDetailPayload,
  RejectPayload,
} from '../../types/production-plan/bom'

export const useBomStore = defineStore('bom', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const boms                = ref<Bom[]>([])
  const currentBom          = ref<Bom | null>(null)
  const dropdown            = ref<BomDropdownItem[]>([])
  const docStatuses         = ref<BomDocStatus[]>([])
  const activationStatuses  = ref<BomActivationStatus[]>([])

  const meta    = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const saving  = ref(false)
  const error   = ref<string | null>(null)

  // ── List & Detail ──────────────────────────────────────────────────────────

  async function fetchBoms(params: BomListParams = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await bomService.getBoms(params)
      if (data.status) {
        boms.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages,
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchBom(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await bomService.getBom(id)
      if (data.status) currentBom.value = data.data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Reference data ─────────────────────────────────────────────────────────

  async function fetchDocStatuses() {
    try {
      const { data } = await bomService.getDocStatuses()
      if (data.status) docStatuses.value = data.data
    } catch (e: any) {
      console.error('[bomStore] fetchDocStatuses:', e)
    }
  }

  async function fetchActivationStatuses() {
    try {
      const { data } = await bomService.getActivationStatuses()
      if (data.status) activationStatuses.value = data.data
    } catch (e: any) {
      console.error('[bomStore] fetchActivationStatuses:', e)
    }
  }

  async function fetchDropdown() {
    try {
      const { data } = await bomService.getDropdown()
      if (data.status) dropdown.value = data.data
    } catch (e: any) {
      console.error('[bomStore] fetchDropdown:', e)
    }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function createBom(payload: CreateBomPayload) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.createBom(payload)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  /**
   * Update header BOM — bisa sekaligus replace details.
   *
   * Contoh: hanya update header
   *   updateBom(id, { description: 'Revisi' })
   *
   * Contoh: update header + replace semua detail sekaligus
   *   updateBom(id, { description: 'Revisi', details: [...] })
   *
   * Contoh: hanya replace detail tanpa ubah header
   *   updateBom(id, { details: [...] })
   */
  async function updateBom(id: number | string, payload: UpdateBomPayload) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.updateBom(id, payload)
      // Re-fetch agar currentBom ter-update termasuk relasi details
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deleteBom(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.deleteBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── BOM Details (single-row) ───────────────────────────────────────────────
  // Gunakan ini jika FE perlu operasi baris per baris.
  // Untuk save semua detail sekaligus, gunakan updateBom() dengan field details[].

  async function addDetail(id: number | string, payload: AddBomDetailPayload) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.addDetail(id, payload)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function updateDetail(
    id: number | string,
    detailId: number | string,
    payload: UpdateBomDetailPayload,
  ) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.updateDetail(id, detailId, payload)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deleteDetail(id: number | string, detailId: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.deleteDetail(id, detailId)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  // ── Workflow ───────────────────────────────────────────────────────────────
  async function returnToDraft(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.returnToDraft(id)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function submit(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.submit(id)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function approve(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.approve(id)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function reject(id: number | string, payload: RejectPayload) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.reject(id, payload)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function activate(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.activate(id)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deactivate(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.deactivate(id)
      if (data.status) await fetchBom(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function newVersion(id: number | string) {
    saving.value = true
    error.value = null
    try {
      const { data } = await bomService.newVersion(id)
      return data
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message
      throw e
    } finally {
      saving.value = false
    }
  }

  function clearCurrentBom() {
    currentBom.value = null
  }

  return {
    // state
    boms, currentBom, dropdown, docStatuses, activationStatuses,
    meta, loading, saving, error,
    // actions
    fetchBoms, fetchBom,
    fetchDocStatuses, fetchActivationStatuses, fetchDropdown,
    createBom, updateBom, deleteBom,
    addDetail, updateDetail, deleteDetail,
    returnToDraft, submit, approve, reject,
    activate, deactivate, newVersion,
    clearCurrentBom,
  }
})