<script setup lang="ts">
import type { WorkOrderStationDetail, WorkOrder, WorkOrderOutputPart } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  station:     WorkOrderStationDetail
  progressPct: number
  parentWo:    WorkOrder | null
  materials:   WorkOrderOutputPart[]
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
  <div class="space-y-3">

    <!-- Qty & progress cards -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="p-4 bg-elevated rounded-xl border border-default">
        <p class="text-xs text-muted mb-1">Planned Qty</p>
        <p class="text-2xl font-bold font-mono">
          {{ (station.planned_quantity ?? 0).toLocaleString() }}
        </p>
      </div>

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

      <div class="p-4 bg-elevated rounded-xl border border-default">
        <p class="text-xs text-muted mb-1">Progress</p>
        <p class="text-2xl font-bold font-mono">{{ progressPct }}%</p>
        <UProgress :value="progressPct" size="xs" class="mt-2" />
      </div>

      <div class="p-4 bg-elevated rounded-xl border border-default">
        <p class="text-xs text-muted mb-1">WO Planned Qty</p>
        <p class="text-2xl font-bold font-mono text-muted">
          {{ (parentWo?.planned_quantity ?? 0).toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- Timeline -->
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

    <!-- Output parts produced at this station -->
    <div class="p-4 bg-elevated rounded-xl border border-default">
      <p class="text-xs text-muted mb-2">Parts at This Station</p>

      <p v-if="materials.length === 0" class="text-xs text-muted italic">
        No parts assigned — this station performs a process-only operation (e.g. inspection, test, or transfer).
      </p>

      <div v-else class="flex flex-wrap gap-2">
        <div
          v-for="m in materials"
          :key="m.part_id"
          class="flex items-center gap-1.5 px-2.5 py-1.5 bg-default border border-default rounded-lg"
        >
          <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-muted flex-shrink-0" />
          <div class="min-w-0">
            <p class="text-xs font-medium truncate">{{ m.part_name ?? '-' }}</p>
            <p class="text-xs text-muted font-mono">{{ m.part_number ?? '-' }}</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>