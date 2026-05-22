<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useMpoStore } from '../../../stores/material/mpo.store'
import type { Mpo } from '../../../types/material/mpo'
import MpoCreateModal from './components/MpoCreateModal.vue'
import MpoDetailPanel from './components/MpoDetailPanel.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { useAuthStore } from '../../../stores/auth.store'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

const store = useMpoStore()
const router = useRouter()
const authStore = useAuthStore()
const { loading, meta, mpos } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Material' },
  { label: 'MPO' }
]

// ─── Role ─────────────────────────────────────────────────────────────────────
const userRole = computed(() => authStore.user?.role || '')
const isSupervisor = computed(() =>
  ['Superadmin', 'Supervisor Material'].includes(userRole.value)
)
const isStaff = computed(() =>
  ['Superadmin', 'Staff Material'].includes(userRole.value)
)

// ─── Filters ──────────────────────────────────────────────────────────────────
const searchFilter = ref('')
const statusFilter = ref<string | undefined>(undefined)

const statusItems = computed(() => store.statusDropdown)
const selectedStatus = computed({
  get: () => statusFilter.value,
  set: (val: string | null | undefined) => { statusFilter.value = val || undefined }
})

function fetchData() {
  store.fetchMpos({
    page: meta.value.page,
    limit: meta.value.limit,
    search: searchFilter.value,
    status: statusFilter.value
  })
}

const debouncedSearch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(searchFilter, debouncedSearch)
watch([statusFilter], () => {
  meta.value.page = 1
  fetchData()
})

// ─── Right Panel ──────────────────────────────────────────────────────────────
const selectedMpoId = ref<number | null>(null)
const detailPanelRef = ref<any>(null)

const selectedMpoData = computed(() =>
  mpos.value.find(m => m.id === selectedMpoId.value) ?? null
)

function selectMpo(mpo: Mpo) {
  if (selectedMpoId.value === mpo.id) return

  if (detailPanelRef.value?.isDirty) {
    confirmDialog.value = {
      open: true,
      title: 'Unsaved Changes',
      description: 'You have unsaved changes in the current MPO.',
      id: mpo.id,
      action: 'switch'
    }
    return
  }
  selectedMpoId.value = mpo.id
}

function getStatusColor(status: string): any {
  const map: Record<string, string> = {
    draft: 'neutral', submitted: 'warning', approved: 'success', rejected: 'error'
  }
  return map[status.toLowerCase()] || 'neutral'
}

// ─── Grouped by status (sama persis seperti MRP) ─────────────────────────────
interface StatusGroup {
  status: string
  items: Mpo[]
}

const STATUS_ORDER = ['draft', 'submitted', 'approved', 'rejected']

const groupedMpos = computed<StatusGroup[]>(() => {
  const map = new Map<string, Mpo[]>()
  STATUS_ORDER.forEach(s => map.set(s, []))

  mpos.value.forEach(m => {
    const key = m.status?.toLowerCase()
    if (map.has(key)) map.get(key)!.push(m)
    else map.get('draft')!.push(m)
  })

  return STATUS_ORDER
    .filter(s => map.get(s)!.length > 0)
    .map(s => ({ status: s, items: map.get(s)! }))
})

const collapsedStatuses = reactive<Record<string, boolean>>({})

function toggleStatusCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

// ─── Navigation Guards ────────────────────────────────────────────────────────
const isLeavingPage = ref(false)
const leaveToPath = ref('')

onBeforeRouteLeave((to, _from, next) => {
  if (isLeavingPage.value) { next(); return }
  if (detailPanelRef.value?.isDirty) {
    leaveToPath.value = to.fullPath
    confirmDialog.value = {
      open: true,
      title: 'Unsaved Changes',
      description: 'You have unsaved changes. Are you sure you want to leave this page?',
      id: 0,
      action: 'leave'
    }
    next(false)
  } else {
    next()
  }
})

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (detailPanelRef.value?.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onUnmounted(() => window.removeEventListener('beforeunload', handleBeforeUnload))

// ─── Modal: Create / Edit ─────────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const currentMpo = reactive<Partial<Mpo>>({})

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentMpo, {
    mpr_id: undefined,
    mrp_id: undefined,
    description: '',
    po_date: '',
    payment_term: '',
    remarks: ''
  })
  isModalOpen.value = true
}

function openEditModal(mpo: Mpo) {
  modalMode.value = 'edit'
  Object.assign(currentMpo, mpo)
  isModalOpen.value = true
}

