<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useMprStore } from '../../../stores/material/mpr.store'
import type { Mpr } from '../../../types/material/mpr'
import MprAddModal from './components/MprAddModal.vue'
import MprDetailPanel from './components/MprDetailPanel.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

// ─── Store ────────────────────────────────────────────────────────────────────
const store = useMprStore()
const { loading, meta, mprs } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Material' },
  { label: 'Purchase Request' }
]

// ─── Filters ──────────────────────────────────────────────────────────────────
const searchFilter = ref('')
const statusFilter = ref<string | undefined>(undefined)
const typeFilter = ref<string | undefined>(undefined)

const statusItems = computed(() => store.statusDropdown)

const typeItems = [
  { value: 'manual', label: 'Manual' },
  { value: 'auto', label: 'Auto' }
]

const selectedStatus = computed({
  get: () => statusFilter.value,
  set: (val) => { statusFilter.value = val }
})

const selectedType = computed({
  get: () => typeFilter.value,
  set: (val) => { typeFilter.value = val }
})

function fetchData() {
  store.fetchMprs({
    page: meta.value.page,
    limit: meta.value.limit,
    search: searchFilter.value,
    status: statusFilter.value,
    type: typeFilter.value
  })
}

const debouncedSearch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(searchFilter, debouncedSearch)
watch([statusFilter, typeFilter], () => {
  meta.value.page = 1
  fetchData()
})

// ─── Grouped List (by Status) ─────────────────────────────────────────────────
const STATUS_ORDER = ['draft', 'submitted', 'approved', 'rejected']

interface GroupedMpr {
  status: string
  items: Mpr[]
}

const groupedMprs = computed<GroupedMpr[]>(() => {
  const map = new Map<string, Mpr[]>()

  mprs.value.forEach(m => {
    if (!map.has(m.status)) map.set(m.status, [])
    map.get(m.status)!.push(m)
  })

  const result: GroupedMpr[] = []
  STATUS_ORDER.forEach(status => {
    if (map.has(status)) {
      result.push({ status, items: map.get(status)! })
    }
  })
  return result
})

// ─── Collapse state ───────────────────────────────────────────────────────────
const collapsedStatuses = reactive<Record<string, boolean>>({})

function toggleStatusCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

// ─── Selected MPR ─────────────────────────────────────────────────────────────
const selectedMprId = ref<number | null>(null)

const selectedMprData = computed(() =>
  mprs.value.find(m => m.id === selectedMprId.value) ?? null
)

function selectMpr(mpr: Mpr) {
  if (selectedMprId.value === mpr.id) return
  selectedMprId.value = mpr.id
}

function getStatusColor(status: string): any {
  const map: Record<string, string> = {
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return map[status] || 'neutral'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected'
  }
  return map[status] || status
}

function getTypeColor(type: string): any {
  return type === 'auto' ? 'info' : 'neutral'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Modal: Add / Edit ────────────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const currentMpr = reactive<Partial<Mpr>>({})

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentMpr, {
    description: '',
    request_date: '',
    type: 'manual',
    details: []
  })
  isModalOpen.value = true
}

function openEditModal(mpr: Mpr) {
  modalMode.value = 'edit'
  const fullDetail = store.detail?.id === mpr.id ? store.detail : mpr
  Object.assign(currentMpr, JSON.parse(JSON.stringify(fullDetail)))
  isModalOpen.value = true
}

