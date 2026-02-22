import { api } from '../../plugins/axios'

export interface WarehouseBinParams {
  page?: number
  limit?: number
  search?: string
  area_id?: number
  [key: string]: any
}

export type WarehouseBin = {
  id: number
  area_id: number
  row_index: number
  col_index: number
  bin_code: string
  is_dedicated?: boolean
  dedicated_part_number?: string | null
  capacity?: number | null
}

const BASE = '/master-data/warehouse_bins' 

const warehouseBinService = {
  list(params?: WarehouseBinParams) {
    return api.get(BASE, { params })
  }
}

export default warehouseBinService