async function handleSave(data: any) {
  try {
    if (modalMode.value === 'add') {
      await store.createMpo(data)
      toastSuccess(data.action === 'draft' ? 'MPO saved as draft' : 'MPO submitted successfully')
    } else {
      await store.updateMpo((currentMpo as Mpo).id, data)
      toastSuccess('MPO updated successfully')
    }
    isModalOpen.value = false
    fetchData()
    if (modalMode.value === 'edit' && selectedMpoId.value) {
      detailPanelRef.value?.loadDetail?.()
    }
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const confirmDialog = ref({
  open: false,
  title: '',
  description: '',
  id: 0,
  action: 'delete' as 'delete' | 'switch' | 'leave'
})

function handleDelete(id: number) {
  confirmDialog.value = {
    open: true,
    title: 'Delete MPO',
    description: 'Are you sure you want to delete this MPO? This action cannot be undone.',
    id,
    action: 'delete'
  }
}

function handleConfirm() {
  if (confirmDialog.value.action === 'delete') {
    executeDelete()
  } else if (confirmDialog.value.action === 'leave') {
    isLeavingPage.value = true
    confirmDialog.value.open = false
    router.push(leaveToPath.value)
  } else {
    detailPanelRef.value?.resetDirty()
    selectedMpoId.value = confirmDialog.value.id
    confirmDialog.value.open = false
  }
}

async function executeDelete() {
  try {
    await store.deleteMpo(confirmDialog.value.id)
    toastSuccess('MPO deleted successfully')
    if (selectedMpoId.value === confirmDialog.value.id) selectedMpoId.value = null
    fetchData()
    confirmDialog.value.open = false
  } catch (e: any) {
    toastError(e)
    confirmDialog.value.open = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  store.fetchDropdownStatus()
  store.fetchDropdownSource()
  fetchData()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center gap-3 flex-wrap">
        <h1 class="text-2xl font-bold">
          Material Purchase Order
        </h1>
        <div class="flex items-center gap-2">
          <UButton
            v-if="isStaff"
            icon="i-lucide-plus"
            color="primary"
            label="Create MPO"
            @click="openAddModal"
          />
        </div>
      </div>
    </div>

    <!-- Master-Detail Body -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <!-- ── Left Panel (30%) ── -->
      <div class="w-[30%] min-w-[260px] max-w-sm flex flex-col border-r border-default overflow-hidden">
        <!-- Filters -->
        <div class="p-3 space-y-2 border-b border-default shrink-0">
          <UInput
            v-model="searchFilter"
            icon="i-lucide-search"
            placeholder="Search MPO..."
            class="w-full"
            size="sm"
          />
          <USelectMenu
            v-model="selectedStatus"
            :items="statusItems"
            placeholder="All Status"
            class="w-full"
            size="sm"
            clear
          />
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto">
          <template v-if="groupedMpos.length === 0">
            <div class="p-6 text-center text-sm text-muted">
              No MPO documents found.
            </div>
          </template>

          <template v-for="statusGroup in groupedMpos" :key="statusGroup.status">
            <!-- Status Group Header -->
            <div
              class="sticky top-0 z-10 px-3 py-2 bg-default/95 backdrop-blur border-b border-default flex items-center gap-2 cursor-pointer hover:bg-elevated/80 transition-colors"
              @click="toggleStatusCollapse(statusGroup.status)"
            >
              <UIcon
                :name="collapsedStatuses[statusGroup.status] ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                class="w-4 h-4 text-muted transition-transform"
              />
              <UBadge :color="getStatusColor(statusGroup.status)" variant="subtle" size="xs" class="capitalize">
                {{ statusGroup.status }}
              </UBadge>
              <span class="ml-auto text-xs text-muted shrink-0">{{ statusGroup.items.length }} item(s)</span>
            </div>

            <div v-show="!collapsedStatuses[statusGroup.status]">
              <div
                v-for="mpo in statusGroup.items"
                :key="mpo.id"
                class="w-full text-left px-4 py-2.5 border-b border-default/40 hover:bg-elevated/60 transition-colors cursor-pointer"
                :class="{ 'bg-primary/10 border-l-2 border-l-primary': selectedMpoId === mpo.id }"
                @click="selectMpo(mpo)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                      {{ mpo.number }}
                    </p>
                    <p class="text-xs text-muted truncate">
                      {{ mpo.mrp?.number || mpo.purchase_request?.number || '-' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Pagination -->
        <div class="p-3 border-t border-default shrink-0">
          <div class="text-xs text-muted mb-2">
            {{ meta.total }} MPO document(s)
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

      <!-- ── Right Panel (70%) ── -->
      <div class="flex-1 overflow-hidden">
        <div v-if="!selectedMpoId" class="flex flex-col items-center justify-center h-full text-muted gap-3">
          <UIcon name="i-lucide-shopping-cart" class="w-12 h-12 opacity-30" />
          <p class="text-sm">
            Select an MPO from the list to view its detail
          </p>
        </div>

        <MpoDetailPanel
          v-if="selectedMpoId"
          ref="detailPanelRef"
          :mpo-id="selectedMpoId"
          :mpo-summary="selectedMpoData"
          @edit="openEditModal"
          @delete="handleDelete"
          @refresh-list="fetchData"
        />
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <MpoCreateModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :mpo="currentMpo"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :confirm-label="confirmDialog.action === 'delete' ? 'Delete' : 'Discard & Switch'"
      :loading="loading"
      @confirm="handleConfirm"
    />
  </div>
</template>