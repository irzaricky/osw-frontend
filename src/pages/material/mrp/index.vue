<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useMrpStore } from '../../../stores/material/mrp.store'
import type { Mrp } from '../../../types/material/mrp'
import MrpCreateModal from './components/MrpCreateModal.vue'
import MrpEditRejectedModal from './components/MrpEditRejectedModal.vue'
import MrpDetailPanel from './components/MrpDetailPanel.vue'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import { useAppToast } from '../../../composables/useAppToast'
import { useAuthStore } from '../../../stores/auth.store'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

// Store
const store = useMrpStore()
const router = useRouter()
const authStore = useAuthStore()
const { loading, meta, mrps } = storeToRefs(store)
const { toastSuccess, toastError } = useAppToast()

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Material' },
  { label: 'MRP' }
]

// ─── Role ─────────────────────────────────────────────────────────────────────
const userRole = computed(() => authStore.user?.role || '')
const isSupervisor = computed(() =>
  ['Superadmin', 'Supervisor Material'].includes(userRole.value)
)
const isStaff = computed(() =>
  ['Superadmin', 'Staff Material'].includes(userRole.value)
)

// ─── Filters ─────────────────────────────────────────────────────────────────
const searchFilter = ref('')
const statusFilter = ref<string | undefined>(undefined)

const statusItems = computed(() => store.statusDropdown)
const selectedStatus = computed({
  get: () => statusFilter.value,
  set: (val: string | null | undefined) => { statusFilter.value = val || undefined }
})

