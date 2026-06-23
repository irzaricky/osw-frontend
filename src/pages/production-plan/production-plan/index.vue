<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useProductionPlanColumns } from './composables/useProductionPlanColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { ProductionPlan, PlanType } from '../../../types/production-plan/plan'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import PlanFilters from './components/PlanFilters.vue'

const router    = useRouter()
const planStore = useProductionPlanStore()
const { plans, meta, loading } = storeToRefs(planStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox:    resolveComponent('UCheckbox') as any,
  UButton:      resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge:       resolveComponent('UBadge') as any,
}

const { columns } = useProductionPlanColumns(
  {
    onView:   (plan) => router.push(`/production-plan/plan/${plan.id}`),
    onDelete: confirmDelete,
  },
  ui,
)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Plan Capacity' },
]

const search  = ref('')
// [+] tambah plan_month ke filters
const filters = reactive({
  status:         undefined as string | undefined,
  overall_status: undefined as string | undefined,
  plan_month:     undefined as string | undefined,
  plan_type:      undefined as PlanType | undefined,
})

const rowSelection = ref({})

const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const confirm = reactive({
  open:        false,
  title:       '',
  description: '',
  action:      null as (() => Promise<void>) | null,
})

function resetFilters() {
  search.value        = ''
  filters.status      = undefined
  filters.overall_status  = undefined
  filters.plan_month  = undefined
  filters.plan_type   = undefined
  meta.value.page     = 1
  fetchData()
}

// [+] plan_month ikut dikirim ke fetchPlans
async function fetchData() {
  await planStore.fetchPlans({
    page:           meta.value.page,
    limit:          meta.value.limit,
    search:         search.value || undefined,
    status:         filters.status as any,
    overall_status: filters.overall_status as any,
    plan_month:     filters.plan_month,
    plan_type:      filters.plan_type,
  })
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

function confirmDelete(plan: ProductionPlan) {
  confirm.title       = 'Delete Production Plan'
  confirm.description = `Are you sure you want to delete plan "${plan.plan_number}"? This action cannot be undone.`
  confirm.action      = async () => {
    try {
      const res = await planStore.deletePlan(plan.id)
      toastSuccess(res.message || 'Plan deleted')
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

function confirmBulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!rows.length) return
  confirm.title       = 'Delete Selected Plans'
  confirm.description = `Are you sure you want to delete ${rows.length} plan(s)? This action cannot be undone.`
  confirm.action      = async () => {
    try {
      await Promise.all(rows.map((r: Row<ProductionPlan>) => planStore.deletePlan(r.original.id)))
      toastSuccess(`${rows.length} plans deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <UDashboardPanel id="plan-capacity">
    <template #header>
      <UDashboardNavbar title="Production Plan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold">
              Production Capacity Planning
            </h1>
            <p class="text-sm text-muted mt-0.5">
              Manage production capacity and delivery order planning
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            label="New Plan"
            @click="router.push('/production-plan/plan/create')"
          />
        </div>

        <PlanFilters
          :search="search"
          :filters="filters"
          @update:search="search = $event"
          @update:filters="Object.assign(filters, $event)"
        />

        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="loading ? [] : plans"
          :columns="columns"
          :loading="loading"
          class="w-full"
        />

        <div
          v-if="!loading && plans.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center text-muted gap-3"
        >
        <UIcon name="i-lucide-clipboard-x" class="w-10 h-10" />
          <div>
            <p class="text-sm font-medium">No Plans found</p>
            <p class="text-xs mt-1">Try adjusting your filters or search.</p>
          </div>
          <UButton label="Reset Filters" color="neutral" variant="soft" size="sm" @click="resetFilters" />
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
          <div class="text-sm text-muted">
            {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }} row(s)
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
          confirm-label="Delete"
          :loading="loading"
          @confirm="confirm.action?.()"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>