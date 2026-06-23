<script setup lang="ts">
import type { WorkOrderProgress } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  progresses: WorkOrderProgress[]
  plannedQty: number
  actualQty:  number
  loading:    boolean
}>()

function fmtDateTime(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-US', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

function pct(cumulative: number): number {
  if (!props.plannedQty) return 0
  return Math.min(110, Math.round((cumulative / props.plannedQty) * 100))
}
</script>

<template>
  <div class="mt-4 bg-default border border-default rounded-xl overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-trending-up" class="w-4 h-4 text-primary" />
        Progress History
      </h3>
      <UBadge
        :label="`${progresses.length} record${progresses.length !== 1 ? 's' : ''}`"
        color="neutral"
        variant="soft"
        size="sm"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
    </div>

    <div v-else-if="progresses.length === 0" class="flex flex-col items-center justify-center py-10 text-center text-muted gap-2">
      <UIcon name="i-lucide-bar-chart-2" class="w-7 h-7" />
      <p class="text-sm">No progress reported yet.</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Time</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Good</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Reject</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Scrap</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Cumulative</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Progress</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="p in progresses"
            :key="p.id"
            class="hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 text-muted">{{ fmtDateTime(p.reported_at) }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold text-success-600">
              +{{ (p.qty_good ?? 0).toLocaleString() }}
            </td>
            <td class="px-4 py-3 text-right font-mono" :class="(p.qty_reject ?? 0) > 0 ? 'text-warning-600' : 'text-muted'">
              {{ (p.qty_reject ?? 0).toLocaleString() }}
            </td>
            <td class="px-4 py-3 text-right font-mono" :class="(p.qty_scrap ?? 0) > 0 ? 'text-error-600' : 'text-muted'">
              {{ (p.qty_scrap ?? 0).toLocaleString() }}
            </td>
            <td class="px-4 py-3 text-right font-mono font-semibold">
              {{ (p.cumulative_qty_good ?? p.cumulative_qty ?? 0).toLocaleString() }}
              <span class="text-xs text-muted font-normal"> / {{ plannedQty.toLocaleString() }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <div class="w-20 h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full"
                    :style="{ width: `${Math.min(100, pct(p.cumulative_qty_good ?? p.cumulative_qty ?? 0))}%` }"
                  />
                </div>
                <span class="text-xs font-mono font-semibold">
                  {{ pct(p.cumulative_qty_good ?? p.cumulative_qty ?? 0) }}%
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>