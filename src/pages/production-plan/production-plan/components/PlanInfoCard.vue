<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AvailableDO, PlanType, PlanDetail } from '../../../../types/production-plan/plan'

const props = defineProps<{
  isCreate:    boolean
  isDetail:    boolean
  currentPlan: any
  headerForm:  {
    plan_month:       string
    plan_type:        PlanType
    parent_plan_id?:  number | null
    plan_description: string
    notes:            string
  }
  saving:      boolean
  fmtDate:     (d?: string | null) => string
  fmtNum:      (n?: number | null) => string
  pendingDos:  AvailableDO[]
  approvedOriginalPlans?: { id: number; plan_number: string; plan_month: string }[]
}>()

const emit = defineEmits<{
  (e: 'open-do-modal'): void
  (e: 'remove-pending', id: number): void
  (e: 'remove-do', id: number): void
  (e: 'undo-remove-do', id: number): void  // ← tambahan
}>()

// Track DO IDs that user has marked for removal (pending removal, not yet saved)
const pendingRemoveDoIds = ref<Set<number>>(new Set())

function fmtPlanMonth(plan_month?: string): string {
  if (!plan_month) return '-'
  const [year, month] = plan_month.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getPlanMonthOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i <= 3; i++) {
    const d     = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ label, value })
  }
  return options
}

const planMonthOptions = getPlanMonthOptions()

const planTypeOptions: { label: string; value: PlanType }[] = [
  { label: 'Original',  value: 'ORIGINAL' },
  { label: 'Amendment', value: 'AMENDMENT' },
]

const planTypeLabel: Record<PlanType, string> = {
  ORIGINAL:  'Original',
  AMENDMENT: 'Amendment',
}

// Build unique DO entries from details, including do_number from delivery_order
const existingDoEntries = computed<{ do_id: number; do_number: string }[]>(() => {
  if (!props.currentPlan?.details?.length) return []
  const seen = new Set<number>()
  const result: { do_id: number; do_number: string }[] = []
  for (const d of props.currentPlan.details as PlanDetail[]) {
    if (!seen.has(d.do_id)) {
      seen.add(d.do_id)
      result.push({
        do_id:     d.do_id,
        do_number: d.delivery_order?.do_number ?? `DO #${d.do_id}`,
      })
    }
  }
  return result
})

function handleRemoveDo(doId: number) {
  pendingRemoveDoIds.value = new Set([...pendingRemoveDoIds.value, doId])
  emit('remove-do', doId)
}

function handleRemovePending(doId: number) {
  emit('remove-pending', doId)
}

// Reset pending remove state when parent refreshes data (plan changes)
// Parent should call this via template ref if needed, or it resets naturally on re-render
function resetPendingRemove() {
  pendingRemoveDoIds.value = new Set()
}

defineExpose({ resetPendingRemove })
</script>

