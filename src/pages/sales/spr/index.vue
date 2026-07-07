<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useSprStore } from '../../../stores/sales/spr.store'
import type { Spr } from '../../../types/sales/spr'
import SprAddModal from './components/SprAddModal.vue'
import SprDetailPanel from './components/SprDetailPanel.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useAuthStore } from '../../../stores/auth.store'

// ─── Store ────────────────────────────────────────────────────────────────────
const store = useSprStore()
const authStore = useAuthStore()
const { loading, meta, sprs } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

const isSupervisorSales = computed(() => authStore.user?.role?.toLowerCase() === 'supervisor sales')

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Purchase Request' }
]

// ─── Filters ──────────────────────────────────────────────────────────────────
const searchFilter = ref('')
const statusFilter = ref<string | undefined>(undefined)
const sourceFilter = ref<string | undefined>(undefined)

const statusItems = computed(() => store.statusDropdown)
const sourceItems = computed(() => store.sourceDropdown)

const selectedStatus = computed({
  get: () => statusFilter.value,
  set: (val) => { statusFilter.value = val }
})

const selectedSource = computed({
  get: () => sourceFilter.value,
  set: (val) => { sourceFilter.value = val }
})

function fetchData() {
  store.fetchSprs({
    page: meta.value.page,
    limit: meta.value.limit,
    search: searchFilter.value,
    status: statusFilter.value,
    source: sourceFilter.value
  })
}

const debouncedSearch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(searchFilter, debouncedSearch)
watch([statusFilter, sourceFilter], () => {
  meta.value.page = 1
  fetchData()
})

// ─── Grouped List (by Status) ─────────────────────────────────────────────────
const STATUS_ORDER = [
  'Draft',
  'Submitted',
  'Approved',
  'Rejected'
]

interface GroupedSpr {
  status: string
  items: Spr[]
}

