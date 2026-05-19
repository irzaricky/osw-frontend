<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useBomStore } from '../../../stores/production-plan/bom.store'
import { useBomColumns } from './composables/useBomColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Bom } from '../../../types/production-plan/bom'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import BomFilters from './components/BomFilters.vue'
import BomBulkActions from './components/BomBulkActions.vue'

const router = useRouter()
const bomStore = useBomStore()
const { boms, meta, loading, docStatuses, activationStatuses } = storeToRefs(bomStore)
const { toastSuccess, toastError } = useAppToast()

const table = useTemplateRef('table')

const ui = {
  UCheckbox: resolveComponent('UCheckbox') as any,
  UButton: resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge: resolveComponent('UBadge') as any,
}

const { columns } = useBomColumns(
  {
    onReturnToDraft: async (bom) => {
      try {
        const res = await bomStore.returnToDraft(bom.id)
        toastSuccess(res.message || 'BOM returned to draft')
        fetchData()
      } catch (e) { toastError(e) }
    },
    onSubmitForApproval: async (bom) => {
      try {
        const res = await bomStore.submit(bom.id)
        toastSuccess(res.message || 'BOM submitted for approval')
        fetchData()
      } catch (e) { toastError(e) }
    },
    onApprove: async (bom) => {
      try {
        const res = await bomStore.approve(bom.id)
        toastSuccess(res.message || 'BOM approved')
        fetchData()
      } catch (e) { toastError(e) }
    },
    onReject: async (bom) => {
      const reason = prompt('Enter reject reason:')
      if (reason === null) return // Cancelled
      try {
        const res = await bomStore.reject(bom.id, { reject_reason: reason })
        toastSuccess(res.message || 'BOM rejected')
        fetchData()
      } catch (e) { toastError(e) }
    },
    onActivate: async (bom) => {
      try {
        const res = await bomStore.activate(bom.id)
        toastSuccess(res.message || 'BOM activated')
        fetchData()
      } catch (e) { toastError(e) }
    },
    onDeactivate: async (bom) => {
      try {
        const res = await bomStore.deactivate(bom.id)
        toastSuccess(res.message || 'BOM deactivated')
        fetchData()
      } catch (e) { toastError(e) }
    },
    onView: (bom) => router.push(`/production-plan/bom/${bom.id}`),
    onDelete: confirmDelete,
  },
  ui,
)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production Plan' },
  { label: 'Bill of Materials' },
]

// ── Filters ────────────────────────────────────────────────────────────────────
const search = ref('')
const filters = reactive({
  doc_status_id: undefined as number | undefined,
  activation_status_id: undefined as number | undefined,
})

// ── Row selection ──────────────────────────────────────────────────────────────
const rowSelection = ref({})
const selectedCount = computed((): number =>
  table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0,
)

// ── Confirm dialog ─────────────────────────────────────────────────────────────
const confirm = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null,
})

// ── Data fetch ─────────────────────────────────────────────────────────────────
async function fetchData() {
  await bomStore.fetchBoms({
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value || undefined,
    doc_status_id: filters.doc_status_id,
    activation_status_id: filters.activation_status_id,
  })
}

const debouncedSearch = useDebounceFn(() => { meta.value.page = 1; fetchData() }, 300)
watch(search, debouncedSearch)
watch(filters, () => { meta.value.page = 1; fetchData() }, { deep: true })

// ── Delete ─────────────────────────────────────────────────────────────────────
function confirmDelete(bom: Bom) {
  confirm.title = 'Delete BOM'
  confirm.description = `Are you sure you want to delete "${bom.bom_number}" v${bom.bom_version}? This action cannot be undone.`
  confirm.action = async () => {
    try {
      const res = await bomStore.deleteBom(bom.id)
      toastSuccess(res.message || 'BOM deleted')
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

function confirmBulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!rows.length) return
  confirm.title = 'Delete Selected BOMs'
  confirm.description = `Are you sure you want to delete ${rows.length} BOM(s)? This action cannot be undone.`
  confirm.action = async () => {
    try {
      await Promise.all(rows.map((r: Row<Bom>) => bomStore.deleteBom(r.original.id)))
      toastSuccess(`${rows.length} BOM(s) deleted`)
      rowSelection.value = {}
      fetchData()
      confirm.open = false
    } catch (e) { toastError(e); confirm.open = false }
  }
  confirm.open = true
}

// ── Init ───────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchData()
  bomStore.fetchDocStatuses()
  bomStore.fetchActivationStatuses()
})
</script>

<template>
  <UDashboardPanel id="bom">
    <template #header>
      <UDashboardNavbar title="Bill of Materials">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-5">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- Page header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold">Bill of Materials</h1>
            <p class="text-sm text-muted mt-0.5">
              Manage component structures for production
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            label="New BOM"
            @click="router.push('/production-plan/bom/create')"
          />
        </div>

        <!-- Filters -->
        <BomFilters
          :search="search"
          :filters="filters"
          :doc-statuses="docStatuses"
          :activation-statuses="activationStatuses"
          @update:search="search = $event"
          @update:filters="Object.assign(filters, $event)"
        />

        <!-- Bulk actions -->
        <BomBulkActions :count="selectedCount" @delete="confirmBulkDelete" />

        <!-- Table -->
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="boms"
          :columns="columns"
          :loading="loading"
          class="w-full"
        />

        <!-- Pagination -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
          <div class="text-sm text-muted">
            {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{
              Math.min(meta.page * meta.limit, meta.total)
            }} of {{ meta.total }} row(s)
          </div>
          <UPagination
            v-model:page="meta.page"
            :total="meta.total"
            :items-per-page="meta.limit"
            @update:page="fetchData"
          />
        </div>

        <!-- Confirm delete -->
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