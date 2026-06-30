<script setup lang="ts">
import { computed }         from 'vue'
import { CalendarDate }     from '@internationalized/date'
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

const dateModel = computed({
  get(): CalendarDate | null {
    if (!props.workDate) return null
    const [y, m, d] = props.workDate.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) { emit('update:workDate', ''); return }
    const yyyy = val.year
    const mm   = String(val.month).padStart(2, '0')
    const dd   = String(val.day).padStart(2, '0')
    emit('update:workDate', `${yyyy}-${mm}-${dd}`)
  },
})

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

    <div class="flex items-center justify-between px-5 py-4 border-b border-default flex-wrap gap-3">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-bar-chart-2" class="w-4 h-4 text-primary" />
        Daily Summary
      </h2>

      <div class="flex items-center gap-2">
        <UInputDate v-model="dateModel">
          <template #trailing>
            <UPopover>
              <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
              <template #content>
                <UCalendar v-model="dateModel" class="p-2" />
              </template>
            </UPopover>
          </template>
        </UInputDate>

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

    <div v-else-if="summary" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 divide-x divide-default">
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">Total WO</p>
        <p class="text-xl font-bold font-mono">{{ fmtNum(summary.total_wo) }}</p>
      </div>
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">In Progress</p>
        <p class="text-xl font-bold font-mono text-warning-600">{{ fmtNum(summary.status_breakdown?.In_Progress) }}</p>
      </div>
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">Completed</p>
        <p class="text-xl font-bold font-mono text-success-600">{{ fmtNum(summary.status_breakdown?.Completed) }}</p>
      </div>
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">Planned Qty</p>
        <p class="text-xl font-bold font-mono">{{ fmtNum(summary.total_planned) }}</p>
      </div>
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">Actual Qty</p>
        <p class="text-xl font-bold font-mono">{{ fmtNum(summary.total_actual) }}</p>
      </div>
      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">Achievement</p>
        <p class="text-xl font-bold font-mono" :class="achievementColor">{{ summary.achievement_pct }}%</p>
      </div>
      <div
        class="px-4 py-3 space-y-1 transition-colors"
        :class="summary.active_issues > 0 ? 'bg-error-50 dark:bg-error-950/20' : ''"
      >
        <p class="text-xs" :class="summary.active_issues > 0 ? 'text-error-600' : 'text-muted'">Active Issues</p>
        <div class="flex items-center gap-2">
          <span v-if="summary.active_issues > 0" class="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-error-500" />
          </span>
          <p class="text-xl font-bold font-mono" :class="summary.active_issues > 0 ? 'text-error-600' : 'text-muted'">
            {{ fmtNum(summary.active_issues) }}
          </p>
        </div>
        <p v-if="summary.active_issues > 0" class="text-xs text-error-500">Needs attention</p>
      </div>
    </div>

    <div v-else-if="!loading" class="flex items-center justify-center py-8 text-sm text-muted">
      No data for selected date.
    </div>
  </div>
</template>