import { ref } from 'vue'
import auditLogService from '../../../../services/master-data/audit-log.service'

export interface DropdownOption {
  id: number
  name: string
}

export function useLogDropdowns() {
  const modules = ref<DropdownOption[]>([])
  const activities = ref<DropdownOption[]>([])
  const users = ref<DropdownOption[]>([])

  async function fetchDropdowns() {
    try {
      const [modulesRes, activitiesRes, usersRes] = await Promise.all([
        auditLogService.getModules(),
        auditLogService.getActivities(),
        auditLogService.getUsers()
      ])

      if (modulesRes.data.status) modules.value = modulesRes.data.data
      if (activitiesRes.data.status) activities.value = activitiesRes.data.data
      if (usersRes.data.status) users.value = usersRes.data.data
    } catch (err) {
      console.error('Error fetching dropdowns:', err)
    }
  }

  return {
    modules,
    activities,
    users,
    fetchDropdowns
  }
}
