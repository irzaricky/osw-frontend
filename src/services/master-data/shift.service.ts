import { api } from '../../plugins/axios'
import type { Shift } from '../../types/master-data/shift'

export interface ShiftParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  category?: string
  shift_number?: number
  active?: boolean
  [key: string]: any
}

const shiftService = {
  getDdType() {
    return api.get('/master-data/shifts/dd-type')
  },

  getDdCategory() {
    return api.get('/master-data/shifts/dd-category')
  },

  getDropdown() {
    return api.get('/master-data/shifts/dropdown')
  },

  getShifts(params?: ShiftParams) {
    return api.get('/master-data/shifts/', { params })
  },

  createShift(data: Partial<Shift>) {
    return api.post('/master-data/shifts/', data)
  },

  updateShift(id: number | string, data: Partial<Shift>) {
    return api.put(`/master-data/shifts/${id}`, data)
  },

  deleteShift(id: number | string) {
    return api.delete(`/master-data/shifts/${id}`)
  },

  downloadShifts(params?: ShiftParams) {
    return api.get('/master-data/shifts/download', { params, responseType: 'blob' })
  },

  uploadShifts(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/master-data/shifts/upload', formData, {
      headers: { 'Content-Type': null }
    })
  },
}

export default shiftService