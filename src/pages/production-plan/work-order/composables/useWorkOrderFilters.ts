import { reactive, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { WorkOrderStatus } from '../../../../types/production-plan/work-order'

export function useWorkOrderFilters(onFetch: () => void) {
  const search = ref('')

  const filters = reactive({
    status:    undefined as WorkOrderStatus | undefined,
    work_date: undefined as string | undefined,
    line_id:   undefined as number | undefined,
    po_id:     undefined as number | undefined,
  })

  const debouncedSearch = useDebounceFn(() => onFetch(), 300)

  function resetFilters() {
    search.value    = ''
    filters.status    = undefined
    filters.work_date = undefined
    filters.line_id   = undefined
    filters.po_id     = undefined
    onFetch()
  }

  return { search, filters, debouncedSearch, resetFilters }
}