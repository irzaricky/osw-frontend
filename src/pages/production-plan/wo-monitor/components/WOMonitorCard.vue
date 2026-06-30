<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MonitorWO, WOHealth } from '../../../../types/production-plan/wo-monitor'

const props = defineProps<{ wo: MonitorWO }>()

const router = useRouter()

const HEALTH_CONFIG: Record<WOHealth, { border: string; badge: string; color: string; label: string }> = {
  not_started: { border: 'border-default',          badge: 'neutral', color: 'text-muted',        label: 'Not Started' },
  on_track:    { border: 'border-success-300 dark:border-success-700', badge: 'success', color: 'text-success-600', label: 'On Track' },
  at_risk:     { border: 'border-warning-300 dark:border-warning-700', badge: 'warning', color: 'text-warning-600', label: 'At Risk' },
  critical:    { border: 'border-error-400 dark:border-error-600',     badge: 'error',   color: 'text-error-600',   label: 'Critical' },
  completed:   { border: 'border-success-300 dark:border-success-700', badge: 'success', color: 'text-success-600', label: 'Completed' },
}

const config = computed(() => HEALTH_CONFIG[props.wo.health])

const progressBarColor = computed(() => {
  if (props.wo.progress_pct >= 100) return 'bg-success-500'
  if (props.wo.progress_pct >= 80)  return 'bg-primary-500'
  if (props.wo.progress_pct >= 50)  return 'bg-warning-500'
  return 'bg-error-400'
})

function fmtTime(d?: string | null) {
  if (!d) return '--:--'
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
</script>

<template>
  <div
    class="bg-default border-2 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md cursor-pointer"
    :class="[
      config.border,
      wo.health === 'critical' ? 'shadow-error-100 dark:shadow-error-900/30 shadow-md' : '',
    ]"
    @click="router.push(`/production-plan/work-order/${wo.id}`)"
  >
    <!-- Card Header -->
    <div class="flex items-start justify-between px-4 pt-4 pb-2 gap-2">
      <div class="min-w-0">
        <p class="text-xs font-mono text-muted truncate">{{ wo.line?.name ?? '-' }}</p>
        <p class="text-sm font-bold font-mono truncate">{{ wo.wo_number }}</p>
        <p class="text-xs text-muted truncate">{{ wo.part?.part_name ?? '-' }}</p>
      </div>
      <div class="flex flex-col items-end gap-1 flex-shrink-0">
        <UBadge
          :label="config.label"
          :color="config.badge as any"
          variant="subtle"
          size="xs"
        />
        <span v-if="wo.shift?.name" class="text-xs text-muted">{{ wo.shift.name }}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="px-4 pb-2">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-muted">Progress</span>
        <span class="text-xs font-semibold font-mono" :class="config.color">
          {{ wo.progress_pct }}%
        </span>
      </div>
      <div class="w-full h-2 bg-elevated rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressBarColor"
          :style="{ width: `${Math.min(100, wo.progress_pct)}%` }"
        />
      </div>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-3 border-t border-default divide-x divide-default">
      <div class="px-3 py-2 text-center">
        <p class="text-xs text-muted">Good</p>
        <p class="text-sm font-bold font-mono text-success-600">{{ wo.qty_good.toLocaleString() }}</p>
      </div>
      <div class="px-3 py-2 text-center">
        <p class="text-xs text-muted">Reject</p>
        <p class="text-sm font-bold font-mono" :class="wo.qty_reject > 0 ? 'text-warning-600' : 'text-muted'">
          {{ wo.qty_reject.toLocaleString() }}
        </p>
      </div>
      <div class="px-3 py-2 text-center">
        <p class="text-xs text-muted">Scrap</p>
        <p class="text-sm font-bold font-mono" :class="wo.qty_scrap > 0 ? 'text-error-600' : 'text-muted'">
          {{ wo.qty_scrap.toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-4 py-2.5 border-t border-default text-xs text-muted">
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-clock" class="w-3 h-3" />
        <span>{{ fmtTime(wo.actual_start_time) }}</span>
        <span v-if="wo.actual_end_time"> – {{ fmtTime(wo.actual_end_time) }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="wo.downtime_minutes > 0" class="flex items-center gap-1 text-orange-500">
          <UIcon name="i-lucide-zap-off" class="w-3 h-3" />
          {{ wo.downtime_minutes }}m
        </span>
        <span
          v-if="wo.open_issue_count > 0"
          class="flex items-center gap-1 text-error-600 font-semibold"
        >
          <span class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-error-500" />
          </span>
          {{ wo.open_issue_count }} issue{{ wo.open_issue_count > 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </div>
</template>