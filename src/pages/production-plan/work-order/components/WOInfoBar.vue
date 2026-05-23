<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrder } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  wo:          WorkOrder
  progressPct: number
}>()

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtNum(n?: number | null) {
  if (n == null) return '-'
  return n.toLocaleString()
}

const progressBarColor = computed(() => {
  if (props.progressPct >= 100) return 'bg-success-500'
  if (props.progressPct >= 60)  return 'bg-primary-500'
  if (props.progressPct >= 30)  return 'bg-warning-500'
  return 'bg-error-400'
})
</script>

<template>
  <div class="bg-default border border-default rounded-xl overflow-hidden">
    <!-- Info grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-default border-b border-default">
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">
          PO Number
        </p>
        <p class="text-sm font-semibold font-mono">
          {{ wo.production_order?.po_number ?? '-' }}
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">
          Work Date
        </p>
        <p class="text-sm font-semibold">
          {{ fmtDate(wo.work_date) }}
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">
          Factory
        </p>
        <p class="text-sm font-semibold">
          {{ wo.factory?.name ?? '-' }}
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">
          Shift
        </p>
        <p class="text-sm font-semibold">
          {{ wo.shift?.name ?? '-' }}
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">
          Planned Qty
        </p>
        <p class="text-sm font-semibold font-mono">
          {{ fmtNum(wo.planned_quantity) }}
        </p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">
          Actual Qty
        </p>
        <p
          class="text-sm font-semibold font-mono"
          :class="{
            'text-success-600': wo.actual_quantity >= wo.planned_quantity,
            'text-warning-600': wo.actual_quantity > 0 && wo.actual_quantity < wo.planned_quantity,
            'text-muted': wo.actual_quantity === 0,
          }"
        >
          {{ fmtNum(wo.actual_quantity) }}
        </p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="px-5 py-3">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs text-muted font-medium">Production Progress</span>
        <span class="text-xs font-semibold font-mono">{{ progressPct }}%</span>
      </div>
      <div class="w-full h-2 bg-elevated rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressBarColor"
          :style="{ width: `${Math.min(100, progressPct)}%` }"
        />
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-muted">{{ fmtNum(wo.actual_quantity) }} / {{ fmtNum(wo.planned_quantity) }} units</span>
        <span v-if="wo.notes" class="text-xs text-muted truncate max-w-xs" :title="wo.notes">
          Note: {{ wo.notes }}
        </span>
      </div>
    </div>
  </div>
</template>