function fetchData() {
  store.fetchMrps({
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

// ─── Right Panel: Selected MRP ────────────────────────────────────────────────
const selectedMrpId = ref<number | null>(null)
const detailPanelRef = ref<any>(null)

const selectedMrpData = computed(() =>
  mrps.value.find(m => m.id === selectedMrpId.value) ?? null
)

function selectMrp(mrp: Mrp) {
  if (selectedMrpId.value === mrp.id) return

  if (detailPanelRef.value?.isDirty) {
    confirmDialog.value = {
      open: true,
      title: 'Unsaved Changes',
      description: 'You have unsaved changes in the current MRP.',
      id: mrp.id,
      action: 'switch'
    }
    return
  }
  selectedMrpId.value = mrp.id
}

function getStatusColor(status: string): any {
  const map: Record<string, string> = {
    Draft: 'neutral', Submitted: 'warning', Approved: 'success', Rejected: 'error'
  }
  return map[status] || 'neutral'
}

function getPriorityColor(priority: string): any {
  const map: Record<string, string> = { High: 'error', Medium: 'warning', Low: 'success' }
  return map[priority] || 'neutral'
}

// ─── Grouped List: flat, max 4 status groups ─────────────────────────────────
interface StatusGroup {
  status: string
  items: Mrp[]
}

const STATUS_ORDER = ['Draft', 'Submitted', 'Approved', 'Rejected']

const groupedMrps = computed<StatusGroup[]>(() => {
  const map = new Map<string, Mrp[]>()

  // seed map with fixed order so groups never duplicate
  STATUS_ORDER.forEach(s => map.set(s, []))

  mrps.value.forEach(m => {
    const key = STATUS_ORDER.includes(m.status) ? m.status : 'Draft'
    map.get(key)!.push(m)
  })

  // only return groups that actually have items
  return STATUS_ORDER
    .filter(s => map.get(s)!.length > 0)
    .map(s => ({ status: s, items: map.get(s)! }))
})

const collapsedStatuses = reactive<Record<string, boolean>>({})

function toggleStatusCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

// ─── Bulk Submit (Staff/Maker) ────────────────────────────────────────────────
const selectedDraftIds = ref<number[]>([])
const isBulkSubmitOpen = ref(false)

function toggleSelectDraft(id: number) {
  const idx = selectedDraftIds.value.indexOf(id)
  if (idx === -1) selectedDraftIds.value.push(id)
  else selectedDraftIds.value.splice(idx, 1)
}

function toggleSelectAllDraft() {
  const draftIds = mrps.value
    .filter(m => m.status === 'Draft')
    .map(m => m.id)
  if (selectedDraftIds.value.length === draftIds.length) {
    selectedDraftIds.value = []
  } else {
    selectedDraftIds.value = draftIds
  }
}

function openBulkSubmit() {
  isBulkSubmitOpen.value = true
}

async function confirmBulkSubmit() {
  try {
    await store.bulkSubmitMrp(selectedDraftIds.value)
    toastSuccess(`${selectedDraftIds.value.length} MRP(s) submitted successfully`)
    // Kalau MRP yang sedang dibuka di detail panel ikut di-submit, reload detailnya
    if (selectedMrpId.value && selectedDraftIds.value.includes(selectedMrpId.value)) {
      detailPanelRef.value?.loadDetail?.()
    }
    selectedDraftIds.value = []
    isBulkSubmitOpen.value = false
    fetchData()
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Bulk Review (Supervisor) ────────────────────────────────────────────────
const selectedIds = ref<number[]>([])
const isBulkReviewOpen = ref(false)
const bulkReviewForm = ref<{ action: 'Approve' | 'Reject'; notes: string }>({
  action: 'Approve',
  notes: ''
})

function toggleSelectMrp(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleSelectAll() {
  const submittedIds = mrps.value
    .filter(m => m.status === 'Submitted')
    .map(m => m.id)

  if (selectedIds.value.length === submittedIds.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = submittedIds
  }
}

function openBulkReview(action: 'Approve' | 'Reject') {
  bulkReviewForm.value = { action, notes: '' }
  isBulkReviewOpen.value = true
}

async function confirmBulkReview() {
  if (bulkReviewForm.value.action === 'Reject' && !bulkReviewForm.value.notes.trim()) {
    return
  }
  try {
    await store.bulkReviewMrp({
      ids: selectedIds.value,
      action: bulkReviewForm.value.action,
      notes: bulkReviewForm.value.notes || undefined
    })
    toastSuccess(`${selectedIds.value.length} MRP(s) ${bulkReviewForm.value.action === 'Approve' ? 'approved' : 'rejected'}`)
    // Kalau MRP yang sedang dibuka ikut di-review, reload detailnya
    if (selectedMrpId.value && selectedIds.value.includes(selectedMrpId.value)) {
      detailPanelRef.value?.loadDetail?.()
    }
    selectedIds.value = []
    isBulkReviewOpen.value = false
    fetchData()
  } catch (e: any) {
    toastError(e)
  }
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
const currentMrp = reactive<Partial<Mrp>>({})

function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentMrp, {
    spr_id: undefined,
    description: '',
    priority: '',
    notes: ''
  })
  isModalOpen.value = true
}

function openEditModal(mrp: Mrp) {
  if (!['Draft', 'Rejected'].includes(mrp.status)) {
    toastError('Only Draft or Rejected MRPs can be edited.')
    return
  }
  modalMode.value = 'edit'
  Object.assign(currentMrp, mrp)
  isModalOpen.value = true
}

async function handleSave(data: any) {
  try {
    if (modalMode.value === 'add') {
      await store.createMrp(data)
      toastSuccess(data.save_as_draft ? 'MRP saved as draft' : 'MRP submitted successfully')
    } else {
      await store.updateMrp((currentMrp as Mrp).id, data)
      toastSuccess('MRP updated successfully')
    }
    isModalOpen.value = false
    fetchData()
    // Refetch dropdown supaya SPR yang baru dipakai langsung hilang dari list
    // tanpa perlu reload halaman
    store.fetchDropdownSalesPlans()
    if (modalMode.value === 'edit' && selectedMrpId.value) {
      // refresh detail panel
      detailPanelRef.value?.loadDetail?.()
    }
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Modal: Edit Rejected MRP ─────────────────────────────────────────────────
const isEditRejectedOpen = ref(false)
const rejectedMrpToEdit = ref<Mrp | null>(null)

function openEditRejectedModal(mrp: Mrp) {
  rejectedMrpToEdit.value = mrp
  isEditRejectedOpen.value = true
}

function onRejectedEditSaved() {
  toastSuccess('MRP updated successfully')
  isEditRejectedOpen.value = false
  fetchData()
  // Refetch dropdown — setelah rejected MRP di-resubmit, SPR-nya kembali terkunci
  store.fetchDropdownSalesPlans()
  detailPanelRef.value?.loadDetail?.()
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
    title: 'Delete MRP',
    description: 'Are you sure you want to delete this MRP? This action cannot be undone.',
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
    selectedMrpId.value = confirmDialog.value.id
    confirmDialog.value.open = false
  }
}

async function executeDelete() {
  try {
    await store.deleteMrp(confirmDialog.value.id)
    toastSuccess('MRP deleted successfully')
    if (selectedMrpId.value === confirmDialog.value.id) selectedMrpId.value = null
    fetchData()
    // Refetch dropdown — MRP Draft/Rejected yang dihapus melepaskan SPR-nya
    // kembali ke dropdown tanpa perlu reload halaman
    store.fetchDropdownSalesPlans()
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
  store.fetchDropdownPriority()
  store.fetchDropdownSalesPlans()
  store.fetchDropdownParts()
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
          Material Requirements Planning
        </h1>
        <div class="flex items-center gap-2">
          <!-- Bulk Submit (Staff) -->
          <template v-if="isStaff && selectedDraftIds.length > 0">
            <span class="text-sm text-muted">{{ selectedDraftIds.length }} selected</span>
            <UButton
              icon="i-lucide-send"
              color="warning"
              variant="outline"
              size="sm"
              label="Submit Selected"
              @click="openBulkSubmit"
            />
          </template>

          <!-- Bulk Review (Supervisor) -->
          <template v-if="isSupervisor && selectedIds.length > 0">
            <span class="text-sm text-muted">{{ selectedIds.length }} selected</span>
            <UButton
              icon="i-lucide-check"
              color="success"
              variant="outline"
              size="sm"
              label="Approve Selected"
              @click="openBulkReview('Approve')"
            />
            <UButton
              icon="i-lucide-x"
              color="error"
              variant="outline"
              size="sm"
              label="Reject Selected"
              @click="openBulkReview('Reject')"
            />
          </template>

          <!-- Create (Staff) -->
          <UButton
            v-if="isStaff"
            icon="i-lucide-plus"
            color="primary"
            label="Create MRP"
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
            placeholder="Search MRP..."
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
          <template v-if="groupedMrps.length === 0">
            <div class="p-6 text-center text-sm text-muted">
              No MRP documents found.
            </div>
          </template>

          <template v-for="statusGroup in groupedMrps" :key="statusGroup.status">
            <div
              class="sticky top-0 z-10 px-3 py-2 bg-default/95 backdrop-blur border-b border-default flex items-center gap-2 cursor-pointer hover:bg-elevated/80 transition-colors"
              @click="toggleStatusCollapse(statusGroup.status)"
            >
              <UIcon
                :name="collapsedStatuses[statusGroup.status] ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
                class="w-4 h-4 text-muted transition-transform"
              />
              <UCheckbox
                v-if="isStaff && statusGroup.status === 'Draft'"
                :model-value="selectedDraftIds.length > 0 && selectedDraftIds.length === statusGroup.items.length"
                :indeterminate="selectedDraftIds.length > 0 && selectedDraftIds.length < statusGroup.items.length"
                @click.stop="toggleSelectAllDraft"
              />
              <UCheckbox
                v-if="isSupervisor && statusGroup.status === 'Submitted'"
                :model-value="selectedIds.length > 0 && selectedIds.length === statusGroup.items.length"
                :indeterminate="selectedIds.length > 0 && selectedIds.length < statusGroup.items.length"
                @click.stop="toggleSelectAll"
              />
              <UBadge :color="getStatusColor(statusGroup.status)" variant="subtle" size="xs">
                {{ statusGroup.status }}
              </UBadge>
              <span class="ml-auto text-xs text-muted shrink-0">{{ statusGroup.items.length }} item(s)</span>
            </div>

            <div v-show="!collapsedStatuses[statusGroup.status]">
              <div
                v-for="mrp in statusGroup.items"
                :key="mrp.id"
                class="w-full text-left px-4 py-2.5 border-b border-default/40 hover:bg-elevated/60 transition-colors cursor-pointer"
                :class="{ 'bg-primary/10 border-l-2 border-l-primary': selectedMrpId === mrp.id }"
                @click="selectMrp(mrp)"
              >
                <div class="flex items-start justify-between gap-2">
                  <!-- Checkbox for bulk submit (Staff, Draft only) -->
                  <div
                    v-if="isStaff && mrp.status === 'Draft'"
                    class="mt-0.5 shrink-0"
                    @click.stop="toggleSelectDraft(mrp.id)"
                  >
                    <UCheckbox :model-value="selectedDraftIds.includes(mrp.id)" />
                  </div>

                  <!-- Checkbox for bulk review (Supervisor, Submitted only) -->
                  <div
                    v-if="isSupervisor && mrp.status === 'Submitted'"
                    class="mt-0.5 shrink-0"
                    @click.stop="toggleSelectMrp(mrp.id)"
                  >
                    <UCheckbox :model-value="selectedIds.includes(mrp.id)" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                      {{ mrp.number }}
                    </p>
                    <p class="text-xs text-muted truncate">
                      {{ mrp.sales_plan?.spr_number || mrp.description || '-' }}
                    </p>
                  </div>

                  <div class="shrink-0">
                    <UBadge
                      v-if="mrp.priority"
                      :color="getPriorityColor(mrp.priority)"
                      variant="subtle"
                      size="xs"
                    >
                      {{ mrp.priority }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Pagination -->
        <div class="p-3 border-t border-default shrink-0">
          <div class="text-xs text-muted mb-2">
            {{ meta.total }} MRP document(s)
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
        <div v-if="!selectedMrpId" class="flex flex-col items-center justify-center h-full text-muted gap-3">
          <UIcon name="i-lucide-clipboard-list" class="w-12 h-12 opacity-30" />
          <p class="text-sm">
            Select an MRP from the list to view its detail
          </p>
        </div>

        <MrpDetailPanel
          v-if="selectedMrpId"
          ref="detailPanelRef"
          :mrp-id="selectedMrpId"
          :mrp-summary="selectedMrpData"
          @edit="openEditModal"
          @edit-rejected="openEditRejectedModal"
          @delete="handleDelete"
          @refresh-list="fetchData"
        />
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <MrpCreateModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :mrp="currentMrp"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Edit Rejected Modal -->
    <MrpEditRejectedModal
      v-model:open="isEditRejectedOpen"
      :mrp="rejectedMrpToEdit"
      @saved="onRejectedEditSaved"
    />

    <!-- Bulk Submit Modal -->
    <UModal
      v-model:open="isBulkSubmitOpen"
      title="Bulk Submit MRP"
      :description="`You are about to submit ${selectedDraftIds.length} Draft MRP document(s) to Supervisor for review.`"
    >
      <template #body>
        <div class="flex items-center gap-3 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
          <UIcon name="i-lucide-send" class="w-5 h-5 shrink-0 text-warning-500" />
          <div class="text-sm">
            <p class="font-medium">{{ selectedDraftIds.length }} MRP(s) selected</p>
            <p class="text-muted text-xs mt-0.5">MRP IDs: {{ selectedDraftIds.join(', ') }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isBulkSubmitOpen = false" />
          <UButton color="warning" label="Submit All" icon="i-lucide-send" :loading="loading" @click="confirmBulkSubmit" />
        </div>
      </template>
    </UModal>

    <!-- Bulk Review Modal -->
    <UModal
      v-model:open="isBulkReviewOpen"
      :title="bulkReviewForm.action === 'Approve' ? 'Bulk Approve MRP' : 'Bulk Reject MRP'"
      :description="`You are about to ${bulkReviewForm.action.toLowerCase()} ${selectedIds.length} MRP document(s).`"
    >
      <template #body>
        <div class="space-y-4">
          <div
            class="flex items-center gap-3 p-3 rounded-lg"
            :class="bulkReviewForm.action === 'Approve'
              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
              : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'"
          >
            <UIcon
              :name="bulkReviewForm.action === 'Approve' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="bulkReviewForm.action === 'Approve' ? 'text-success-500' : 'text-error-500'"
              class="w-5 h-5 shrink-0"
            />
            <div class="text-sm">
              <p class="font-medium">
                {{ selectedIds.length }} MRP(s) selected
              </p>
              <p class="text-muted text-xs mt-0.5">
                MRP IDs: {{ selectedIds.join(', ') }}
              </p>
            </div>
          </div>

          <UFormField
            :label="bulkReviewForm.action === 'Reject' ? 'Rejection Notes' : 'Notes (Optional)'"
            :required="bulkReviewForm.action === 'Reject'"
          >
            <UTextarea
              v-model="bulkReviewForm.notes"
              :placeholder="bulkReviewForm.action === 'Reject'
                ? 'Explain the reason for rejection...'
                : 'Add notes if needed...'"
              class="w-full"
              rows="3"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="isBulkReviewOpen = false"
          />
          <UButton
            :color="bulkReviewForm.action === 'Approve' ? 'success' : 'error'"
            :label="bulkReviewForm.action === 'Approve' ? 'Approve All' : 'Reject All'"
            :icon="bulkReviewForm.action === 'Approve' ? 'i-lucide-check' : 'i-lucide-x'"
            :loading="loading"
            :disabled="bulkReviewForm.action === 'Reject' && !bulkReviewForm.notes.trim()"
            @click="confirmBulkReview"
          />
        </div>
      </template>
    </UModal>

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