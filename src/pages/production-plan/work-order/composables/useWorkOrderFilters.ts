// composables/useWorkOrderFilters.ts
//
// [PERUBAHAN] Tambah field `shift_id` ke objek filters agar bisa digunakan
// sebagai query param saat memanggil fetchWorkOrders dari halaman List.

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
    shift_id:  undefined as number | undefined,   // [BARU] filter shift
  })

  const debouncedSearch = useDebounceFn(() => onFetch(), 300)

  function resetFilters() {
    search.value      = ''
    filters.status    = undefined
    filters.work_date = undefined
    filters.line_id   = undefined
    filters.po_id     = undefined
    filters.shift_id  = undefined   // [BARU] reset shift filter
    onFetch()
  }

  return { search, filters, debouncedSearch, resetFilters }
}