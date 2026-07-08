<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMpoStore } from '../../../../stores/material/mpo.store'
import type { Mpo } from '../../../../types/material/mpo'
import { useAppToast } from '../../../../composables/useAppToast'
import { useAuthStore } from '../../../../stores/auth.store'

const props = defineProps<{
  mpoId: number
  mpoSummary: Mpo | null
}>()

const emit = defineEmits<{
  edit: [mpo: Mpo]
  editRejected: [mpo: Mpo]   // NEW: trigger modal edit khusus MPO rejected
  delete: [id: number]
  refreshList: []
}>()

const store = useMpoStore()
const authStore = useAuthStore()
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Data ─────────────────────────────────────────────────────────────────────
const localDetail = ref<Mpo | null>(null)
const loadingDetail = ref(false)

const detailItems = ref<{
  id?: number
  part_id: number
  qty: number
  price: number
  notes?: string
  part_number?: string
  part_name?: string
  uom_code?: string
  supplier_name?: string
}[]>([])

defineExpose({
  loadDetail
})

// ─── Role ─────────────────────────────────────────────────────────────────────
const isSupervisor = computed(() => {
  const role = authStore.user?.role
  return role === 'Superadmin' || role === 'Supervisor Material'
})

const isStaff = computed(() => {
  const role = authStore.user?.role
  return role === 'Superadmin' || role === 'Staff Material'
})

const isEditable = computed(() => {
  const status = localDetail.value?.status?.toLowerCase()
  return status === 'draft' || status === 'rejected'
})

const isRejected = computed(() =>
  localDetail.value?.status?.toLowerCase() === 'rejected'
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    Draft: 'i-lucide-file-edit',
    Submitted: 'i-lucide-send',
    Approved: 'i-lucide-check-circle',
    Rejected: 'i-lucide-x-circle'
  }
  return map[status] || 'i-lucide-circle'
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    Draft: 'neutral', Submitted: 'warning', Approved: 'success', Rejected: 'error'
  }
  return map[status] || 'neutral'
}

// ─── Total Price ──────────────────────────────────────────────────────────────
const totalPrice = computed(() =>
  detailItems.value.reduce((sum, d) => sum + (d.qty * d.price), 0)
)

