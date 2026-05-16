<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSprStore } from '../../../../stores/sales/spr.store'
import type { Spr } from '../../../../types/sales/spr'
import { useAppToast } from '../../../../composables/useAppToast'
import { useAuthStore } from '../../../../stores/auth.store'

const props = defineProps<{
  sprId: number
  sprSummary: Spr | null
}>()

const emit = defineEmits<{
  edit: [spr: Spr]
  delete: [id: number]
  refreshList: []
}>()

const store = useSprStore()
const authStore = useAuthStore()
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Local detail state ───────────────────────────────────────────────────────
const loadingDetail = ref(false)

// ─── Load Detail ─────────────────────────────────────────────────────────────
async function loadDetail() {
  if (!props.sprId) return
  loadingDetail.value = true
  try {
    await store.fetchSprById(props.sprId)
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load SPR details', color: 'error' })
  } finally {
    loadingDetail.value = false
  }
}

watch(() => props.sprId, () => {
  loadDetail()
}, { immediate: true })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    'Draft': 'i-lucide-file-edit',
    'Submitted': 'i-lucide-user-check',
    'Waiting Review PPIC': 'i-lucide-clipboard-check',
    'Approved': 'i-lucide-check-circle',
    'Rejected': 'i-lucide-x-circle'
  }
  return map[status] || 'i-lucide-circle'
}

function getStatusLabel(status: string): string {
  if (status === 'Submitted') return 'Waiting Review Supervisor Sales'
  return status
}

function getSourceColor(source: string): any {
  return source === 'Automatic' ? 'info' : 'neutral'
}

function getSourceIcon(source: string): string {
  return source === 'Automatic' ? 'i-lucide-zap' : 'i-lucide-pencil-line'
}

// ─── Auth / Role ──────────────────────────────────────────────────────────────
const isSupervisorSales = computed(() => {
  const role = authStore.user?.role
  return role === 'Superadmin' || role === 'Supervisor Sales Order'
})

// ─── Computed State Guards ────────────────────────────────────────────────────
const isEditable = computed(() => store.detail?.status === 'Draft')

const canSubmit = computed(() =>
  store.detail?.status === 'Draft' &&
  (store.detail?.details?.length ?? 0) > 0
)

const canReviewSales = computed(() =>
  store.detail?.status === 'Submitted' && isSupervisorSales.value
)

