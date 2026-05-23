<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDate } from '@internationalized/date'
import { useSpoStore } from '../../../../stores/sales/spo.store'
import type { Spo } from '../../../../types/sales/spo'
import { useAppToast } from '../../../../composables/useAppToast'
import { useAuthStore } from '../../../../stores/auth.store'
import SpoSdoHistoryModal from './SpoSdoHistoryModal.vue'
import LocationPicker from '../../../../components/LocationPicker.vue'

const props = defineProps<{
  spoId: number
  spoSummary: Spo | null
}>()

const emit = defineEmits<{
  delete: [id: number]
  refreshList: []
}>()

const store = useSpoStore()
const authStore = useAuthStore()
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Load Detail ─────────────────────────────────────────────────────────────
const loadingDetail = ref(false)

async function loadDetail() {
  if (!props.spoId) return
  loadingDetail.value = true
  try {
    await store.fetchSpoById(props.spoId)
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load SPO details', color: 'error' })
  } finally {
    loadingDetail.value = false
  }
}

watch(() => props.spoId, () => { loadDetail() }, { immediate: true })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    Draft: 'i-lucide-file-edit',
    Submitted: 'i-lucide-send',
    Locked: 'i-lucide-lock',
    Processing: 'i-lucide-loader-2',
    Completed: 'i-lucide-check-circle-2'
  }
  return map[status] || 'i-lucide-circle'
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const isSupervisor = computed(() => {
  const role = authStore.user?.role
  return role === 'Superadmin' || role === 'Supervisor Sales'
})

// ─── Action Guards ────────────────────────────────────────────────────────────
const canSubmit = computed(() =>
  store.detail?.status === 'Draft' && (store.detail?.details?.length ?? 0) > 0
)
const canLock = computed(() =>
  store.detail?.status === 'Submitted' && isSupervisor.value
)
const canDelete = computed(() => store.detail?.status === 'Draft')
const canCreateDelivery = computed(() =>
  store.detail?.status === 'Locked' || store.detail?.status === 'Processing'
)

