import { api } from '../../plugins/axios'

export interface StationBufferParams {
  station_id?: number
  part_id?: number
  transaction_type?: 'IN' | 'OUT' | 'SCRAP'
  [key: string]: any
}

export interface BufferPayload {
  station_id: number
  part_id: number
  qty_kanban: number
  qty_pcs: number
  remarks?: string
}

const stationBufferService = {
  getSummary() {
    return api.get('/warehouse/station-buffer/summary')
  },

  getList(params?: StationBufferParams) {
    return api.get('/warehouse/station-buffer', { params })
  },

  getLogs(params?: StationBufferParams) {
    return api.get('/warehouse/station-buffer/logs', { params })
  },

  manualIn(data: BufferPayload) {
    return api.post('/warehouse/station-buffer/manual-in', data)
  },

  useBuffer(data: BufferPayload) {
    return api.post('/warehouse/station-buffer/use', data)
  },

  scrapBuffer(data: BufferPayload) {
    return api.post('/warehouse/station-buffer/scrap', data)
  },

getStationDropdown() {
    return api.get('/master-data/stations/dropdown')
    },

    getPartDropdown() {
  return api.get('/warehouse/station-buffer/dropdown/parts')
}

}

export default stationBufferService