// ─── Workflow: Submit ─────────────────────────────────────────────────────────
async function submitSpr() {
  try {
    await store.submitSpr(props.sprId)
    toastSuccess('SPR submitted for Sales review')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Workflow: Review ─────────────────────────────────────────────────────────
const isReviewOpen = ref(false)
const reviewMode = ref<'sales' | 'ppic'>('sales')
const reviewForm = ref({
  status: 'Approved' as 'Approved' | 'Rejected',
  remarks: ''
})

function openReviewModal(mode: 'sales' | 'ppic') {
  reviewMode.value = mode
  reviewForm.value = { status: 'Approved', remarks: '' }
  isReviewOpen.value = true
}

async function confirmReview() {
  if (reviewForm.value.status === 'Rejected' && !reviewForm.value.remarks) {
    toast.add({ title: 'Validation', description: 'Remarks are required when rejecting', color: 'error' })
    return
  }
  try {
    if (reviewMode.value === 'sales') {
      await store.reviewSalesSpr(props.sprId, reviewForm.value)
    } else {
      await store.reviewPpicSpr(props.sprId, reviewForm.value)
    }
    toastSuccess(`SPR ${reviewForm.value.status.toLowerCase()} successfully`)
    isReviewOpen.value = false
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Excel: Export ────────────────────────────────────────────────────────────
async function handleExport() {
  try {
    const blob = await store.exportSpr(props.sprId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SPR_${store.detail?.spr_number || props.sprId}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toastSuccess('Export successful')
  } catch (e: any) {
    toastError(e)
  }
}

async function handleExportLogSnapshot(logId: number) {
  try {
    const blob = await store.exportLogSnapshot(logId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const filename = `SPR_Log_${store.detail?.spr_number}_${logId}.xlsx`
    
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toastSuccess('Historical snapshot export successful')
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
  if (a.includes('update')) return 'text-primary-600 dark:text-primary-400'
  return 'text-primary'
}

function handleViewLogs() {
  isLogsOpen.value = true
}

// ─── Timeline step color ──────────────────────────────────────────────────────
function getStepState(step: number): 'complete' | 'current' | 'pending' {
  const status = store.detail?.status
  const order: Record<string, number> = {
    'Draft': 0,
    'Submitted': 2, // Skip Step 1 'Submitted' (Completed) and go to Step 2 'Waiting Review Sales'
    'Waiting Review PPIC': 3,
    'Approved': 4,
    'Rejected': -1
  }
  const current = order[status || 'Draft'] ?? 0
  if (status === 'Rejected') {
    return step === current ? 'current' : step < current ? 'complete' : 'pending'
  }
  if (step < current) return 'complete'
  if (step === current) return 'current'
  return 'pending'
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- Detail Header -->
    <div class="px-6 py-4 border-b border-default shrink-0">
      <!-- Loading -->
      <div v-if="loadingDetail" class="flex items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary" />
        <span class="text-sm text-muted">Loading detail...</span>
      </div>

      <div v-else-if="store.detail" class="space-y-3">
        <!-- Row 1: Title + Status -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-bold truncate">{{ store.detail.spr_number }}</h2>
            <p class="text-sm text-muted truncate">{{ store.detail.spr_name }}</p>
          </div>

          <!-- Source badge -->
          <UBadge :color="getSourceColor(store.detail.source)" variant="subtle" size="sm" class="shrink-0">
            <UIcon :name="getSourceIcon(store.detail.source)" class="w-3 h-3 mr-1" />
            {{ store.detail.source }}
          </UBadge>

          <!-- Status badge -->
          <div
            class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
            :class="{
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300': store.detail.status === 'Draft',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300': store.detail.status === 'Submitted',
              'bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300': store.detail.status === 'Waiting Review PPIC',
              'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300': store.detail.status === 'Approved',
              'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300': store.detail.status === 'Rejected',
            }"
          >
            <UIcon :name="getStatusIcon(store.detail.status)" class="w-3.5 h-3.5" />
            {{ getStatusLabel(store.detail.status) }}
          </div>
        </div>

        <!-- Row 2: Action Buttons -->
        <div class="flex items-center gap-1">
          <!-- Export Button -->
          <UButton
            label="Export"
            icon="i-lucide-file-spreadsheet"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="handleExport"
          />

          <!-- Logs -->
          <UButton
            label="Logs"
            icon="i-lucide-history"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="handleViewLogs"
          />

          <div class="w-px h-5 bg-default mx-1" />

          <!-- Edit -->
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Edit"
            :disabled="!isEditable"
            @click="sprSummary && emit('edit', sprSummary)"
          />

          <!-- Delete -->
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            label="Delete"
            :disabled="store.detail?.status !== 'Draft'"
            @click="emit('delete', sprId)"
          />

          <div class="flex-1" />

          <!-- Review Sales -->
          <UButton
            v-if="canReviewSales"
            icon="i-lucide-user-check"
            color="warning"
            variant="subtle"
            size="sm"
            label="Review Sales"
            :loading="store.loading"
            @click="openReviewModal('sales')"
          />

          <!-- Submit -->
          <UButton
            v-if="canSubmit"
            icon="i-lucide-send"
            color="primary"
            size="sm"
            label="Submit"
            :loading="store.loading"
            @click="submitSpr"
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

        <!-- Approval Timeline -->
        <div class="flex items-start gap-0 overflow-x-auto pb-1">
          <!-- Step 0: Draft -->
          <div class="flex flex-col items-center flex-1 min-w-[80px]">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="getStepState(0) === 'complete' ? 'bg-success-500 text-white' : getStepState(0) === 'current' ? 'bg-primary text-white' : 'bg-elevated border-2 border-default text-muted'"
            >
              <UIcon v-if="getStepState(0) === 'complete'" name="i-lucide-check" class="w-4 h-4" />
              <span v-else>1</span>
            </div>
            <p class="text-xs text-center mt-2 font-medium" :class="getStepState(0) === 'current' ? 'text-primary' : 'text-muted'">Draft</p>
          </div>

          <!-- Connector -->
          <div class="h-0.5 flex-1 mt-4 self-start" :class="getStepState(1) !== 'pending' ? 'bg-success-500' : 'bg-default'" />

          <!-- Step 1: Submitted -->
          <div class="flex flex-col items-center flex-1 min-w-[80px]">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="getStepState(1) === 'complete' ? 'bg-success-500 text-white' : getStepState(1) === 'current' ? 'bg-warning-500 text-white' : 'bg-elevated border-2 border-default text-muted'"
            >
              <UIcon v-if="getStepState(1) === 'complete'" name="i-lucide-check" class="w-4 h-4" />
              <span v-else>2</span>
            </div>
            <p class="text-xs text-center mt-2 font-medium" :class="getStepState(1) === 'current' ? 'text-warning-600 dark:text-warning-400' : 'text-muted'">Submitted</p>
          </div>

          <!-- Connector -->
          <div class="h-0.5 flex-1 mt-4 self-start" :class="getStepState(2) !== 'pending' ? 'bg-success-500' : 'bg-default'" />

          <!-- Step 2: Waiting Review Supervisor Sales -->
          <div class="flex flex-col items-center flex-1 min-w-[100px]">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="getStepState(2) === 'complete' ? 'bg-success-500 text-white' : getStepState(2) === 'current' ? 'bg-warning-500 text-white' : 'bg-elevated border-2 border-default text-muted'"
            >
              <UIcon v-if="getStepState(2) === 'complete'" name="i-lucide-check" class="w-4 h-4" />
              <span v-else>3</span>
            </div>
            <p class="text-xs text-center mt-2 font-medium" :class="getStepState(2) === 'current' ? 'text-warning-600 dark:text-warning-400' : 'text-muted'">Waiting Review<br>Sales</p>
          </div>

          <!-- Connector -->
          <div class="h-0.5 flex-1 mt-4 self-start" :class="getStepState(3) !== 'pending' ? 'bg-success-500' : 'bg-default'" />

          <!-- Step 3: Waiting Review PPIC -->
          <div class="flex flex-col items-center flex-1 min-w-[80px]">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="getStepState(3) === 'complete' ? 'bg-success-500 text-white' : getStepState(3) === 'current' ? 'bg-info-500 text-white' : 'bg-elevated border-2 border-default text-muted'"
            >
              <UIcon v-if="getStepState(3) === 'complete'" name="i-lucide-check" class="w-4 h-4" />
              <span v-else>4</span>
            </div>
            <p class="text-xs text-center mt-2 font-medium" :class="getStepState(3) === 'current' ? 'text-info-600 dark:text-info-400' : 'text-muted'">Waiting Review<br>PPIC</p>
          </div>

          <!-- Connector -->
          <div class="h-0.5 flex-1 mt-4 self-start" :class="getStepState(4) !== 'pending' ? 'bg-success-500' : 'bg-default'" />

          <!-- Step 4: Approved -->
          <div class="flex flex-col items-center flex-1 min-w-[80px]">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="getStepState(4) === 'complete' || store.detail.status === 'Approved' ? 'bg-success-500 text-white' : 'bg-elevated border-2 border-default text-muted'"
            >
              <UIcon v-if="store.detail.status === 'Approved'" name="i-lucide-check" class="w-4 h-4" />
              <span v-else>5</span>
            </div>
            <p class="text-xs text-center mt-2 font-medium" :class="store.detail.status === 'Approved' ? 'text-success-600 dark:text-success-400' : 'text-muted'">Approved</p>
          </div>
        </div>

        <!-- Rejected Info Box -->
        <div
          v-if="store.detail.status === 'Rejected'"
          class="flex flex-col gap-2 p-4 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-alert-octagon" class="w-5 h-5 shrink-0" />
            <p class="text-sm font-bold uppercase tracking-wide">SPR Rejected</p>
          </div>
          <p v-if="store.detail.remarks" class="text-sm ml-8 opacity-90 italic">"{{ store.detail.remarks }}"</p>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Request Date</div>
            <div class="text-sm font-semibold">{{ formatDate(store.detail.request_date) }}</div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Required Date</div>
            <div class="text-sm font-semibold text-warning-600 dark:text-warning-400">
              {{ formatDate(store.detail.required_date) }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Created By</div>
            <div class="text-sm font-semibold">{{ store.detail.creator?.user_detail?.full_name || store.detail.creator?.email || '-' }}</div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Source Forecast</div>
            <div class="text-sm font-semibold">{{ store.detail.forecast?.forecast_number || '-' }}</div>
          </div>
        </div>

        <!-- Approver Info Row -->
        <div v-if="store.detail.sales_order_approver || store.detail.ppic_approver" class="grid grid-cols-2 gap-3">
          <div v-if="store.detail.sales_order_approver" class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Sales Approver</div>
            <div class="text-sm font-semibold flex items-center gap-1.5">
              <UIcon name="i-lucide-user-check" class="w-3.5 h-3.5 text-success-500" />
              {{ store.detail.sales_order_approver?.user_detail?.full_name || store.detail.sales_order_approver?.email }}
            </div>
          </div>
          <div v-if="store.detail.ppic_approver" class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">PPIC Approver</div>
            <div class="text-sm font-semibold flex items-center gap-1.5">
              <UIcon name="i-lucide-clipboard-check" class="w-3.5 h-3.5 text-success-500" />
              {{ store.detail.ppic_approver?.user_detail?.full_name || store.detail.ppic_approver?.email }}
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="store.detail.description" class="p-3 rounded-xl border border-default bg-elevated/30 text-sm text-muted">
          <UIcon name="i-lucide-info" class="w-3.5 h-3.5 inline mr-1.5" />
          {{ store.detail.description }}
        </div>

        <!-- Part Details Table -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default w-10 text-center">#</th>
                <th class="p-3 font-medium border-r border-default">Part Number</th>
                <th class="p-3 font-medium border-r border-default">Part Name</th>
                <th class="p-3 font-medium text-center w-32">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.detail.details || store.detail.details.length === 0">
                <td colspan="4" class="p-8 text-center text-muted text-sm">
                  <UIcon name="i-lucide-package-open" class="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No parts in this SPR.
                </td>
              </tr>
              <tr
                v-for="(detail, idx) in store.detail.details"
                :key="detail.id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20 transition-colors"
              >
                <td class="p-3 border-r border-default text-center text-muted text-xs">{{ idx + 1 }}</td>
                <td class="p-3 border-r border-default font-mono text-xs font-medium">{{ detail.part?.part_number || '-' }}</td>
                <td class="p-3 border-r border-default text-sm">{{ detail.part?.part_name || '-' }}</td>
                <td class="p-3 text-center font-semibold font-mono">{{ detail.qty.toLocaleString() }}</td>
              </tr>
            </tbody>
            <tfoot v-if="store.detail.details && store.detail.details.length > 0" class="bg-elevated/30">
              <tr class="border-t border-default">
                <td colspan="3" class="p-3 text-right text-sm font-bold text-muted">Total</td>
                <td class="p-3 text-center font-bold font-mono text-primary">
                  {{ store.detail.details.reduce((sum, d) => sum + d.qty, 0).toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </template>
    </div>

    <!-- ── Review Modal ─────────────────────────────────────────────────────── -->
    <UModal
      v-model:open="isReviewOpen"
      :title="reviewMode === 'sales' ? 'Review SPR — Supervisor Sales' : 'Review SPR — Supervisor PPIC'"
      description="Approve or reject this Sales Purchase Request"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Decision" required>
            <USelectMenu
              v-model="reviewForm.status"
              :items="['Approved', 'Rejected']"
              class="w-full"
            />
          </UFormField>
          <UFormField v-if="reviewForm.status === 'Rejected'" label="Remarks" required>
            <UTextarea
              v-model="reviewForm.remarks"
              placeholder="Enter rejection reason..."
              class="w-full"
              rows="3"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isReviewOpen = false" />
          <UButton
            :color="reviewForm.status === 'Approved' ? 'success' : 'error'"
            :label="reviewForm.status === 'Approved' ? 'Approve' : 'Reject'"
            :loading="store.loading"
            @click="confirmReview"
          />
        </div>
      </template>
    </UModal>


    <!-- ── Logs Modal ───────────────────────────────────────────────────────── -->
    <UModal v-model:open="isLogsOpen" title="SPR Logs" description="Historical changes of this SPR" class="sm:max-w-3xl">
      <template #body>
        <div class="max-h-[60vh] overflow-y-auto pr-2">
          <div v-if="store.logs.length === 0" class="text-center py-8 text-muted">
            No logs found for this SPR.
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="log in store.logs"
              :key="log.id"
              class="relative pl-6 pb-4 border-l border-default last:pb-0"
            >
              <div class="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold" :class="getLogActionColor(log.action)">{{ log.action }}</span>
                  <span class="text-xs text-muted">{{ new Date(log.createdAt).toLocaleString() }}</span>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div class="flex gap-2">
                    <span class="text-muted">By:</span>
                    <span class="font-medium">{{ log.user?.user_detail?.full_name || log.user?.email }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted">Status:</span>
                    <span class="font-medium">{{ log.status }}</span>
                  </div>
                </div>
                <div v-if="log.remarks || log.snapshot" class="mt-1 flex flex-col gap-2">
                  <div v-if="log.remarks" class="p-2 rounded bg-elevated/50 border border-default text-xs italic text-muted">
                    {{ log.remarks }}
                  </div>
                  <div v-if="log.snapshot" class="flex justify-end">
                    <UButton
                      icon="i-lucide-download"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      label="Download Snapshot"
                      @click="handleExportLogSnapshot(log.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Close" @click="isLogsOpen = false" />
        </div>
      </template>
    </UModal>

  </div>
</template>
