<script setup lang="ts">
import type { WorkOrderStationDetail, WorkOrder } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  station:     WorkOrderStationDetail
  progressPct: number
  parentWo:    WorkOrder | null
}>()

function fmtDatetime(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <!-- Planned qty -->
    <div class="p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-1">Planned Qty</p>
      <p class="text-2xl font-bold font-mono">
        {{ (station.planned_quantity ?? 0).toLocaleString() }}
      </p>
    </div>

    <!-- Actual qty -->
    <div class="p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-1">Actual Qty</p>
      <p
        class="text-2xl font-bold font-mono"
        :class="{
          'text-success-600': (station.actual_quantity ?? 0) >= (station.planned_quantity ?? 0),
          'text-warning-600': (station.actual_quantity ?? 0) > 0 && (station.actual_quantity ?? 0) < (station.planned_quantity ?? 0),
        }"
      >
        {{ (station.actual_quantity ?? 0).toLocaleString() }}
      </p>
    </div>

    <!-- Progress pct -->
    <div class="p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-1">Progress</p>
      <p class="text-2xl font-bold font-mono">{{ progressPct }}%</p>
      <UProgress :value="progressPct" size="xs" class="mt-2" />
    </div>

    <!-- WO context (planned qty from parent for reference) -->
    <div class="p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-1">WO Planned Qty</p>
      <p class="text-2xl font-bold font-mono text-muted">
        {{ (parentWo?.planned_quantity ?? 0).toLocaleString() }}
      </p>
    </div>

    <!-- Timestamps (full width) -->
    <div class="col-span-2 sm:col-span-2 p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-2">Timeline</p>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p class="text-xs text-muted">Started</p>
          <p class="font-medium">{{ fmtDatetime(station.started_at) }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Completed</p>
          <p class="font-medium">{{ fmtDatetime(station.completed_at) }}</p>
        </div>
      </div>
    </div>

    <!-- Part info -->
    <div class="col-span-2 sm:col-span-2 p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-2">Part</p>
      <p class="text-sm font-semibold">{{ parentWo?.part?.part_name ?? '-' }}</p>
      <p class="text-xs text-muted font-mono">{{ parentWo?.part?.part_number }}</p>
    </div>
  </div>
</template>