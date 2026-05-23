<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted } from 'vue'
import { useSpoStore } from '../../../stores/sales/spo.store'
import type { Spo } from '../../../types/sales/spo'
import SpoGenerateModal from './components/SpoGenerateModal.vue'
import SpoDetailPanel from './components/SpoDetailPanel.vue'
import SpoKanbanColumn from './components/SpoKanbanColumn.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

// ─── Store ────────────────────────────────────────────────────────────────────
const store = useSpoStore()
const { loading, kanbanSpos } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Purchase Order' }
]

// ─── Filters ──────────────────────────────────────────────────────────────────
const searchFilter = ref('')

const STATUS_ORDER = ['Draft', 'Submitted', 'Locked', 'Processing', 'Completed']

function fetchData(reset = false) {
  if (reset) store.resetKanban()
  STATUS_ORDER.forEach(status => {
    store.fetchKanbanByStatus(status, { search: searchFilter.value }, false)
  })
}

const debouncedSearch = useDebounceFn(() => {
  fetchData(true)
}, 300)

watch(searchFilter, debouncedSearch)

// ─── Selection & Modal ────────────────────────────────────────────────────────
const selectedSpoId = ref<number | null>(null)
const isDetailOpen = ref(false)

const selectedSpoData = computed(() => {
  for (const status of STATUS_ORDER) {
    const found = (kanbanSpos.value[status] || []).find(s => s.id === selectedSpoId.value)
    if (found) return found
  }
  return null
})

function selectSpo(spo: Spo) {
  selectedSpoId.value = spo.id
  isDetailOpen.value = true
}

// ─── Generate Modal ───────────────────────────────────────────────────────────
const isGenerateOpen = ref(false)

async function handleSave(data: FormData) {
  try {
    const res = await store.createSpo(data)
    toastSuccess(`SPO ${res?.data?.spo_number || ''} generated successfully`)
    isGenerateOpen.value = false
    fetchData(true)
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDialog = ref({
  open: false,
  title: '',
  description: '',
  id: 0
})

function handleDelete(id: number) {
  confirmDialog.value = {
    open: true,
    title: 'Delete SPO',
    description: 'Are you sure you want to delete this SPO? This action cannot be undone.',
    id
  }
}

async function handleConfirm() {
  try {
    await store.deleteSpo(confirmDialog.value.id)
    toastSuccess('SPO deleted successfully')
    if (selectedSpoId.value === confirmDialog.value.id) {
      selectedSpoId.value = null
      isDetailOpen.value = false
    }
    fetchData(true)
    confirmDialog.value.open = false
  } catch (e: any) {
    toastError(e)
    confirmDialog.value.open = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchDropdownStatus()
  store.fetchDropdownCustomers()
  fetchData()
})
</script>

<template>
  <div class="flex flex-col h-full bg-default/40">
    <!-- Header -->
    <div class="px-6 pt-6 pb-4 bg-default border-b border-default space-y-4 shrink-0 shadow-sm z-10">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight">
            Sales Purchase Order
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <!-- Filters integrated in header -->
          <div class="flex items-center gap-2 mr-4">
            <UInput
              v-model="searchFilter"
              icon="i-lucide-search"
              placeholder="Search..."
              class="w-64"
              size="sm"
            />
          </div>
          <UButton
            icon="i-lucide-file-plus"
            color="primary"
            label="Generate"
            size="sm"
            @click="isGenerateOpen = true"
          />
        </div>
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <div class="flex gap-6 h-full min-w-max pb-2">
        <SpoKanbanColumn
          v-for="status in STATUS_ORDER"
          :key="status"
          :status="status"
          :search="searchFilter"
          @select="selectSpo"
        />
      </div>
    </div>

    <!-- Detail Modal -->
    <UModal
      v-model:open="isDetailOpen"
      :ui="{
        content: 'sm:max-w-7xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-default/50',
        wrapper: 'flex items-center justify-center p-4'
      }"
    >
      <template #body>
        <div class="flex flex-col h-[70vh] bg-default overflow-hidden relative">
          <SpoDetailPanel
            v-if="selectedSpoId"
            :spo-id="selectedSpoId"
            :spo-summary="selectedSpoData"
            @delete="handleDelete"
            @refresh-list="fetchData(true)"
          />
        </div>
      </template>
    </UModal>

    <!-- Generate Modal -->
    <SpoGenerateModal
      v-model:open="isGenerateOpen"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Confirm Delete -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      confirm-label="Delete"
      :loading="loading"
      @confirm="handleConfirm"
    />
  </div>
</template>
