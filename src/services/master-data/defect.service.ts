import { api } from '../../plugins/axios'
import type { Defect, DefectCategory } from '../../types/master-data/defect'

export interface DefectParams {
  page?: number
  limit?: number
  search?: string
  defect_category_id?: number
  [key: string]: any
}

export interface DefectCategoryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

const defectService = {
  // Dropdown
  getDefectCategoriesDropdown() {
    return api.get('/master-data/defects/categories/dropdown')
  },
  getDropdown() {
    return api.get('/master-data/defects/dropdown')
  },

  // Defects
  getDefects(params?: DefectParams) {
    return api.get('/master-data/defects', { params })
  },
  createDefect(data: Partial<Defect>) {
    return api.post('/master-data/defects', data)
  },
  updateDefect(id: number | string, data: Partial<Defect>) {
    return api.put(`/master-data/defects/${id}`, data)
  },
  deleteDefect(id: number | string) {
    return api.delete(`/master-data/defects/${id}`)
  },

  // Defect Categories
  getDefectCategories(params?: DefectCategoryParams) {
    return api.get('/master-data/defects/categories', { params })
  },
  createDefectCategory(data: Partial<DefectCategory>) {
    return api.post('/master-data/defects/categories', data)
  },
  updateDefectCategory(id: number | string, data: Partial<DefectCategory>) {
    return api.put(`/master-data/defects/categories/${id}`, data)
  },
  deleteDefectCategory(id: number | string) {
    return api.delete(`/master-data/defects/categories/${id}`)
  }
}

export default defectService