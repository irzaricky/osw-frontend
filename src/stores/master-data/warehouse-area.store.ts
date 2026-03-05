import { defineStore } from 'pinia'
import type { WarehouseArea, WarehouseAreaPayload } from '../../types'
import warehouseAreaService from '../../services/master-data/warehouse-area.service'

interface Meta {
  page: number
  limit: number
  total: number
}

export const useWarehouseAreaStore = defineStore('warehouseArea', {
  state: () => ({
    areas: [] as WarehouseArea[],
    dropdown: [] as Pick<WarehouseArea, 'id' | 'area_code' | 'name' | 'warehouse_id'>[],
    meta: {
      page: 1,
      limit: 10,
      total: 0
    } as Meta,
    loading: false
  }),

  actions: {
    async fetchDropdown(params?: Record<string, any>) {
      try {
        const res = await warehouseAreaService.getDropdown(params)

        if (res.data.status) {
          this.dropdown = res.data.data
        }

        return res.data
      } catch (error: any) {
        console.error('Error fetching warehouse area dropdown:', error)
      }
    },

    async fetchAreas(params?: Record<string, any>) {
      try {
        this.loading = true

        const res = await warehouseAreaService.getWarehouseAreas(params)

        if (res.data.status) {
          this.areas = res.data.data.rows
          this.meta = {
            page: res.data.data.page,
            limit: res.data.data.limit,
            total: res.data.data.count
          }
        }

        return res.data
      } finally {
        this.loading = false
      }
    },

    async createArea(payload: WarehouseAreaPayload) {
      try {
        this.loading = true
        const res = await warehouseAreaService.createWarehouseArea(payload)
        return res.data
      } finally {
        this.loading = false
      }
    },

    async updateArea(id: number, payload: WarehouseAreaPayload) {
      try {
        this.loading = true
        const res = await warehouseAreaService.updateWarehouseArea(id, payload)
        return res.data
      } finally {
        this.loading = false
      }
    },

    async deleteArea(id: number) {
      try {
        this.loading = true
        const res = await warehouseAreaService.deleteWarehouseArea(id)
        return res.data
      } finally {
        this.loading = false
      }
    }
  }
})