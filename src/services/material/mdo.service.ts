// services/material/mdo.service.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../../plugins/axios'

export interface MdoParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  start_date?: string
  end_date?: string
  mpo_id?: number | string
  [key: string]: any
}

export interface MdoPreviewSplitParams {
  mpo_id: number | string
  vehicle_id: number | string
  exclude_mdo_id?: number | string
}

// Backend body uses: mpo_id, dock_id, target_date, target_time,
// vehicle_id, transporter, description, remarks, save_as, details[]
export interface MdoCreatePayload {
  mpo_id: number
  dock_id?: number | null
  target_date: string
  target_time?: string | null
  vehicle_id?: number | null
  transporter?: string | null
  description?: string | null
  remarks?: string | null
  save_as?: 'draft' | 'scheduled'
  details: { part_id: number; qty: number; notes?: string | null }[]
}

const BASE = '/material/mdo'

const mdoService = {
  getMdoList(params?: MdoParams) {
    return api.get(`${BASE}/`, { params })
  },

  getMdoById(id: number | string) {
    return api.get(`${BASE}/${id}`)
  },

  getDropdownWarehouses() {
    return api.get(`${BASE}/dd-warehouses`)
  },

  // Backend requires `date` param (not `target_date`), and optionally `exclude_id`
  getDropdownDocks(params: { date: string; exclude_id?: number | string }) {
    return api.get(`${BASE}/dd-docks`, { params })
  },

  getDropdownMpo(params?: { search?: string }) {
    return api.get(`${BASE}/dd-mpo`, { params })
  },

  // Backend requires `date` param, and optionally `exclude_id`
  getDropdownVehicles(params: { date: string; exclude_id?: number | string }) {
    return api.get(`${BASE}/dd-vehicles`, { params })
  },

  getDropdownStatuses() {
    return api.get(`${BASE}/dd-status`)
  },

  // GET /preview-split?mpo_id=&vehicle_id=&exclude_mdo_id=
  previewSplit(params: MdoPreviewSplitParams) {
    return api.get(`${BASE}/preview-split`, { params })
  },

  createMdo(data: MdoCreatePayload) {
    return api.post(`${BASE}/`, data)
  },

  updateMdo(id: number | string, data: Partial<MdoCreatePayload> & { save_as?: 'draft' | 'scheduled' }) {
    return api.put(`${BASE}/${id}`, data)
  },

  deleteMdo(id: number | string) {
    return api.delete(`${BASE}/${id}`)
  },

  // Advances status: scheduled → in_transit → arrived
  // Note: 'draft' → 'scheduled' is done via createMdo/updateMdo with save_as='scheduled'
  advanceMdoStatus(id: number | string) {
    return api.put(`${BASE}/${id}/status`, {})
  },
}

export default mdoService