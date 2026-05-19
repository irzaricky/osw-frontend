<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useProductionPlanStore } from '../../../stores/production-plan/plan.store'
import { useProductionPlanColumns } from './composables/useProductionPlanColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { ProductionPlan } from '../../../types/production-plan/plan'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import PlanFilters from './components/PlanFilters.vue'
import PlanBulkActions from './components/PlanBulkActions.vue'

const router = useRouter()
const planStore = useProductionPlanStore()
const { plans, meta, loading } = storeToRefs(planStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useProductionPlanColumns(
  {
    onView: (plan) => router.push(`/production-plan/plan/${plan.id}`),
    onDelete: confirmDelete,
  },
  ui,
)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Plan' },
]

const search = ref('')
const filters = reactive({
  status: undefined as string | undefined,
  overall_status: undefined as string | undefined,
})

const rowSelection = ref({})

const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

const confirm = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null,
})

async function fetchData() {
  await planStore.fetchPlans({
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value || undefined,
    status: filters.status as any,
    overall_status: filters.overall_status as any,
  })
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)

watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

function confirmDelete(plan: ProductionPlan) {
  confirm.title = 'Delete Production Plan'
  confirm.description = `Are you sure you want to delete plan "${plan.plan_number}"? This action cannot be undone.`
  confirm.action = async () => {
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
  confirm.title = 'Delete Selected Plans'
  confirm.description = `Are you sure you want to delete ${rows.length} plan(s)? This action cannot be undone.`
  confirm.action = async () => {
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
	<UDashboardPanel id="planning">
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
						<h1 class="text-2xl font-bold">Production Plans</h1>
						<p class="text-sm text-muted mt-0.5">Manage production capacity and delivery order planning</p>
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

				<PlanBulkActions :count="selectedCount" @delete="confirmBulkDelete" />

				<UTable
					ref="table"
					v-model:row-selection="rowSelection"
					:data="plans"
					:columns="columns"
					:loading="loading"
					class="w-full"
				/>

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