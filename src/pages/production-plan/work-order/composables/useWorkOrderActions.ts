import { reactive } from 'vue'
import { useWorkOrderStore } from '../../../../stores/production-plan/work-order.store'
import { useAppToast }       from '../../../../composables/useAppToast'
import type { WorkOrder }    from '../../../../types/production-plan/work-order'

export function useWorkOrderActions(onRefresh: () => void) {
  const store              = useWorkOrderStore()
  const { toastSuccess, toastError } = useAppToast()

  const confirm = reactive({
    open:         false,
    title:        '',
    description:  '',
    confirmLabel: 'Confirm',
    confirmColor: 'primary' as 'primary' | 'error' | 'success',
    action:       null as (() => Promise<void>) | null,
  })

  function openConfirm(opts: {
    title:        string
    description:  string
    confirmLabel?: string
    confirmColor?: 'primary' | 'error' | 'success'
    action:       () => Promise<void>
  }) {
    confirm.title        = opts.title
    confirm.description  = opts.description
    confirm.confirmLabel = opts.confirmLabel ?? 'Confirm'
    confirm.confirmColor = opts.confirmColor ?? 'primary'
    confirm.action       = opts.action
    confirm.open         = true
  }

  function closeConfirm() {
    confirm.open   = false
    confirm.action = null
  }

  async function handleStart(wo: WorkOrder) {
    openConfirm({
      title:        'Start Work Order',
      description:  `Start WO "${wo.wo_number}"? Status will change to In Progress and the first station will be activated.`,
      confirmLabel: 'Start',
      confirmColor: 'primary',
      action:       async () => {
        try {
          const res = await store.startWorkOrder(wo.id)
          toastSuccess(res.message || 'Work Order started')
          closeConfirm()
          onRefresh()
        }
        catch (e) { toastError(e); closeConfirm() }
      },
    })
  }

  return { confirm, openConfirm, closeConfirm, handleStart }
}