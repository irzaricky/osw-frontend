<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs }    from 'pinia'
import { useRouter }      from 'vue-router'
import { useWorkOrderStore }   from '../../../stores/production-plan/work-order.store'
import { useWorkOrderColumns } from './composables/useWorkOrderColumns'
import { useWorkOrderFilters } from './composables/useWorkOrderFilters'
import { useWorkOrderActions } from './composables/useWorkOrderActions'
import { useAppToast }         from '../../../composables/useAppToast'
import type { WorkOrder }      from '../../../types/production-plan/work-order'

import Breadcrumbs    from '../../../components/Breadcrumbs.vue'
import ConfirmDialog  from '../../../components/ConfirmDialog.vue'
import WOFilters      from './components/WOFilters.vue'
import WODailySummary from './components/WODailySummary.vue'

const router  = useRouter()
const woStore = useWorkOrderStore()
const { workOrders, meta, loading, dailySummary } = storeToRefs(woStore)
const { toastSuccess, toastError } = useAppToast()

const table        = useTemplateRef('table')
const rowSelection = ref({})

const ui = {
  UCheckbox:    resolveComponent('UCheckbox') as any,
  UButton:      resolveComponent('UButton')   as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge:       resolveComponent('UBadge')    as any,
}

const selectedCount = computed((): number =>
  (table.value as any)?.tableApi?.getFilteredSelectedRowModel().rows.length || 0,
)

async function fetchData() {
  await woStore.fetchWorkOrders({
    page:      meta.value.page,
    limit:     meta.value.limit,
    search:    search.value || undefined,
    status:    filters.status,
    work_date: filters.work_date,
    line_id:   filters.line_id,
    shift_id:  filters.shift_id,
    stage:     filters.stage,
  })
}

const { search, filters, debouncedSearch, resetFilters } = useWorkOrderFilters(fetchData)

const {
  confirm,
  handleStart,
} = useWorkOrderActions(() => fetchData())

const { columns } = useWorkOrderColumns(
  {
    onView:  (wo) => router.push(`/production-plan/work-order/${wo.id}`),
    onStart: (wo) => handleStart(wo),
  },
  ui,
)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Manufacturing' },
  { label: 'Work Orders' },
]

const summaryDate = ref(new Date().toISOString().split('T')[0])

async function refreshSummary() {
  await woStore.fetchDailySummary({ work_date: summaryDate.value })
}

watch(summaryDate, refreshSummary)

onMounted(async () => {
  await Promise.all([fetchData(), refreshSummary()])
})
</script>

<template>
  <UDashboardPanel id="work-orders">
    <template #header>
      <UDashboardNavbar title="Work Orders">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-2xl font-bold">Work Orders</h1>
            <p class="text-sm text-muted mt-0.5">Manage and monitor shop floor Work Orders</p>
          </div>
        </div>

        <WODailySummary
          v-model:work-date="summaryDate"
          :summary="dailySummary"
          :loading="loading"
          @refresh="refreshSummary"
        />

        <WOFilters
          :search="search"
          :filters="filters"
          @update:search="search = $event; debouncedSearch()"
          @update:filters="Object.assign(filters, $event)"
          @reset="resetFilters"
        />

        <div v-if="selectedCount > 0" class="flex items-center gap-3 px-4 py-2.5 bg-elevated border border-default rounded-lg">
          <span class="text-sm font-medium">{{ selectedCount }} selected</span>
          <UButton label="Clear Selection" color="neutral" variant="ghost" size="xs" @click="rowSelection = {}" />
        </div>

        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="workOrders"
          :columns="columns"
          :loading="loading"
          class="w-full"
        />

        <div
          v-if="!loading && workOrders.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center text-muted gap-3"
        >
          <UIcon name="i-lucide-clipboard-x" class="w-10 h-10" />
          <div>
            <p class="text-sm font-medium">No Work Orders found</p>
            <p class="text-xs mt-1">Try adjusting your filters or search.</p>
          </div>
          <UButton label="Reset Filters" color="neutral" variant="soft" size="sm" @click="resetFilters" />
        </div>

        <div
          v-if="meta.total > 0"
          class="flex items-center justify-between gap-3 border-t border-default pt-4"
        >
          <div class="text-sm text-muted">
            {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
            of {{ meta.total }} row(s)
          </div>
          <UPagination
            v-model:page="meta.page"
            :total="meta.total"
            :items-per-page="meta.limit"
            @update:page="fetchData"
          />
        </div>

        <ConfirmDialog
          v-model:open="confirm.open"
          :title="confirm.title"
          :description="confirm.description"
          :confirm-label="confirm.confirmLabel"
          :loading="woStore.saving"
          @confirm="confirm.action?.()"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>