import { api } from '../../plugins/axios'

export type PartDropdown = {
  id: number
  part_number: string
  part_name: string
  part_type_code?: string | null
}

const BASE = '/master-data/parts'

const partService = {
  dropdown(params?: Record<string, any>) {
    return api.get(`${BASE}/dropdown`, { params })
  }
}

export default partService