async function handleSave(data: Record<string, any>) {
  try {
    if (modalMode.value === 'add') {
      const res = await store.createMpr(data)
      toastSuccess(`MPR ${res?.data?.number || ''} created successfully`)
    } else {
      await store.updateMpr(currentMpr.id!, data)
      toastSuccess('MPR updated successfully')
    }
    isModalOpen.value = false
    fetchData()
    if (modalMode.value === 'edit' && selectedMprId.value === currentMpr.id) {
      await store.fetchMprById(currentMpr.id!)
    }
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDialog = ref({
  open: false,
  title: '',
  description: '',
  id: 0,
  action: 'delete' as const
})

function handleDelete(id: number) {
  confirmDialog.value = {
    open: true,
    title: 'Delete MPR',
    description: 'Are you sure you want to delete this MPR? This action cannot be undone.',
    id,
    action: 'delete'
  }
}

async function handleConfirm() {
  try {
    await store.deleteMpr(confirmDialog.value.id)
    toastSuccess('MPR deleted successfully')
    if (selectedMprId.value === confirmDialog.value.id) {
      selectedMprId.value = null
    }
    fetchData()
    confirmDialog.value.open = false
  } catch (e: any) {
    toastError(e)
    confirmDialog.value.open = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchDropdownStatus()
  store.fetchDropdownParts()
  fetchData()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">
          Material Purchase Request
        </h1>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            label="Create MPR"
            size="sm"
            @click="openAddModal"
          />
        </div>
      </div>
    </div>

    <!-- Master-Detail Body -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- ── Left Panel: List (30%) ── -->
      <div class="w-[30%] min-w-[260px] max-w-sm flex flex-col border-r border-default overflow-hidden">
        <!-- Filters -->
        <div class="p-3 space-y-2 border-b border-default shrink-0">
          <UInput
            v-model="searchFilter"
            icon="i-lucide-search"
            placeholder="Search MPR..."
            class="w-full"
            size="sm"
          />
          <div class="flex gap-2">
            <USelectMenu
              v-model="selectedStatus"
              :items="statusItems"
              placeholder="All Status"
              class="flex-1"
              size="sm"
              clear
            />
            <USelectMenu
              v-model="selectedType"
              :items="typeItems"
              value-key="value"
              label-key="label"
              placeholder="Type"
              class="w-28"
              size="sm"
              clear
            />
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
          <template v-if="groupedMprs.length === 0">
            <div class="p-6 text-center text-sm text-muted">
              <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 opacity-30" />
              No MPRs found.
            </div>
          </template>

          <template v-for="group in groupedMprs" :key="group.status">
            <!-- Status Group Header -->
            <div
              class="sticky top-0 z-10 px-3 py-2 bg-default/95 backdrop-blur border-b border-default flex items-center gap-2 cursor-pointer hover:bg-default/80 transition-colors"
              @click="toggleStatusCollapse(group.status)"
            >
              <UIcon
                :name="collapsedStatuses[group.status] ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                class="w-4 h-4 text-muted transition-transform"
              />
              <UBadge :color="getStatusColor(group.status)" variant="subtle" size="xs">
                {{ getStatusLabel(group.status) }}
              </UBadge>
              <span class="ml-auto text-xs text-muted shrink-0">{{ group.items.length }}</span>
            </div>

            <!-- MPR Items -->
            <div v-show="!collapsedStatuses[group.status]">
              <button
                v-for="mpr in group.items"
                :key="mpr.id"
                class="w-full text-left p-4 border-b border-default/40 hover:bg-elevated/60 transition-colors relative"
                :class="{ 'bg-primary/10 border-l-2 border-l-primary': selectedMprId === mpr.id }"
                @click="selectMpr(mpr)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                      {{ mpr.number }}
                    </span>
                    <p class="text-sm font-bold text-default truncate mt-2">
                      {{ mpr.description }}
                    </p>
                    <div class="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <p class="flex items-center gap-1">
                        <UIcon name="i-lucide-calendar-clock" class="w-3.5 h-3.5" />
                        {{ formatDate(mpr.request_date) }}
                      </p>
                      <UBadge
                        :color="getTypeColor(mpr.type)"
                        variant="subtle"
                        size="xs"
                        class="rounded-full capitalize"
                      >
                        {{ mpr.type }}
                      </UBadge>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </template>
        </div>

        <!-- Pagination -->
        <div class="p-3 border-t border-default shrink-0">
          <div class="text-xs text-muted mb-2">
            {{ meta.total }} MPR(s)
          </div>
          <UPagination
            v-model:page="meta.page"
            :items-per-page="meta.limit"
            :total="meta.total"
            size="xs"
            @update:page="fetchData"
          />
        </div>
      </div>

      <!-- ── Right Panel: Detail (70%) ── -->
      <div class="flex-1 overflow-hidden">
        <div v-if="!selectedMprId" class="flex flex-col items-center justify-center h-full text-muted gap-3">
          <UIcon name="i-lucide-file-search" class="w-12 h-12 opacity-30" />
          <p class="text-sm">
            Select an MPR from the list to view its detail
          </p>
        </div>

        <MprDetailPanel
          v-if="selectedMprId"
          :mpr-id="selectedMprId"
          :mpr-summary="selectedMprData"
          @edit="openEditModal"
          @delete="handleDelete"
          @refresh-list="fetchData"
        />
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <MprAddModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :mpr="currentMpr"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Confirm Dialog -->
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