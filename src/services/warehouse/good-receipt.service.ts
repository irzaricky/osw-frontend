import { api } from '../../plugins/axios'

export interface GoodReceiptParams {
  page?: number
  limit?: number
  search?: string
  status_id?: number
  [key: string]: any
}

const goodReceiptService = {
  // Good Receipt
  getGoodReceipts(params?: GoodReceiptParams) {
    return api.get('/warehouse/good-receipt', { params })
  },
  getGoodReceipt(mr_id: number | string) {
    return api.get(`/warehouse/good-receipt/${mr_id}`)
  },
  approveGoodReceipt(mr_id: number | string, payload?: { remarks?: string }) {
    return api.post(`/warehouse/good-receipt/approve/${mr_id}`, payload)
  }
}

export default goodReceiptService