// ─── Workflow: Submit ─────────────────────────────────────────────────────────
async function handleSubmit() {
  try {
    await store.updateStatus(props.spoId, { status: 'Submitted' })
    toastSuccess('SPO submitted for Supervisor review')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Workflow: Lock ───────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const isLockModalOpen = ref(false)

function viewPoDocument() {
  if (store.detail?.po_document) {
    window.open(`${apiBaseUrl}${store.detail.po_document}`, '_blank')
  }
}

async function confirmLock() {
  isLockModalOpen.value = false
  await handleLock()
}

async function handleLock() {
  try {
    await store.updateStatus(props.spoId, { status: 'Locked' })
    toastSuccess('SPO locked')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── SDO History ──────────────────────────────────────────────────────────────
const isSdoHistoryOpen = ref(false)

// ─── Timeline step ────────────────────────────────────────────────────────────
function getStepState(step: number): 'complete' | 'current' | 'pending' {
  const status = store.detail?.status
  const order: Record<string, number> = {
    Draft: 0, Submitted: 1, Locked: 2, Processing: 3, Completed: 4
  }
  const current = order[status || 'Draft'] ?? 0
  if (step < current) return 'complete'
  if (step === current) return 'current'
  return 'pending'
}

// ─── Edit Mode (Draft Only) ───────────────────────────────────────────────────
const isEditOpen = ref(false)
const savingEdit = ref(false)
const isMapOpen = ref(false)
const editForm = ref({
  delivery_due_date: '',
  shipping_address: ''
})

const dueDatePickerModel = computed({
  get() {
    if (!editForm.value.delivery_due_date) return null
    const [y, m, d] = editForm.value.delivery_due_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) {
      editForm.value.delivery_due_date = ''
      return
    }
    const yyyy = val.year
    const mm = String(val.month).padStart(2, '0')
    const dd = String(val.day).padStart(2, '0')
    editForm.value.delivery_due_date = `${yyyy}-${mm}-${dd}`
  }
})

function handleEditInfo() {
  if (store.detail) {
    editForm.value.delivery_due_date = store.detail.delivery_due_date ? store.detail.delivery_due_date.substring(0, 10) : ''
    editForm.value.shipping_address = store.detail.shipping_address || ''
    isEditOpen.value = true
  }
}

async function saveEdit() {
  if (store.detail) {
    const spoDate = new Date(store.detail.spo_date.substring(0, 10))
    const dueDate = new Date(editForm.value.delivery_due_date)
    if (dueDate >= spoDate) {
      toast.add({ title: 'Error', description: 'Delivery due date must be before SPO date', color: 'error' })
      return
    }
  }

  savingEdit.value = true
  try {
    await store.updateSpo(props.spoId, {
      delivery_due_date: editForm.value.delivery_due_date,
      shipping_address: editForm.value.shipping_address
    })
    toastSuccess('Info updated successfully')
    isEditOpen.value = false
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  } finally {
    savingEdit.value = false
  }
}

const router = useRouter()

function handleCreateDeliveryPlan() {
  router.push({
    path: '/sales/sdp',
    query: { spo_id: props.spoId }
  })
}

function openMap(address: string) {
  const url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
  window.open(url, '_blank')
}

const downloadingPdf = ref(false)

async function handleDownloadPdf() {
  downloadingPdf.value = true
  try {
    const blob = await store.downloadSpoPdf(props.spoId)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SPO-${store.detail?.spo_number || props.spoId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e: any) {
    toastError(e)
  } finally {
    downloadingPdf.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-default shrink-0">
      <div v-if="loadingDetail" class="flex items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary" />
        <span class="text-sm text-muted">Loading detail...</span>
      </div>

      <div v-else-if="store.detail" class="space-y-3">
        <!-- Title Row -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-bold truncate">
              {{ store.detail.spo_number }}
            </h2>
            <p class="text-xs text-muted">
              Ref: {{ store.detail.spr?.spr_number || '-' }}
            </p>
          </div>
          <!-- Status Badge -->
          <div
            class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
            :class="{
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300': store.detail.status === 'Draft',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300': store.detail.status === 'Submitted',
              'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300': store.detail.status === 'Locked',
              'bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300': store.detail.status === 'Processing',
              'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300': store.detail.status === 'Completed'
            }"
          >
            <UIcon :name="getStatusIcon(store.detail.status)" class="w-3.5 h-3.5" />
            {{ store.detail.status }}
          </div>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center gap-1 flex-wrap">
          <!-- History DO -->
          <UButton
            label="History DO"
            icon="i-lucide-history"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isSdoHistoryOpen = true"
          />

          <div class="w-px h-5 bg-default mx-1" />

          <!-- Edit Info (Draft only) -->
          <UButton
            v-if="store.detail?.status === 'Draft'"
            icon="i-lucide-edit-3"
            color="primary"
            variant="ghost"
            size="sm"
            label="Edit Info"
            @click="handleEditInfo"
          />

          <!-- Delete (Draft only) -->
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            label="Delete"
            :disabled="!canDelete"
            @click="emit('delete', spoId)"
          />

          <div class="flex-1" />

          <!-- Create Delivery Plan -->
          <UButton
            v-if="canCreateDelivery"
            icon="i-lucide-truck"
            color="info"
            variant="subtle"
            size="sm"
            label="Create Delivery Plan"
            @click="handleCreateDeliveryPlan"
          />

          <!-- Download SPO Document -->
          <UButton
            v-if="['Locked', 'Processing', 'Completed'].includes(store.detail?.status || '')"
            icon="i-lucide-download"
            color="primary"
            variant="subtle"
            size="sm"
            label="Download SPO Document"
            :loading="downloadingPdf"
            @click="handleDownloadPdf"
          />

          <!-- Supervisor: Lock -->
          <UButton
            v-if="canLock"
            icon="i-lucide-lock"
            color="success"
            size="sm"
            label="Lock"
            :loading="store.loading"
            @click="isLockModalOpen = true"
          />

          <!-- Submit -->
          <UButton
            v-if="canSubmit"
            icon="i-lucide-send"
            color="primary"
            size="sm"
            label="Submit"
            :loading="store.loading"
            @click="handleSubmit"
          />
        </div>
      </div>
    </div>

    <!-- Detail Body -->
    <div class="flex-1 overflow-y-auto p-6 space-y-5">
      <div v-if="loadingDetail" class="flex justify-center p-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <template v-else-if="store.detail">
        <!-- Timeline -->
        <div class="flex items-start gap-0 overflow-x-auto pb-1">
          <div v-for="(step, idx) in ['Draft','Submitted','Locked','Processing','Completed']" :key="step" class="flex items-center flex-1 min-w-0">
            <div class="flex flex-col items-center flex-1 min-w-[70px]">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                :class="{
                  'bg-success-500 text-white': getStepState(idx) === 'complete',
                  'bg-primary text-white shadow-md': getStepState(idx) === 'current',
                  'bg-elevated border-2 border-default text-muted': getStepState(idx) === 'pending'
                }"
              >
                <UIcon v-if="getStepState(idx) === 'complete'" name="i-lucide-check" class="w-4 h-4" />
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <p class="text-xs text-center mt-2 font-medium" :class="getStepState(idx) === 'current' ? 'text-primary' : 'text-muted'">
                {{ step }}
              </p>
            </div>
            <div v-if="idx < 4" class="h-0.5 flex-1 mt-4 self-start" :class="getStepState(idx + 1) !== 'pending' ? 'bg-success-500' : 'bg-default'" />
          </div>
        </div>



        <!-- Info Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div class="bg-elevated/50 rounded-xl border border-default p-3 flex flex-col justify-between">
            <div>
              <div class="text-xs text-muted mb-1">
                Customer
              </div>
              <div class="text-sm font-semibold truncate">
                {{ store.detail.customer?.name || '-' }}
              </div>
              <div class="text-xs text-muted font-mono">
                {{ store.detail.customer?.customer_code }}
              </div>
            </div>
            <div v-if="store.detail.po_document" class="mt-2 pt-2 border-t border-default">
              <UButton
                icon="i-lucide-file-text"
                color="primary"
                variant="subtle"
                size="xs"
                label="View Customer PO"
                class="w-full justify-center"
                @click="viewPoDocument"
              />
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              SPO Date
            </div>
            <div class="text-sm font-semibold">
              {{ formatDate(store.detail.spo_date) }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Due Date
            </div>
            <div class="text-sm font-semibold text-warning-600 dark:text-warning-400">
              {{ formatDate(store.detail.delivery_due_date) }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3 col-span-2 lg:col-span-3">
            <div class="text-xs text-muted mb-1">
              Shipping Address
            </div>
            <div class="text-sm flex justify-between items-start gap-2">
              <span class="flex-1 leading-relaxed">{{ store.detail.shipping_address || '-' }}</span>
              <UButton
                v-if="store.detail.shipping_address"
                icon="i-lucide-map-pin"
                size="xs"
                color="primary"
                variant="subtle"
                label="Open Map"
                class="shrink-0 font-bold"
                @click="openMap(store.detail.shipping_address)"
              />
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default w-10 text-center">
                  #
                </th>
                <th class="p-3 font-medium border-r border-default">
                  Part Number
                </th>
                <th class="p-3 font-medium border-r border-default">
                  Part Name
                </th>
                <th class="p-3 font-medium text-center w-28">
                  Ordered Qty
                </th>
                <th class="p-3 font-medium text-center w-28">
                  Sent Qty
                </th>
                <th class="p-3 font-medium text-center w-28">
                  Remaining Qty
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.detail.details || store.detail.details.length === 0">
                <td colspan="6" class="p-8 text-center text-muted text-sm">
                  <UIcon name="i-lucide-package-open" class="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No items in this SPO.
                </td>
              </tr>
              <tr
                v-for="(det, idx) in store.detail.details"
                :key="det.id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20 transition-colors"
              >
                <td class="p-3 border-r border-default text-center text-muted text-xs">
                  {{ idx + 1 }}
                </td>
                <td class="p-3 border-r border-default font-mono text-xs font-medium">
                  {{ det.part?.part_number || '-' }}
                </td>
                <td class="p-3 border-r border-default">
                  {{ det.part?.part_name || '-' }}
                </td>
                <td class="p-3 text-center font-semibold font-mono border-r border-default">
                  {{ det.ordered_qty.toLocaleString() }}
                </td>
                <td class="p-3 text-center font-mono border-r border-default" :class="det.sent_qty > 0 ? 'text-success-600 dark:text-success-400 font-semibold' : 'text-muted'">
                  {{ det.sent_qty.toLocaleString() }}
                </td>
                <td class="p-3 text-center font-mono font-semibold" :class="(det.ordered_qty - det.sent_qty) > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400'">
                  {{ Math.max(0, det.ordered_qty - det.sent_qty).toLocaleString() }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="store.detail.details && store.detail.details.length > 0" class="bg-elevated/30">
              <tr class="border-t border-default">
                <td colspan="3" class="p-3 text-right text-sm font-bold text-muted">
                  Total
                </td>
                <td class="p-3 text-center font-bold font-mono text-primary border-r border-default">
                  {{ store.detail.details.reduce((s, d) => s + d.ordered_qty, 0).toLocaleString() }}
                </td>
                <td class="p-3 text-center font-bold font-mono border-r border-default text-success-600 dark:text-success-400">
                  {{ store.detail.details.reduce((s, d) => s + d.sent_qty, 0).toLocaleString() }}
                </td>
                <td class="p-3 text-center font-bold font-mono text-warning-600 dark:text-warning-400">
                  {{ store.detail.details.reduce((s, d) => s + Math.max(0, d.ordered_qty - d.sent_qty), 0).toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </div>



    <!-- SDO History Modal -->
    <SpoSdoHistoryModal
      v-model:open="isSdoHistoryOpen"
      :spo-id="spoId"
    />

    <!-- Edit Modal -->
    <UModal
      v-model:open="isEditOpen"
      title="Edit SPO Info"
      class="sm:max-w-lg"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Delivery Due Date" required>
            <UInputDate v-model="dueDatePickerModel">
              <template #trailing>
                <UPopover>
                  <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                  <template #content>
                    <UCalendar
                      v-model="dueDatePickerModel"
                      class="p-2"
                    />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
          
          <UFormField label="Shipping Address" required>
            <div class="space-y-2 w-full">
              <UTextarea v-model="editForm.shipping_address" :rows="3" class="w-full" />
              <div class="flex justify-end">
                <UButton
                  icon="i-lucide-map"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  label="Pilih dari Peta"
                  @click="isMapOpen = true"
                />
              </div>
            </div>
          </UFormField>
        </div>
      </template>
      
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="isEditOpen = false"
          />
          <UButton
            color="primary"
            label="Save Changes"
            :loading="savingEdit"
            @click="saveEdit"
          />
        </div>
      </template>
    </UModal>

    <!-- Commercial Verification Modal -->
    <UModal
      v-model:open="isLockModalOpen"
      title="Commercial Verification"
      class="sm:max-w-md"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm leading-relaxed text-default">
            Please confirm that you have verified the SPO details against the uploaded Customer PO document.
          </p>
          <div v-if="store.detail?.po_document" class="flex justify-center p-3 rounded-lg border border-default bg-elevated/40">
            <UButton
              icon="i-lucide-file-text"
              color="primary"
              variant="subtle"
              size="sm"
              label="View Customer PO Document"
              @click="viewPoDocument"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="isLockModalOpen = false"
          />
          <UButton
            color="success"
            icon="i-lucide-lock"
            label="Confirm Lock"
            :loading="store.loading"
            @click="confirmLock"
          />
        </div>
      </template>
    </UModal>

    <!-- Location Picker Modal -->
    <LocationPicker
      v-model="editForm.shipping_address"
      v-model:open="isMapOpen"
    />
  </div>
</template>
