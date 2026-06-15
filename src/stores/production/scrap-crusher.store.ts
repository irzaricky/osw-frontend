import { defineStore } from 'pinia'
import productionMaterialControlService from '../../services/production/production-material-control.service'

export const useScrapCrusherStore = defineStore('scrapCrusher', {
  state: () => ({
    scraps: [] as any[],
    loading: false,
    meta: {
      page: 1,
      limit: 10,
      total: 0
    }
  }),

  actions: {
    async fetchScraps(params: Record<string, any> = {}) {
      this.loading = true

      try {
        const res = await productionMaterialControlService.getScraps(params)

        this.scraps = res.data.data || []
        this.meta = {
          page: res.data.meta?.page || 1,
          limit: res.data.meta?.limit || 10,
          total: res.data.meta?.total || 0
        }
      } finally {
        this.loading = false
      }
    },

    async createScrap(data: any) {
      return productionMaterialControlService.createScrap(data)
    }
  }
})