const groupedSprs = computed<GroupedSpr[]>(() => {
  const map = new Map<string, Spr[]>()

  sprs.value.forEach(s => {
    if (!map.has(s.status)) map.set(s.status, [])
    map.get(s.status)!.push(s)
  })

  const result: GroupedSpr[] = []
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

// ─── Selected SPR ─────────────────────────────────────────────────────────────
const selectedSprId = ref<number | null>(null)

const selectedSprData = computed(() =>
  sprs.value.find(s => s.id === selectedSprId.value) ?? null
)

function selectSpr(spr: Spr) {
  if (selectedSprId.value === spr.id) return
  selectedSprId.value = spr.id
}

function getStatusColor(status: string): any {
  const map: Record<string, string> = {
    'Draft': 'neutral',
    'Submitted': 'warning',
    'Approved': 'success',
    'Rejected': 'error'
  }
  return map[status] || 'neutral'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Modal: Add / Edit ────────────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const currentSpr = reactive<Partial<Spr>>({})

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentSpr, {
    spr_name: '',
    required_date: '',
    description: '',
    details: []
  })
  isModalOpen.value = true
}

function openEditModal(spr: Spr) {
  modalMode.value = 'edit'
  // Use store.detail if available (contains full parts details), fallback to passed spr object
  const fullDetail = store.detail?.id === spr.id ? store.detail : spr
  Object.assign(currentSpr, JSON.parse(JSON.stringify(fullDetail)))
  isModalOpen.value = true
}

async function handleSave(data: Record<string, any>) {
  try {
    if (modalMode.value === 'add') {
      const res = await store.createSpr(data)
      toastSuccess(`SPR ${res?.data?.spr_number || ''} created successfully`)
    } else {
      await store.updateSpr(currentSpr.id!, data)
      toastSuccess('SPR updated successfully')
    }
    isModalOpen.value = false
    fetchData()
    // Reload detail if we just edited the selected one
    if (modalMode.value === 'edit' && selectedSprId.value === currentSpr.id) {
      await store.fetchSprById(currentSpr.id!)
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
    title: 'Delete SPR',
    description: 'Are you sure you want to delete this SPR? This action cannot be undone.',
    id,
    action: 'delete'
  }
}

async function handleConfirm() {
  try {
    await store.deleteSpr(confirmDialog.value.id)
    toastSuccess('SPR deleted successfully')
    if (selectedSprId.value === confirmDialog.value.id) {
      selectedSprId.value = null
    }
    fetchData()
    confirmDialog.value.open = false
  } catch (e: any) {
    toastError(e)
    confirmDialog.value.open = false
  }
}

// ─── Excel: Template ──────────────────────────────────────────────────────────
const isUploadOpen = ref(false)
const uploadFile = ref<File | null>(null)

async function handleDownloadTemplate() {
  try {
    const blob = await store.getTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'SPR_Template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    toastSuccess('Template downloaded')
  } catch (e: any) {
    toastError(e)
  }
}

async function handleUpload() {
  if (!uploadFile.value) return
  try {
    const res = await store.uploadTemplate(uploadFile.value)
    toastSuccess(res.message || 'Upload successful')
    isUploadOpen.value = false
    uploadFile.value = null
    fetchData()
  } catch (e: any) {
    toastError(e)
  }
}

const excelActions = computed(() => [
  [
    {
      label: 'Upload',
      icon: 'i-lucide-upload',
      disabled: isSupervisorSales.value,
      onSelect: () => { isUploadOpen.value = true }
    },
    {
      label: 'Template',
      icon: 'i-lucide-download',
      onSelect: () => handleDownloadTemplate()
    }
  ]
])

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchDropdownStatus()
  store.fetchDropdownSource()
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
          Sales Purchase Request
        </h1>
        <div class="flex items-center gap-2">
          <UDropdownMenu :items="excelActions" :content="{ align: 'end' }">
            <UButton
              label="Excel"
              icon="i-lucide-file-spreadsheet"
              color="neutral"
              variant="subtle"
              size="sm"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>
          <UButton
            v-if="!isSupervisorSales"
            icon="i-lucide-plus"
            color="primary"
            label="Create SPR"
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
            placeholder="Search SPR..."
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
              v-model="selectedSource"
              :items="sourceItems"
              placeholder="Source"
              class="w-28"
              size="sm"
              clear
            />
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
          <template v-if="groupedSprs.length === 0">
            <div class="p-6 text-center text-sm text-muted">
              <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 opacity-30" />
              No SPRs found.
            </div>
          </template>

          <template v-for="group in groupedSprs" :key="group.status">
            <!-- Status Group Header -->
            <div
              class="sticky top-0 z-10 px-3 py-2 bg-default/95 backdrop-blur border-b border-default flex items-center gap-2 cursor-pointer hover:bg-default/80 transition-colors"
              @click="toggleStatusCollapse(group.status)"
            >
              <UIcon
                :name="collapsedStatuses[group.status] ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                class="w-4 h-4 text-muted transition-transform"
              />
              <UBadge :color="getStatusColor(group.status)" variant="subtle" size="sm">
                {{ group.status }}
              </UBadge>
              <span class="ml-auto text-sm text-muted shrink-0">{{ group.items.length }}</span>
            </div>

            <!-- SPR Items -->
            <div v-show="!collapsedStatuses[group.status]">
              <button
                v-for="spr in group.items"
                :key="spr.id"
                class="w-full text-left p-4 border-b border-default/40 hover:bg-elevated/60 transition-colors relative"
                :class="{ 'bg-primary/10 border-l-2 border-l-primary': selectedSprId === spr.id }"
                @click="selectSpr(spr)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                      {{ spr.spr_number }}
                    </span>
                    <p class="text-sm font-bold text-default truncate mt-2">
                      {{ spr.spr_name }}
                    </p>
                    <div class="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <p class="flex items-center gap-1">
                        <UIcon name="i-lucide-calendar-clock" class="w-3.5 h-3.5" />
                        {{ formatDate(spr.required_date) }}
                      </p>
                      <UBadge
                        :color="spr.source === 'Automatic' ? 'info' : 'neutral'"
                        variant="subtle"
                        size="sm"
                        class="rounded-full"
                      >
                        {{ spr.source }}
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
            {{ meta.total }} SPR(s)
          </div>
          <UPagination
            v-model:page="meta.page"
            :items-per-page="meta.limit"
            :total="meta.total"
            size="sm"
            @update:page="fetchData"
          />
        </div>
      </div>

      <!-- ── Right Panel: Detail (70%) ── -->
      <div class="flex-1 overflow-hidden">
        <div v-if="!selectedSprId" class="flex flex-col items-center justify-center h-full text-muted gap-3">
          <UIcon name="i-lucide-file-search" class="w-12 h-12 opacity-30" />
          <p class="text-sm">
            Select an SPR from the list to view its detail
          </p>
        </div>

        <SprDetailPanel
          v-if="selectedSprId"
          :spr-id="selectedSprId"
          :spr-summary="selectedSprData"
          @edit="openEditModal"
          @delete="handleDelete"
          @refresh-list="fetchData"
        />
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <SprAddModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :spr="currentSpr"
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

    <!-- ── Upload Modal ─────────────────────────────────────────────────────── -->
    <UModal v-model:open="isUploadOpen" title="Upload SPR from Excel" description="Upload a filled template to bulk import SPR data">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-2 p-3 rounded-lg bg-elevated/50 border border-default text-sm text-muted">
            <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" />
            Download the template first, fill it in, then upload it here.
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            class="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary/80 cursor-pointer"
            @change="(e: any) => uploadFile = e.target.files?.[0] || null"
          >
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="isUploadOpen = false"
          />
          <UButton
            color="primary"
            label="Upload"
            icon="i-lucide-upload"
            :disabled="!uploadFile"
            :loading="loading"
            @click="handleUpload"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
