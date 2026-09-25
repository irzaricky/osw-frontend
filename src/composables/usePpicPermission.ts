import { useAuthStore } from '../stores/auth.store'

const PPIC_PERMISSIONS = {
  bom: {
    view:    ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'],
    create:  ['Superadmin', 'Staff PPIC'],
    edit:    ['Superadmin', 'Staff PPIC'],
    delete:  ['Superadmin', 'Staff PPIC'],
    approve: ['Superadmin', 'Supervisor PPIC'],
    reject:  ['Superadmin', 'Supervisor PPIC'],
    activate: ['Superadmin', 'Supervisor PPIC'],
  },
  productionPlan: {
    view:    ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'],
    create:  ['Superadmin', 'Staff PPIC'],
    approve: ['Superadmin', 'Supervisor PPIC'],
  },
  masterData: {
    manage:  ['Superadmin', 'Admin PPIC'],
  },
  workOrder: {
    execute: ['Superadmin', 'Foreman'],
    verify:  ['Superadmin', 'Supervisor PPIC'],
  },
} as const

export function usePpicPermission() {
  const authStore = useAuthStore()

  function can<R extends keyof typeof PPIC_PERMISSIONS>(
    resource: R,
    action: keyof typeof PPIC_PERMISSIONS[R],
  ): boolean {
    const userRole = authStore.user?.role?.toLowerCase()
    const allowed = PPIC_PERMISSIONS[resource][action] as readonly string[]
    return allowed.some(r => r.toLowerCase() === userRole)
  }

  function canEditBom(bom: { doc_status: string }): boolean {
    return bom.doc_status === 'draft' && can('bom', 'edit')
  }

  return { can, canEditBom }
}