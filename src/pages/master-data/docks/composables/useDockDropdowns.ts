import { ref } from 'vue'
import dockService from '../../../../services/master-data/dock.service'

export interface DropdownOption {
  id: number
  name: string
}

/**
 * Composable for fetching warehouse dropdown data.
 */
export function useDockDropdowns() {
  const areas = ref<DropdownOption[]>([])

  async function fetchAreas() {
    try {
      const res = await dockService.getAreasDropdown()
      if (res.data.status) {
        areas.value = res.data.data
      }
    } catch (err) {
      console.error('Error fetching areas:', err)
    }
  }

  return {
    areas,
    fetchAreas
  }
}