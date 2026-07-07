<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch } from 'vue'
import { useMprStore } from '../../../../stores/material/mpr.store'
import type { Mpr } from '../../../../types/material/mpr'
import { useAppToast } from '../../../../composables/useAppToast'

const props = defineProps<{
  mprId: number
  mprSummary: Mpr | null
}>()

const emit = defineEmits<{
  edit: [mpr: Mpr]
  delete: [id: number]
  refreshList: []
}>()

const store = useMprStore()
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Local detail state ───────────────────────────────────────────────────────
const loadingDetail = ref(false)

// ─── Load Detail ─────────────────────────────────────────────────────────────
async function loadDetail() {
  if (!props.mprId) return
  loadingDetail.value = true
  try {
    await store.fetchMprById(props.mprId)
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load MPR details', color: 'error' })
  } finally {
    loadingDetail.value = false
  }
}

watch(() => props.mprId, () => {
  loadDetail()
}, { immediate: true })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    draft: 'i-lucide-file-edit',
    submitted: 'i-lucide-send',
    approved: 'i-lucide-check-circle',
    rejected: 'i-lucide-x-circle'
  }
  return map[status] || 'i-lucide-circle'
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

function getTypeIcon(type: string): string {
  return type === 'auto' ? 'i-lucide-zap' : 'i-lucide-pencil-line'
}

// ─── Computed State Guards ────────────────────────────────────────────────────
const isEditable = computed(() => store.detail?.status === 'draft')
const canSubmit = computed(() =>
  store.detail?.status === 'draft' &&
  (store.detail?.details?.length ?? 0) > 0
)
const canReview = computed(() => store.detail?.status === 'submitted')

// ─── Timeline step ────────────────────────────────────────────────────────────
function getStepState(step: number): 'complete' | 'current' | 'pending' {
  const status = store.detail?.status
  const order: Record<string, number> = {
    draft: 0,
    submitted: 1,
    approved: 2,
    rejected: -1
  }
  const current = order[status || 'draft'] ?? 0
  if (status === 'rejected') {
    return step === 1 ? 'current' : step < 1 ? 'complete' : 'pending'
  }
  if (step < current) return 'complete'
  if (step === current) return 'current'
  return 'pending'
}

