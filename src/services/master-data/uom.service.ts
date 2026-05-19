import { api } from '../../plugins/axios'
import type { UomListParams, CreateUomPayload, UpdateUomPayload } from '../../types/master-data/uom'

// ─────────────────────────────────────────────────────────────────────────────
// UOM service
// Base path: /master-data/uom
// ─────────────────────────────────────────────────────────────────────────────

const uomService = {

  /** GET /master-data/uom/dropdown — active UOMs for select inputs */
  dropdown(search?: string) {
    return api.get('/master-data/uom/dropdown', { params: search ? { search } : undefined })
  },

  /** GET /master-data/uom — paginated list */
  list(params?: UomListParams) {
    return api.get('/master-data/uom', { params })
  },

  /** POST /master-data/uom */
  create(data: CreateUomPayload) {
    return api.post('/master-data/uom', data)
  },

  /** PUT /master-data/uom/:id */
  update(id: number | string, data: UpdateUomPayload) {
    return api.put(`/master-data/uom/${id}`, data)
  },

  /** DELETE /master-data/uom/:id */
  delete(id: number | string) {
    return api.delete(`/master-data/uom/${id}`)
  },
}

export default uomService