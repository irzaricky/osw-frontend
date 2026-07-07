import { reactive }          from 'vue'
import { useRouter }          from 'vue-router'
import { useWorkOrderStore }  from '../../../../stores/production-plan/work-order.store'
import { useAppToast }        from '../../../../composables/useAppToast'
import type { WorkOrder }     from '../../../../types/production-plan/work-order'

export function useWorkOrderActions(onRefresh: () => void) {
  const store  = useWorkOrderStore()
  const router = useRouter()
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
    title:         string
    description:   string
    confirmLabel?: string
    confirmColor?: 'primary' | 'error' | 'success'
    action:        () => Promise<void>
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

  // Start dari list page diarahkan ke halaman detail karena memerlukan material check
  // sebelum start (auto-fill actual_quantity dari stok gudang terjadi saat start dipanggil)
  function handleStart(wo: WorkOrder) {
    router.push(`/production-plan/work-order/${wo.id}`)
  }

  return { confirm, openConfirm, closeConfirm, handleStart }
}