// ─── Workflow: Submit ─────────────────────────────────────────────────────────
async function submitMpr() {
  try {
    await store.submitMpr(props.mprId)
    toastSuccess('MPR submitted for review')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Workflow: Review ─────────────────────────────────────────────────────────
const isReviewOpen = ref(false)
const reviewForm = ref({
  action: 'approve' as 'approve' | 'reject',
  notes: ''
})

function openReviewModal() {
  reviewForm.value = { action: 'approve', notes: '' }
  isReviewOpen.value = true
}

async function confirmReview() {
  if (reviewForm.value.action === 'reject' && !reviewForm.value.notes) {
    toast.add({ title: 'Validation', description: 'Notes are required when rejecting', color: 'error' })
    return
  }
  try {
    await store.reviewMpr(props.mprId, reviewForm.value)
    toastSuccess(`MPR ${reviewForm.value.action}d successfully`)
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
  if (a.includes('update')) return 'text-primary-600 dark:text-primary-400'
  return 'text-primary'
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
            <h2 class="text-lg font-bold truncate">
              {{ store.detail.number }}
            </h2>
            <p class="text-sm text-muted truncate">
              {{ store.detail.description }}
            </p>
          </div>

          <!-- Type badge -->
          <UBadge
            :color="getTypeColor(store.detail.type)"
            variant="subtle"
            size="sm"
            class="shrink-0 capitalize"
          >
            <UIcon :name="getTypeIcon(store.detail.type)" class="w-3 h-3 mr-1" />
            {{ store.detail.type }}
          </UBadge>

          <!-- Status badge -->
          <div
            class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
            :class="{
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300': store.detail.status === 'draft',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300': store.detail.status === 'submitted',
              'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300': store.detail.status === 'approved',
              'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300': store.detail.status === 'rejected',
            }"
          >
            <UIcon :name="getStatusIcon(store.detail.status)" class="w-3.5 h-3.5" />
            {{ getStatusLabel(store.detail.status) }}
          </div>
        </div>

        <!-- Row 2: Action Buttons -->
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

          <!-- Edit -->
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Edit"
            :disabled="!isEditable"
            @click="mprSummary && emit('edit', mprSummary)"
          />

          <!-- Delete -->
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            label="Delete"
            :disabled="store.detail?.status !== 'draft'"
            @click="emit('delete', mprId)"
          />

          <div class="flex-1" />

          <!-- Review -->
          <UButton
            v-if="canReview"
            icon="i-lucide-clipboard-check"
            color="warning"
            variant="subtle"
            size="sm"
            label="Review"
            :loading="store.loading"
            @click="openReviewModal"
          />

          <!-- Submit -->
          <UButton
            v-if="canSubmit"
            icon="i-lucide-send"
            color="primary"
            size="sm"
            label="Submit"
            :loading="store.loading"
            @click="submitMpr"
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
            <p class="text-xs text-center mt-2 font-medium" :class="getStepState(0) === 'current' ? 'text-primary' : 'text-muted'">
              Draft
            </p>
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
            <p class="text-xs text-center mt-2 font-medium" :class="getStepState(1) === 'current' ? 'text-warning-600 dark:text-warning-400' : 'text-muted'">
              Submitted
            </p>
          </div>

          <!-- Connector -->
          <div class="h-0.5 flex-1 mt-4 self-start" :class="getStepState(2) !== 'pending' ? 'bg-success-500' : 'bg-default'" />

          <!-- Step 2: Approved / Rejected -->
          <div class="flex flex-col items-center flex-1 min-w-[80px]">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="{
                'bg-success-500 text-white': store.detail.status === 'approved',
                'bg-error-500 text-white': store.detail.status === 'rejected',
                'bg-elevated border-2 border-default text-muted': store.detail.status !== 'approved' && store.detail.status !== 'rejected'
              }"
            >
              <UIcon
                v-if="store.detail.status === 'approved'"
                name="i-lucide-check"
                class="w-4 h-4"
              />
              <UIcon
                v-else-if="store.detail.status === 'rejected'"
                name="i-lucide-x"
                class="w-4 h-4"
              />
              <span v-else>3</span>
            </div>
            <p
              class="text-xs text-center mt-2 font-medium"
              :class="{
                'text-success-600 dark:text-success-400': store.detail.status === 'approved',
                'text-error-600 dark:text-error-400': store.detail.status === 'rejected',
                'text-muted': store.detail.status !== 'approved' && store.detail.status !== 'rejected'
              }"
            >
              Approved
            </p>
          </div>
        </div>

        <!-- Rejected Info Box -->
        <div
          v-if="store.detail.status === 'rejected'"
          class="flex flex-col gap-2 p-4 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-alert-octagon" class="w-5 h-5 shrink-0" />
            <p class="text-sm font-bold uppercase tracking-wide">
              MPR Rejected
            </p>
          </div>
          <p v-if="store.detail.remarks" class="text-sm ml-8 opacity-90 italic">
            "{{ store.detail.remarks }}"
          </p>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Request Date
            </div>
            <div class="text-sm font-semibold">
              {{ formatDate(store.detail.request_date) }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Required Date
            </div>
            <div class="text-sm font-semibold text-warning-600 dark:text-warning-400">
              {{ store.detail.details && store.detail.details.length > 0 ? formatDate(store.detail.details[0].required_date) : '-' }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Created By
            </div>
            <div class="text-sm font-semibold">
              {{ store.detail.creator?.user_detail?.full_name || store.detail.creator?.email || '-' }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Approved By
            </div>
            <div class="text-sm font-semibold flex items-center gap-1.5">
              <UIcon v-if="store.detail.approver" name="i-lucide-user-check" class="w-3.5 h-3.5 text-success-500" />
              {{ store.detail.approver?.user_detail?.full_name || store.detail.approver?.email || '-' }}
            </div>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="store.detail.remarks && store.detail.status !== 'rejected'" class="p-3 rounded-xl border border-default bg-elevated/30 text-sm text-muted">
          <UIcon name="i-lucide-info" class="w-3.5 h-3.5 inline mr-1.5" />
          {{ store.detail.remarks }}
        </div>

        <!-- Part Details Table -->
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
                <th class="p-3 font-medium border-r border-default text-center w-28">
                  Qty
                </th>
                <th class="p-3 font-medium border-r border-default w-32">
                  Required Date
                </th>
                <th class="p-3 font-medium">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.detail.details || store.detail.details.length === 0">
                <td colspan="6" class="p-8 text-center text-muted text-sm">
                  <UIcon name="i-lucide-package-open" class="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No parts in this MPR.
                </td>
              </tr>
              <tr
                v-for="(detail, idx) in store.detail.details"
                :key="detail.id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20 transition-colors"
              >
                <td class="p-3 border-r border-default text-center text-muted text-xs">
                  {{ idx + 1 }}
                </td>
                <td class="p-3 border-r border-default font-mono text-xs font-medium">
                  {{ detail.part?.part_number || '-' }}
                </td>
                <td class="p-3 border-r border-default text-sm">
                  {{ detail.part?.part_name || '-' }}
                </td>
                <td class="p-3 border-r border-default text-center font-semibold font-mono">
                  {{ detail.qty.toLocaleString() }}
                </td>
                <td class="p-3 border-r border-default text-xs">
                  {{ formatDate(detail.required_date) }}
                </td>
                <td class="p-3 text-xs text-muted">
                  {{ detail.notes || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="store.detail.details && store.detail.details.length > 0" class="bg-elevated/30">
              <tr class="border-t border-default">
                <td colspan="3" class="p-3 text-right text-sm font-bold text-muted">
                  Total
                </td>
                <td class="p-3 text-center font-bold font-mono text-primary">
                  {{ store.detail.details.reduce((sum, d) => sum + d.qty, 0).toLocaleString() }}
                </td>
                <td colspan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </div>

    <!-- ── Review Modal ─────────────────────────────────────────────────────── -->
    <UModal
      v-model:open="isReviewOpen"
      title="Review MPR"
      description="Approve or reject this Material Purchase Request"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Decision" required>
            <USelectMenu
              v-model="reviewForm.action"
              :items="[{ value: 'approve', label: 'Approve' }, { value: 'reject', label: 'Reject' }]"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField v-if="reviewForm.action === 'reject'" label="Notes" required>
            <UTextarea
              v-model="reviewForm.notes"
              placeholder="Enter rejection reason..."
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
            @click="isReviewOpen = false"
          />
          <UButton
            :color="reviewForm.action === 'approve' ? 'success' : 'error'"
            :label="reviewForm.action === 'approve' ? 'Approve' : 'Reject'"
            :loading="store.loading"
            @click="confirmReview"
          />
        </div>
      </template>
    </UModal>

    <!-- ── Logs Modal ───────────────────────────────────────────────────────── -->
    <UModal
      v-model:open="isLogsOpen"
      title="MPR Logs"
      description="Historical changes of this MPR"
      class="sm:max-w-2xl"
    >
      <template #body>
        <div class="max-h-[60vh] overflow-y-auto pr-2">
          <div v-if="store.logs.length === 0" class="text-center py-8 text-muted">
            No logs found for this MPR.
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
                  <span class="text-xs text-muted">{{ new Date(log.created_at).toLocaleString() }}</span>
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