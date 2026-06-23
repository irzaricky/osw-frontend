<script setup lang="ts">
import { computed } from 'vue'
import type { MonitorSummary } from '../../../../types/production-plan/wo-monitor'

const props = defineProps<{
  summary: MonitorSummary
}>()

function fmtNum(n?: number | null) {
  if (n == null) return '0'
  return n.toLocaleString()
}

const achievementColor = computed(() => {
  const pct = props.summary.overall_achievement_pct
  if (pct >= 100) return 'text-success-600'
  if (pct >= 80)  return 'text-warning-600'
  return 'text-error-600'
})

const cards = computed(() => [
  { label: 'Total WO',    value: fmtNum(props.summary.total_wo),    color: 'text-default' },
  { label: 'Not Started', value: fmtNum(props.summary.not_started), color: 'text-muted' },
  { label: 'On Track',    value: fmtNum(props.summary.on_track),    color: 'text-success-600' },
  { label: 'At Risk',     value: fmtNum(props.summary.at_risk),     color: 'text-warning-600' },
  { label: 'Critical',    value: fmtNum(props.summary.critical),    color: 'text-error-600' },
  { label: 'Completed',   value: fmtNum(props.summary.completed),   color: 'text-success-600' },
])
</script>

<template>
  <div class="bg-default border border-default rounded-xl overflow-hidden">
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-default">

      <div
        v-for="card in cards"
        :key="card.label"
        class="px-4 py-3 space-y-0.5"
      >
        <p class="text-xs text-muted">{{ card.label }}</p>
        <p class="text-xl font-bold font-mono" :class="card.color">{{ card.value }}</p>
      </div>

      <!-- Achievement -->
      <div class="px-4 py-3 space-y-0.5 col-span-2">
        <p class="text-xs text-muted">Overall Achievement</p>
        <div class="flex items-end gap-2">
          <p class="text-xl font-bold font-mono" :class="achievementColor">
            {{ summary.overall_achievement_pct }}%
          </p>
          <p class="text-xs text-muted pb-0.5 font-mono">
            {{ fmtNum(summary.total_good) }} / {{ fmtNum(summary.total_planned) }} units
          </p>
        </div>
        <div class="w-full h-1.5 bg-elevated rounded-full overflow-hidden mt-1">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="summary.overall_achievement_pct >= 100
              ? 'bg-success-500'
              : summary.overall_achievement_pct >= 80
                ? 'bg-warning-500'
                : 'bg-error-400'"
            :style="{ width: `${Math.min(100, summary.overall_achievement_pct)}%` }"
          />
        </div>
      </div>

    </div>

    <!-- Secondary metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 border-t border-default divide-x divide-default">
      <div class="px-4 py-2.5 flex items-center gap-2">
        <UIcon name="i-lucide-x-circle" class="w-3.5 h-3.5 text-warning-500 flex-shrink-0" />
        <span class="text-xs text-muted">Reject</span>
        <span class="text-sm font-semibold font-mono ml-auto">{{ fmtNum(summary.total_reject) }}</span>
      </div>
      <div class="px-4 py-2.5 flex items-center gap-2">
        <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5 text-error-500 flex-shrink-0" />
        <span class="text-xs text-muted">Scrap</span>
        <span class="text-sm font-semibold font-mono ml-auto">{{ fmtNum(summary.total_scrap) }}</span>
      </div>
      <div class="px-4 py-2.5 flex items-center gap-2">
        <UIcon name="i-lucide-zap-off" class="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
        <span class="text-xs text-muted">Downtime</span>
        <span class="text-sm font-semibold font-mono ml-auto">{{ fmtNum(summary.total_downtime) }} min</span>
      </div>
      <div class="px-4 py-2.5 flex items-center gap-2">
        <span
          v-if="summary.total_open_issues > 0"
          class="relative flex h-2 w-2 flex-shrink-0"
        >
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75" />
          <span class="relative inline-flex rounded-full h-2 w-2 bg-error-500" />
        </span>
        <UIcon v-else name="i-lucide-check-circle-2" class="w-3.5 h-3.5 text-success-500 flex-shrink-0" />
        <span class="text-xs text-muted">Open Issues</span>
        <span
          class="text-sm font-semibold font-mono ml-auto"
          :class="summary.total_open_issues > 0 ? 'text-error-600' : 'text-muted'"
        >
          {{ fmtNum(summary.total_open_issues) }}
        </span>
      </div>
    </div>
  </div>
</template>