import { api } from '../../plugins/axios'
import type { Dock } from '../../types/master-data/dock'

export interface DockParams {
  page?: number
  limit?: number
  search?: string
  area_id?: number
  [key: string]: any
}

const dockService = {
  getDropdown() {
    return api.get('/master-data/docks/dropdown')
  },
  getDocks(params?: DockParams) {
    return api.get('/master-data/docks', { params })
  },
  createDock(data: Partial<Dock>) {
    return api.post('/master-data/docks', data)
  },
  updateDock(id: number | string, data: Partial<Dock>) {
    return api.put(`/master-data/docks/${id}`, data)
  },
  deleteDock(id: number | string) {
    return api.delete(`/master-data/docks/${id}`)
  }
}

export default dockService