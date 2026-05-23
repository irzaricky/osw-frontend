<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMrpStore } from '../../../../stores/material/mrp.store'
import type { Mrp } from '../../../../types/material/mrp'
import { useAppToast } from '../../../../composables/useAppToast'
import { useAuthStore } from '../../../../stores/auth.store'

const props = defineProps<{
  mrpId: number
  mrpSummary: Mrp | null
}>()

const emit = defineEmits<{
  edit: [mrp: Mrp]
  delete: [id: number]
  refreshList: []
}>()

const store = useMrpStore()
const authStore = useAuthStore()
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Data ─────────────────────────────────────────────────────────────────────
const localDetail = ref<Mrp | null>(null)
const loadingDetail = ref(false)
const isDirty = ref(false)

const editableDetails = ref<{
  part_id: number
  qty: number
  bom_id?: number
  notes?: string
  part_number?: string
  part_name?: string
  uom_code?: string
}[]>([])

watch(editableDetails, () => {
  if (!loadingDetail.value) isDirty.value = true
}, { deep: true })

defineExpose({
  isDirty,
  resetDirty: () => { isDirty.value = false }
})

// ─── Role ─────────────────────────────────────────────────────────────────────
const isSupervisor = computed(() => {
  const role = authStore.user?.role
  return role === 'Superadmin' || role === 'Supervisor Material'
})

const isEditable = computed(() =>
  localDetail.value?.status === 'Draft' || localDetail.value?.status === 'Submitted'
)

// ─── Load ──────────────────────────────────────────────────────────────────────
async function loadDetail() {
  if (!props.mrpId) return
  loadingDetail.value = true
  try {
    const data = await store.fetchMrpById(props.mrpId)
    if (data?.data) {
      localDetail.value = data.data
      setupEditableDetails(data.data)
    }
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load MRP details', color: 'error' })
  } finally {
    loadingDetail.value = false
    setTimeout(() => { isDirty.value = false }, 50)
  }
}

function setupEditableDetails(mrp: Mrp) {
  editableDetails.value = (mrp.details || []).map(d => ({
    part_id: d.part_id,
    qty: d.qty,
    bom_id: d.bom_id ?? undefined,
    notes: d.notes ?? undefined,
    part_number: d.part?.part_number,
    part_name: d.part?.part_name,
    uom_code: d.part?.uom?.code
  }))
}

watch(() => props.mrpId, () => { loadDetail() }, { immediate: true })

onMounted(() => {
  store.fetchDropdownParts()
})

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

function getPriorityColor(priority: string): any {
  const map: Record<string, string> = { High: 'error', Medium: 'warning', Low: 'success' }
  return map[priority] || 'neutral'
}

// ─── Fill stats ───────────────────────────────────────────────────────────────
const fillStats = computed(() => {
  const total = editableDetails.value.length
  const filled = editableDetails.value.filter(d => d.qty > 0).length
  return { total, filled, pct: total === 0 ? 100 : Math.round((filled / total) * 100) }
})

// ─── Part add ─────────────────────────────────────────────────────────────────
const selectedNewParts = ref<number[]>([])

const availableParts = computed(() => {
  const existingIds = editableDetails.value.map(d => d.part_id)
  return store.partsDropdown.filter(p => !existingIds.includes(p.id))
})

const partItems = computed(() => availableParts.value.map(p => p.part_name))

const selectedPartLabels = computed({
  get: () => selectedNewParts.value
    .map(id => store.partsDropdown.find(p => p.id === id)?.part_name)
    .filter(Boolean) as string[],
  set: (vals: string[]) => {
    selectedNewParts.value = vals
      .map(name => store.partsDropdown.find(p => p.part_name === name)?.id)
      .filter(Boolean) as number[]
  }
})

function addNewPart() {
  if (!selectedNewParts.value.length) return
  selectedNewParts.value.forEach(partId => {
    const part = store.partsDropdown.find(p => p.id === partId)
    if (!part || editableDetails.value.find(d => d.part_id === partId)) return
    editableDetails.value.push({
      part_id: part.id,
      qty: 0,
      part_number: part.part_number,
      part_name: part.part_name,
      uom_code: part.uom?.code
    })
  })
  selectedNewParts.value = []
}

function removePart(partId: number) {
  editableDetails.value = editableDetails.value.filter(d => d.part_id !== partId)
}

