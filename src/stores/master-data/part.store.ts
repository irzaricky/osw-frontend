import { defineStore } from 'pinia'
import partService, { type PartDropdown } from '../../services/master-data/part.service'

export const usePartStore = defineStore('part', {
  state: () => ({
    parts: [] as PartDropdown[],
    loading: false
  }),

  actions: {
    async fetchPartsDropdown(params?: { search?: string }) {
      try {
        this.loading = true
        const res = await partService.dropdown(params)
        if (res.data?.status) this.parts = res.data.data || []
      } finally {
        this.loading = false
      }
    }
  }
})