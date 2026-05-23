<script setup lang="ts">
import { computed } from 'vue'
import type { DailySummary } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  workDate: string
  summary:  DailySummary | null
  loading:  boolean
}>()

const emit = defineEmits<{
  'update:workDate': [value: string]
  'refresh':         []
}>()

const achievementColor = computed(() => {
  const pct = props.summary?.achievement_pct ?? 0
  if (pct >= 100) return 'text-success-600'
  if (pct >= 80)  return 'text-warning-600'
  return 'text-error-600'
})

function fmtNum(n?: number | null) {
  if (n == null) return '0'
  return n.toLocaleString()
}
</script>

<template>
  <div class="bg-default border border-default rounded-xl">
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-bar-chart-2" class="w-4 h-4 text-primary" />
        Daily Summary
      </h2>
      <div class="flex items-center gap-2">
        <UInput
          :model-value="workDate"
          type="date"
          size="sm"
          class="w-44"
          @update:model-value="emit('update:workDate', $event)"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="emit('refresh')"
        />
      </div>
    </div>

    <div v-if="loading && !summary" class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
    </div>

    <div v-else-if="summary" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-default">
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Total WO
        </p>
        <p class="text-xl font-bold font-mono">
          {{ fmtNum(summary.total_wo) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          In Progress
        </p>
        <p class="text-xl font-bold font-mono text-warning-600">
          {{ fmtNum(summary.status_breakdown?.In_Progress) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Completed
        </p>
        <p class="text-xl font-bold font-mono text-success-600">
          {{ fmtNum(summary.status_breakdown?.Completed) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Planned Qty
        </p>
        <p class="text-xl font-bold font-mono">
          {{ fmtNum(summary.total_planned) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Actual Qty
        </p>
        <p class="text-xl font-bold font-mono">
          {{ fmtNum(summary.total_actual) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Achievement
        </p>
        <p class="text-xl font-bold font-mono" :class="achievementColor">
          {{ summary.achievement_pct }}%
        </p>
        <p v-if="summary.active_issues > 0" class="text-xs text-error-600 flex items-center gap-1">
          <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
          {{ summary.active_issues }} issue{{ summary.active_issues > 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <div v-else class="flex items-center justify-center py-8 text-sm text-muted">
      No data for selected date.
    </div>
  </div>
</template>