// ─── Save details ──────────────────────────────────────────────────────────────
async function saveChanges() {
  if (!localDetail.value) return
  try {
    await store.updateMrpDetail(localDetail.value.id, {
      details: editableDetails.value.map(d => ({
        part_id: d.part_id,
        qty: d.qty,
        bom_id: d.bom_id,
        notes: d.notes
      }))
    })
    isDirty.value = false
    toastSuccess('MRP details saved successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitMrp() {
  if (isDirty.value) {
    try { await saveChanges() } catch { return }
  }
  if (!localDetail.value) return
  try {
    await store.submitMrp(localDetail.value.id)
    toastSuccess('MRP submitted successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Review ───────────────────────────────────────────────────────────────────
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
    toast.add({ title: 'Error', description: 'Notes are required when rejecting', color: 'error' })
    return
  }
  if (!localDetail.value) return
  try {
    await store.reviewMrp(localDetail.value.id, {
      action: reviewForm.value.action,
      notes: reviewForm.value.notes || undefined
    })
    toastSuccess(`MRP ${reviewForm.value.action === 'approve' ? 'approved' : 'rejected'} successfully`)
    isReviewOpen.value = false
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
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
        <!-- Row 1: Number, Status pill, Fill stats -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0">
            <h2 class="text-lg font-bold truncate">
              {{ localDetail.number }}
            </h2>
            <p class="text-sm text-muted truncate">
              {{ localDetail.sales_plan?.spr_number || localDetail.production_plan?.plan_number || '-' }}
            </p>
          </div>

          <!-- Status pill — same style as forecast -->
          <div
            class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
            :class="{
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300': localDetail.status === 'Draft',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300': localDetail.status === 'Submitted',
              'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300': localDetail.status === 'Approved',
              'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300': localDetail.status === 'Rejected',
            }"
          >
            <UIcon :name="getStatusIcon(localDetail.status)" class="w-3.5 h-3.5" />
            {{ localDetail.status }}
          </div>

          <!-- Fill stats -->
          <div
            v-if="editableDetails.length > 0"
            class="flex items-center gap-1.5 shrink-0 ml-auto"
            :class="fillStats.pct === 100 ? 'text-success-500' : fillStats.pct >= 50 ? 'text-warning-500' : 'text-error-500'"
          >
            <UIcon
              :name="fillStats.pct === 100 ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
              class="w-4 h-4"
            />
            <span class="text-xs font-medium">{{ fillStats.filled }}/{{ fillStats.total }} filled</span>
          </div>
        </div>

        <!-- Row 2: Action buttons — same layout as forecast -->
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Edit"
            :disabled="!isEditable"
            @click="mrpSummary && emit('edit', mrpSummary as any)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            label="Delete"
            :disabled="localDetail.status !== 'Draft'"
            @click="emit('delete', mrpId)"
          />

          <div class="flex-1" />

          <!-- Primary actions right-aligned -->
          <UButton
            v-if="localDetail.status === 'Draft' && editableDetails.length > 0"
            icon="i-lucide-send"
            color="warning"
            variant="subtle"
            size="sm"
            label="Submit"
            :loading="store.loading"
            @click="submitMrp"
          />
          <UButton
            v-if="localDetail.status === 'Submitted' && isSupervisor"
            icon="i-lucide-check-square"
            color="success"
            variant="subtle"
            size="sm"
            label="Review"
            @click="openReviewModal"
          />
          <UButton
            v-if="localDetail.status === 'Draft' || localDetail.status === 'Submitted'"
            icon="i-lucide-save"
            color="primary"
            size="sm"
            label="Save"
            :loading="store.loading"
            @click="saveChanges"
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
        <!-- Summary Cards — 4-col grid same as forecast -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Priority
            </div>
            <div class="text-sm font-semibold">
              <UBadge
                v-if="localDetail.priority"
                :color="getPriorityColor(localDetail.priority)"
                variant="subtle"
                size="sm"
              >
                {{ localDetail.priority }}
              </UBadge>
              <span v-else>-</span>
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Sales Plan
            </div>
            <div class="text-sm font-semibold truncate">
              {{ localDetail.sales_plan?.spr_number || '-' }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Created By
            </div>
            <div class="text-sm font-semibold truncate">
              {{ localDetail.creator?.user_detail?.full_name || localDetail.creator?.email || '-' }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">
              Approved By
            </div>
            <div class="text-sm font-semibold truncate">
              {{ localDetail.approver?.user_detail?.full_name || localDetail.approver?.email || '-' }}
            </div>
          </div>
        </div>

        <!-- Description Card -->
        <div v-if="localDetail.description" class="bg-elevated/50 rounded-xl border border-default p-4">
          <div class="text-xs text-muted mb-2 uppercase tracking-wider font-bold">
            Description
          </div>
          <div class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed">
            {{ localDetail.description }}
          </div>
        </div>

        <!-- Notes Card -->
        <div v-if="localDetail.notes" class="bg-elevated/50 rounded-xl border border-default p-4">
          <div class="text-xs text-muted mb-2 uppercase tracking-wider font-bold">
            Notes
          </div>
          <div class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed">
            {{ localDetail.notes }}
          </div>
        </div>

        <!-- Rejected info box -->
        <div
          v-if="localDetail.status === 'Rejected' && localDetail.rejected_notes"
          class="flex flex-col gap-2 p-4 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-alert-octagon" class="w-5 h-5 shrink-0" />
            <p class="text-sm font-bold uppercase tracking-wide">
              MRP Rejected
            </p>
          </div>
          <div class="text-sm ml-8 space-y-2">
            <p class="font-medium italic">
              "{{ localDetail.rejected_notes }}"
            </p>
            <p class="opacity-90">
              Please review and update the materials before resubmitting for approval.
            </p>
          </div>
        </div>

        <!-- Unfilled warning banner -->
        <div
          v-if="editableDetails.length > 0 && fillStats.pct < 100"
          class="flex items-center gap-3 p-3 rounded-xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300"
        >
          <UIcon name="i-lucide-triangle-alert" class="w-4 h-4 shrink-0" />
          <p class="text-sm">
            <span class="font-semibold">{{ fillStats.total - fillStats.filled }} item(s) with zero qty.</span>
          </p>
        </div>

        <!-- Add Material section -->
        <div class="flex items-end gap-2 bg-elevated/30 p-4 rounded-xl border border-default">
          <UFormField label="Add Material to MRP" class="flex-1 max-w-sm">
            <USelectMenu
              v-model="selectedPartLabels"
              :items="partItems"
              placeholder="Search and select parts..."
              class="w-full"
              clear
              searchable
              multiple
              :disabled="!isEditable"
            />
          </UFormField>
          <UButton
            label="Add"
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            :disabled="selectedNewParts.length === 0 || !isEditable"
            @click="addNewPart"
          />
        </div>

        <!-- Material Table -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default min-w-[220px]">
                  Part
                </th>
                <th class="p-3 font-medium border-r border-default w-40 text-center">
                  Qty Needed
                </th>
                <th class="p-3 font-medium border-r border-default w-24 text-center">
                  UOM
                </th>
                <th class="p-3 font-medium border-r border-default">
                  Notes
                </th>
                <th class="p-3 font-medium w-14 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="editableDetails.length === 0">
                <td colspan="5" class="p-8 text-center text-muted text-sm">
                  No materials added to this MRP yet.
                </td>
              </tr>
              <tr
                v-for="item in editableDetails"
                :key="item.part_id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20"
              >
                <td class="p-3 border-r border-default">
                  <div class="font-medium">
                    {{ item.part_number }}
                  </div>
                  <div class="text-xs text-muted line-clamp-1">
                    {{ item.part_name }}
                  </div>
                </td>
                <td
                  class="p-2 border-r border-default text-center"
                  :class="{ 'bg-error-300 dark:bg-error-900/70': item.qty === 0 }"
                >
                  <UInput
                    v-if="isEditable"
                    v-model.number="item.qty"
                    type="number"
                    size="sm"
                    placeholder="Qty"
                    min="0"
                    class="max-w-[120px] mx-auto"
                  />
                  <span v-else class="font-mono font-semibold">{{ item.qty }}</span>
                </td>
                <td class="p-2 border-r border-default text-center">
                  <UBadge color="neutral" variant="subtle" size="xs">
                    {{ item.uom_code || '-' }}
                  </UBadge>
                </td>
                <td class="p-2 border-r border-default">
                  <UInput
                    v-if="isEditable"
                    v-model="item.notes"
                    size="sm"
                    placeholder="Notes..."
                    class="w-full"
                  />
                  <span v-else class="text-xs text-muted">{{ item.notes || '-' }}</span>
                </td>
                <td class="p-3 text-center">
                  <UButton
                    icon="i-lucide-trash"
                    color="error"
                    variant="ghost"
                    size="sm"
                    :disabled="!isEditable"
                    @click="removePart(item.part_id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Review Modal -->
    <UModal
      v-model:open="isReviewOpen"
      title="Review MRP"
      description="Review and update MRP status"
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
              placeholder="Enter rejection notes..."
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
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="isReviewOpen = false"
          />
          <UButton
            color="primary"
            label="Submit Review"
            :loading="store.loading"
            @click="confirmReview"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>