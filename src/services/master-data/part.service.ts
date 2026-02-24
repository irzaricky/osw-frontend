import { api } from '../../plugins/axios'

export type PartDropdown = {
  id: number
  part_number: string
  part_name: string
}

export interface PartDropdownParams {
  search?: string
}

const partService = {
  dropdown(params?: PartDropdownParams) {
    return api.get('/master-data/parts/dropdown', { params })
  }
}

export default partService