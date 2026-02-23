import { api } from '../../plugins/axios'
import type { Line } from '../../types/master-data/line'

export interface LineParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const lineService = {
  getLines(params?: LineParams) {
    return api.get('/master-data/lines/', { params })
  },

  getLineById(id: number | string) {
    return api.get(`/master-data/lines/${id}`)
  },

  getDropdown() {
    return api.get('/master-data/lines/dropdown')
  },

  createLine(data: Partial<Line>) {
    return api.post('/master-data/lines/', data)
  },

  updateLine(id: number | string, data: Partial<Line>) {
    return api.put(`/master-data/lines/${id}`, data)
  },

  deleteLine(id: number | string) {
    return api.delete(`/master-data/lines/${id}`)
  },

  downloadLines(params?: LineParams) {
    return api.get('/master-data/lines/download', { params, responseType: 'blob' })
  },

  uploadLines(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/master-data/lines/upload', formData, {
      headers: { 'Content-Type': null }
    })
  }
}

export default lineService