import { api } from '../../plugins/axios'

export interface TransactionActivityParams {
  page?: number
  limit?: number
  search?: string
  activity_type?: 'IN' | 'OUT'
  wo_category?: string
  wo_type_id?: number
  warehouse_area_id?: number
  bin_id?: number
  part_number?: string
  label_number?: string
  user_id?: number
  date_from?: string
  date_to?: string
  [key: string]: any
}

const transactionActivityService = {
  getTransactionActivities(params?: TransactionActivityParams) {
    return api.get('/warehouse/transaction-activity', { params })
  },

  getTransactionActivityDetail(id: number | string) {
    return api.get(`/warehouse/transaction-activity/${id}`)
  }
}

export default transactionActivityService