function formatCurrency(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

// ─── Source label ─────────────────────────────────────────────────────────────
const sourceLabel = computed(() => {
  if (!localDetail.value) return '-'
  if (localDetail.value.mrp) return localDetail.value.mrp.number
  if (localDetail.value.purchase_request) return localDetail.value.purchase_request.number
  return '-'
})

const headerSupplierName = computed(() =>
  (localDetail.value as any)?.supplier?.name ?? '-'
)

// ─── Load ──────────────────────────────────────────────────────────────────────
async function loadDetail() {
  if (!props.mpoId) return
  loadingDetail.value = true
  try {
    const data = await store.fetchMpoById(props.mpoId)
    if (data?.data) {
      localDetail.value = data.data
      setupDetailItems(data.data)
    }
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load MPO details', color: 'error' })
  } finally {
    loadingDetail.value = false
  }
}

function setupDetailItems(mpo: Mpo) {
  detailItems.value = (mpo.details || []).map(d => ({
    id: d.id,
    part_id: d.part_id,
    qty: d.qty,
    price: d.price,
    notes: d.notes ?? undefined,
    part_number: d.part?.part_number,
    part_name: d.part?.part_name,
    uom_code: d.part?.uom?.code,
    supplier_name: (mpo as any).supplier?.name ?? d.supplier?.name ?? '-'
  }))
}

watch(() => props.mpoId, () => { loadDetail() }, { immediate: true })

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitMpo() {
  if (!localDetail.value) return
  try {
    await store.updateMpo(localDetail.value.id, { action: 'submit' })
    toastSuccess('MPO submitted successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Review (Approve / Reject) ────────────────────────────────────────────────
const isReviewOpen = ref(false)
const reviewForm = ref<{ action: 'approve' | 'reject'; notes: string }>({
  action: 'approve',
  notes: ''
})

function openReviewModal() {
  reviewForm.value = { action: 'approve', notes: '' }
  isReviewOpen.value = true
}

async function confirmReview() {
  if (reviewForm.value.action === 'reject' && !reviewForm.value.notes.trim()) {
    toast.add({ title: 'Error', description: 'Remarks are required when rejecting', color: 'error' })
    return
  }
  if (!localDetail.value) return
  try {
    // FIXED: field yang dikirim ke backend adalah `notes`, bukan `remarks`
    // Backend updateStatus mengekstrak { action, notes } dari req.body
    await store.updateStatus(localDetail.value.id, {
      action: reviewForm.value.action,
      notes: reviewForm.value.notes || undefined
    })
    toastSuccess(`MPO ${reviewForm.value.action === 'approve' ? 'approved' : 'rejected'} successfully`)
    isReviewOpen.value = false
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
const isLogsOpen = ref(false)

function getLogActionColor(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('approve')) return 'text-success-600 dark:text-success-400'
  if (a.includes('reject')) return 'text-error-600 dark:text-error-400'
  if (a.includes('submit')) return 'text-warning-600 dark:text-warning-400'
  if (a.includes('create')) return 'text-blue-600 dark:text-blue-400'
  if (a.includes('edit') || a.includes('update') || a.includes('split')) return 'text-primary-600 dark:text-primary-400'
  if (a.includes('delete')) return 'text-error-400 dark:text-error-300'
  return 'text-primary'
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- ── Header ── -->
    <div class="px-6 py-4 border-b border-default shrink-0">
      <div v-if="loadingDetail" class="flex items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary" />
        <span class="text-sm text-muted">Loading detail...</span>
      </div>

      <div v-else-if="localDetail" class="space-y-3">
        <!-- Row 1: Number + Status pill -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0">
            <h2 class="text-lg font-bold truncate">
              {{ localDetail.number }}
            </h2>
            <p class="text-sm text-muted truncate">
              {{ sourceLabel }}
            </p>
          </div>

          <div
            class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
            :class="{
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300': localDetail.status?.toLowerCase() === 'draft',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300': localDetail.status?.toLowerCase() === 'submitted',
              'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300': localDetail.status?.toLowerCase() === 'approved',
              'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300': localDetail.status?.toLowerCase() === 'rejected',
            }"
          >
            <UIcon :name="getStatusIcon(localDetail.status)" class="w-3.5 h-3.5" />
            {{ localDetail.status }}
          </div>
        </div>

        <!-- Row 2: Action buttons -->
        <div class="flex items-center gap-1">
          <!-- Logs -->
          <UButton
            label="Logs"
            icon="i-lucide-history"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isLogsOpen = true"
          />

          <div class="w-px h-5 bg-default mx-1" />

          <!-- Tombol Edit biasa — untuk status Draft, membuka modal edit lengkap -->
          <UButton
            v-if="localDetail.status?.toLowerCase() === 'draft'"
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Edit"
            :disabled="!isStaff"
            @click="localDetail && emit('editRejected', localDetail as Mpo)"
          />

          <!-- Tombol Edit Rejected — untuk status Rejected, membuka modal split-update -->
          <UButton
            v-if="isRejected && isStaff"
            icon="i-lucide-pencil"
            color="warning"
            variant="subtle"
            size="sm"
            label="Edit & Resubmit"
            @click="localDetail && emit('editRejected', localDetail as Mpo)"
          />

          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            label="Delete"
            :disabled="!isStaff || localDetail.status?.toLowerCase() !== 'draft'"
            @click="emit('delete', mpoId)"
          />

          <div class="flex-1" />

          <UButton
            v-if="localDetail.status?.toLowerCase() === 'draft' && detailItems.length > 0"
            icon="i-lucide-send"
            color="warning"
            variant="subtle"
            size="sm"
            label="Submit"
            :loading="store.loading"
            @click="submitMpo"
          />
          <UButton
            v-if="localDetail.status?.toLowerCase() === 'submitted' && isSupervisor"
            icon="i-lucide-check-square"
            color="success"
            variant="subtle"
            size="sm"
            label="Review"
            @click="openReviewModal"
          />
        </div>
      </div>
    </div>

    <!-- ── Detail Body ── -->
    <div class="flex-1 overflow-y-auto p-6 space-y-5">
      <div v-if="loadingDetail" class="flex justify-center p-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <template v-else-if="localDetail">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Total Price</div>
            <div class="text-sm font-semibold truncate text-primary-600 dark:text-primary-400">
              {{ formatCurrency(totalPrice) }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              {{ localDetail.mrp_id ? 'MRP Number' : 'MPR Number' }}
            </div>
            <div class="text-sm font-semibold truncate">{{ sourceLabel }}</div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Created By</div>
            <div class="text-sm font-semibold truncate">
              {{ localDetail.creator?.user_detail?.full_name || localDetail.creator?.email || '-' }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Approved By</div>
            <div class="text-sm font-semibold truncate">
              {{ localDetail.approver?.user_detail?.full_name || localDetail.approver?.email || '-' }}
            </div>
          </div>
        </div>

        <!-- Supplier Header Card -->
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-default bg-elevated/50">
          <UIcon name="i-lucide-building-2" class="w-4 h-4 text-primary shrink-0" />
          <div>
            <div class="text-xs text-muted mb-0.5 uppercase tracking-wider font-bold">Supplier</div>
            <div class="text-sm font-semibold">{{ headerSupplierName }}</div>
          </div>
          <UBadge color="neutral" variant="outline" size="xs" class="ml-auto" icon="i-lucide-info">
            1 MPO = 1 Supplier
          </UBadge>
        </div>

        <!-- Description -->
        <div v-if="localDetail.description" class="bg-elevated/50 rounded-xl border border-default p-4">
          <div class="text-xs text-muted mb-2 uppercase tracking-wider font-bold">Description</div>
          <div class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed">
            {{ localDetail.description }}
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="localDetail.remarks" class="bg-elevated/50 rounded-xl border border-default p-4">
          <div class="text-xs text-muted mb-2 uppercase tracking-wider font-bold">Remarks</div>
          <div class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed">
            {{ localDetail.remarks }}
          </div>
        </div>

        <!-- Rejected info box -->
        <div
          v-if="isRejected"
          class="flex flex-col gap-2 p-4 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-alert-octagon" class="w-5 h-5 shrink-0" />
            <p class="text-sm font-bold uppercase tracking-wide">MPO Rejected</p>
          </div>
          <div class="text-sm ml-8">
            <p v-if="localDetail.remarks" class="font-medium italic">"{{ localDetail.remarks }}"</p>
            <p class="opacity-90 mt-1">
              Click <strong>Edit &amp; Resubmit</strong> to fix it and change the supplier if needed.
            </p>
          </div>
        </div>

        <!-- Order Items Table — Pure Read-Only -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default min-w-[200px]">Part</th>
                <th class="p-3 font-medium border-r border-default w-32 text-center">Qty</th>
                <th class="p-3 font-medium border-r border-default w-24 text-center">UOM</th>
                <th class="p-3 font-medium border-r border-default w-40 text-right">Price/Pcs</th>
                <th class="p-3 font-medium border-r border-default w-44 text-right">Subtotal</th>
                <th class="p-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="detailItems.length === 0">
                <td colspan="6" class="p-8 text-center text-muted text-sm">No items in this MPO.</td>
              </tr>
              <tr
                v-for="item in detailItems"
                :key="item.part_id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20"
              >
                <td class="p-3 border-r border-default">
                  <div class="font-medium">{{ item.part_number }}</div>
                  <div class="text-xs text-muted line-clamp-1">{{ item.part_name }}</div>
                </td>
                <td class="p-3 border-r border-default text-center">
                  <span class="font-mono font-semibold">{{ item.qty }}</span>
                </td>
                <td class="p-2 border-r border-default text-center">
                  <UBadge color="neutral" variant="subtle" size="xs">
                    {{ item.uom_code || '-' }}
                  </UBadge>
                </td>
                <td class="p-3 border-r border-default text-right">
                  <span class="font-mono text-xs">{{ formatCurrency(item.price) }}</span>
                </td>
                <td class="p-3 border-r border-default text-right">
                  <span class="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {{ formatCurrency(item.qty * item.price) }}
                  </span>
                </td>
                <td class="p-3">
                  <span class="text-xs text-muted">{{ item.notes || '-' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total row -->
        <div class="flex justify-end">
          <div class="bg-elevated/50 rounded-xl border border-default px-5 py-3 flex items-center gap-4">
            <span class="text-sm text-muted">Total Order Value</span>
            <span class="text-base font-bold text-primary-600 dark:text-primary-400">
              {{ formatCurrency(totalPrice) }}
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Review Modal ── -->
    <UModal
      v-model:open="isReviewOpen"
      title="Review MPO"
      description="Approve or reject this Purchase Order"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Action" required>
            <USelectMenu
              v-model="reviewForm.action"
              :items="['approve', 'reject']"
              class="w-full"
            />
          </UFormField>
          <UFormField v-if="reviewForm.action === 'reject'" label="Rejection Notes" required>
            <UTextarea
              v-model="reviewForm.notes"
              placeholder="Enter rejection reason..."
              class="w-full"
              rows="3"
            />
          </UFormField>
          <UFormField v-else label="Notes (Optional)">
            <UTextarea
              v-model="reviewForm.notes"
              placeholder="Add approval notes if needed..."
              class="w-full"
              rows="2"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isReviewOpen = false" />
          <UButton
            color="primary"
            label="Submit Review"
            :loading="store.loading"
            @click="confirmReview"
          />
        </div>
      </template>
    </UModal>

    <!-- ── Logs Modal ── -->
    <UModal
      v-model:open="isLogsOpen"
      title="MPO Logs"
      description="Historical changes of this Purchase Order"
      class="sm:max-w-3xl"
    >
      <template #body>
        <div class="max-h-[60vh] overflow-y-auto pr-2">
          <div v-if="!localDetail?.logs || localDetail.logs.length === 0" class="text-center py-8 text-muted">
            No logs found for this MPO.
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="log in localDetail.logs"
              :key="log.id"
              class="relative pl-6 pb-4 border-l border-default last:pb-0"
            >
              <div class="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold" :class="getLogActionColor(log.action)">{{ log.action }}</span>
                  <span class="text-sm text-muted">{{ new Date(log.created_at).toLocaleString() }}</span>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div class="flex gap-2">
                    <span class="text-muted">By:</span>
                    <span class="font-medium">{{ log.user?.user_detail?.full_name || log.user?.email || '-' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted">Status:</span>
                    <span class="font-medium capitalize">{{ log.status || '-' }}</span>
                  </div>
                </div>
                <div v-if="log.notes || log.remarks" class="mt-1">
                  <div class="p-2 rounded bg-elevated/50 border border-default text-sm italic text-muted">
                    {{ log.notes || log.remarks }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton
            color="neutral"
            variant="ghost"
            label="Close"
            @click="isLogsOpen = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>