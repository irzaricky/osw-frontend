import { ref, watch, type Ref } from 'vue'
import userService from '../../../../services/master-data/user.service'

export interface DropdownOption {
  id: number
  name: string
}

/**
 * Shared composable for fetching dropdown data (roles, divisions, factories, lines).
 * Reusable across any page that needs these dropdowns.
 *
 * @param factoryId - Optional reactive ref. When provided, lines auto-fetch when factoryId changes.
 */
export function useUserDropdowns(factoryId?: Ref<number | undefined>) {
  const roles = ref<DropdownOption[]>([])
  const divisions = ref<DropdownOption[]>([])
  const factories = ref<DropdownOption[]>([])
  const lines = ref<DropdownOption[]>([])

  async function fetchDropdowns() {
    try {
      const [rolesRes, factoriesRes, divisionsRes] = await Promise.all([
        userService.getRoles(),
        userService.getFactories(),
        userService.getDivisions()
      ])
      if (rolesRes.data.status) roles.value = rolesRes.data.data
      if (factoriesRes.data.status) factories.value = factoriesRes.data.data
      if (divisionsRes.data.status) divisions.value = divisionsRes.data.data
    } catch (err) {
      console.error('Error fetching dropdowns:', err)
    }
  }

  async function fetchLines(id: number) {
    try {
      const res = await userService.getLines(id)
      if (res.data.status) lines.value = res.data.data
    } catch (err) {
      lines.value = []
      console.error('Error fetching lines:', err)
    }
  }

  // Auto-fetch lines when factoryId changes
  if (factoryId) {
    watch(factoryId, (newVal) => {
      if (newVal) fetchLines(newVal)
      else lines.value = []
    })
  }

  return {
    roles,
    divisions,
    factories,
    lines,
    fetchDropdowns,
    fetchLines
  }
}