<template>
  <div class="bg-default border border-default rounded-xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-primary" />
        Plan Info
      </h2>
      <UBadge v-if="isCreate" label="New" color="primary" variant="soft" size="sm" />
      <UBadge v-else-if="isDetail" label="Edit Mode" color="warning" variant="soft" size="sm" />
    </div>

    <!-- Summary bar (detail / edit mode) -->
    <div
      v-if="!isCreate && currentPlan"
      class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-8 divide-x divide-default border-b border-default"
    >
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Plan Month</p>
        <p class="text-sm font-semibold">{{ fmtPlanMonth(currentPlan.plan_month) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Type</p>
        <div class="flex items-center gap-1.5">
          <p class="text-sm font-semibold">{{ planTypeLabel[currentPlan.plan_type as PlanType] ?? currentPlan.plan_type }}</p>
          <UTooltip
            v-if="currentPlan.plan_type === 'AMENDMENT' && currentPlan.parent_plan"
            :text="`Parent: ${currentPlan.parent_plan.plan_number}`"
          >
            <UIcon name="i-lucide-git-branch" class="w-3.5 h-3.5 text-muted" />
          </UTooltip>
        </div>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Plan Number</p>
        <p class="text-sm font-semibold font-mono">{{ currentPlan.plan_number }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Earliest Delivery</p>
        <p class="text-sm font-semibold">{{ fmtDate(currentPlan.earliest_delivery_date) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Latest Delivery</p>
        <p class="text-sm font-semibold">{{ fmtDate(currentPlan.latest_delivery_date) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Total Products</p>
        <p class="text-sm font-semibold">{{ fmtNum(currentPlan.total_products) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Total Requested Qty</p>
        <p class="text-sm font-semibold">{{ fmtNum(currentPlan.total_qty_request) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Total Capacity Qty</p>
        <p
          class="text-sm font-semibold"
          :class="{
            'text-success-600': (currentPlan.total_qty_capacity ?? 0) >= currentPlan.total_qty_request,
            'text-error-600':   (currentPlan.total_qty_capacity ?? 0) < currentPlan.total_qty_request,
          }"
        >
          {{ fmtNum(currentPlan.total_qty_capacity) }}
        </p>
      </div>
    </div>

    <!-- Form fields -->
    <div class="px-5 py-4 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField v-if="isCreate" label="Plan Type" required>
          <USelect
            v-model="headerForm.plan_type"
            :items="planTypeOptions"
            value-key="value"
            label-key="label"
            placeholder="Select plan type"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField
          v-if="isCreate && headerForm.plan_type === 'ORIGINAL'"
          label="Plan Month"
          required
        >
          <USelect
            v-model="headerForm.plan_month"
            :items="planMonthOptions"
            value-key="value"
            label-key="label"
            placeholder="Select plan month"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField
          v-if="isCreate && headerForm.plan_type === 'AMENDMENT'"
          label="Parent Plan (Approved Original)"
          required
        >
          <USelect
            v-model="headerForm.parent_plan_id"
            :items="(approvedOriginalPlans ?? []).map(p => ({
              label: `${p.plan_number} — ${p.plan_month}`,
              value: p.id,
            }))"
            value-key="value"
            label-key="label"
            placeholder="Select parent plan"
            class="w-full"
            :disabled="saving || !(approvedOriginalPlans ?? []).length"
          />
          <p v-if="!(approvedOriginalPlans ?? []).length" class="text-xs text-muted mt-1">
            No approved Original plans available.
          </p>
        </UFormField>

        <UFormField label="Plan Description">
          <UInput
            v-model="headerForm.plan_description"
            placeholder="e.g. March 2026 Production Batch"
            class="w-full"
            :disabled="(!isCreate && !isDetail) || saving"
          />
        </UFormField>
        <UFormField label="Notes">
          <UInput
            v-model="headerForm.notes"
            placeholder="Additional notes (optional)"
            class="w-full"
            :disabled="(!isCreate && !isDetail) || saving"
          />
        </UFormField>
      </div>

      <!-- DO reference chips -->
      <div
        v-if="!isCreate && (existingDoEntries.length || pendingDos.length)"
        class="space-y-1.5"
      >
        <p class="text-xs text-muted font-medium flex items-center gap-1.5">
          <UIcon name="i-lucide-link-2" class="w-3.5 h-3.5" />
          Delivery Order References
          <span
            v-if="isDetail && (pendingRemoveDoIds.size > 0 || pendingDos.length > 0)"
            class="text-[10px] text-warning-600 font-normal ml-1"
          >
            · Unsaved changes
          </span>
        </p>

        <div class="flex flex-wrap gap-2">
          <!-- Existing DOs from saved details -->
          <span
            v-for="entry in existingDoEntries"
            :key="entry.do_id"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all"
            :class="pendingRemoveDoIds.has(entry.do_id)
              ? 'border-error-300 bg-error-50 text-error-600 dark:border-error-700 dark:bg-error-950 dark:text-error-400 line-through opacity-60'
              : 'border-default bg-elevated text-default'"
          >
            <UIcon
              v-if="pendingRemoveDoIds.has(entry.do_id)"
              name="i-lucide-trash-2"
              class="w-3 h-3"
            />
            {{ entry.do_number }}
            <button
              v-if="isDetail && !pendingRemoveDoIds.has(entry.do_id)"
              type="button"
              class="ml-0.5 text-muted hover:text-error-500 transition-colors"
              :disabled="saving"
              @click="handleRemoveDo(entry.do_id)"
            >
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
            <button
              v-else-if="isDetail && pendingRemoveDoIds.has(entry.do_id)"
              type="button"
              class="ml-0.5 text-error-400 hover:text-error-600 transition-colors"
              :disabled="saving"
              @click="pendingRemoveDoIds.delete(entry.do_id); emit('undo-remove-do', entry.do_id)"
            >
              <UIcon name="i-lucide-undo-2" class="w-3 h-3" title="Undo remove" />
            </button>
          </span>

          <!-- Pending new DOs (not yet saved) -->
          <span
            v-for="doItem in (pendingDos ?? [])"
            :key="`pending-${doItem.id}`"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300"
          >
            <UIcon name="i-lucide-plus" class="w-3 h-3" />
            {{ doItem.do_number }}
            <button
              type="button"
              class="ml-0.5 text-primary-400 hover:text-primary-700 transition-colors"
              :disabled="saving"
              @click="handleRemovePending(doItem.id)"
            >
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </span>

          <!-- Add DO button -->
          <UButton
            v-if="isDetail"
            label="+ Add DO"
            size="xs"
            color="neutral"
            variant="soft"
            class="ml-1 rounded"
            :disabled="saving"
            @click="$emit('open-do-modal')"
          />
        </div>

        <!-- Legend hint when there are pending changes -->
        <div
          v-if="isDetail && (pendingRemoveDoIds.size > 0 || pendingDos.length > 0)"
          class="flex items-center gap-3 mt-1"
        >
          <span v-if="pendingRemoveDoIds.size > 0" class="flex items-center gap-1 text-[10px] text-error-500">
            <UIcon name="i-lucide-trash-2" class="w-3 h-3" />
            {{ pendingRemoveDoIds.size }} DO(s) marked for removal
          </span>
          <span v-if="pendingDos.length > 0" class="flex items-center gap-1 text-[10px] text-primary-500">
            <UIcon name="i-lucide-plus" class="w-3 h-3" />
            {{ pendingDos.length }} new DO(s) pending
          </span>
          <span class="text-[10px] text-muted">· Save to apply changes</span>
        </div>
      </div>

      <!-- Empty state when no DOs and in detail/edit mode -->
      <div
        v-else-if="!isCreate && isDetail && !existingDoEntries.length && !pendingDos.length"
        class="flex items-center gap-2"
      >
        <p class="text-xs text-muted">No Delivery Orders linked.</p>
        <UButton
          label="+ Add DO"
          size="xs"
          color="neutral"
          variant="soft"
          class="rounded"
          :disabled="saving"
          @click="$emit('open-do-modal')"
        />
      </div>
    </div>
  </div>
</template>