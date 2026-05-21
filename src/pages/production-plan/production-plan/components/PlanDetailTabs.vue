<script setup lang="ts">
import { computed } from 'vue'
import type { PlanDetail, PlanDetailLine } from '../../../../types/production-plan/plan'

const props = defineProps<{
  loading: boolean
  currentPlan: any
  isEditable: boolean
  fmtDate: (d?: string | null) => string
  fmtNum: (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
  detailStatusColor: (s?: string | null) => string
}>()

// Hitung qty_capacity & capacity_gap per detail dari bottleneck (min) di semua detail_lines
function getBottleneckCapacity(detail: PlanDetail): number | null {
  const lines = detail.detail_lines
  if (!lines || lines.length === 0) return null
  const caps = lines.map((dl) => dl.qty_capacity ?? null).filter((c): c is number => c !== null)
  if (caps.length === 0) return null
  return Math.min(...caps)
}

function getBottleneckGap(detail: PlanDetail): number | null {
  const cap = getBottleneckCapacity(detail)
  if (cap === null) return null
  return cap - detail.qty_request
}

// Daftar line names yang dilalui detail ini
function getDetailLineNames(detail: PlanDetail): string {
  if (!detail.detail_lines?.length) return '—'
  return detail.detail_lines
    .sort((a, b) => a.sequence - b.sequence)
    .map((dl) => dl.line?.name ?? `Line #${dl.line_id}`)
    .join(', ')
}
</script>

<template>
  <div class="mt-4 bg-default border border-default rounded-xl">
    <!-- header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <div>
        <h3 class="font-semibold text-sm flex items-center gap-2">
          <UIcon name="i-lucide-list" class="w-4 h-4 text-primary" />
          Request Details
        </h3>
        <p class="text-xs text-muted mt-0.5">
          Products requested from Delivery Orders. Lines are auto-assigned from part routing.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UBadge
          v-if="currentPlan?.overall_status"
          :label="overallStatusLabel[currentPlan.overall_status]"
          :color="overallStatusColor[currentPlan.overall_status]"
          variant="soft"
        />
      </div>
    </div>

    <!-- table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">No</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Product</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Requested Qty</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Bottleneck Capacity</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Capacity Gap</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Production Lines</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="loading">
            <td colspan="9" class="text-center py-10 text-muted">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline-block mr-2" />
              Loading data...
            </td>
          </tr>
          <tr v-else-if="!currentPlan?.details?.length">
            <td colspan="9" class="text-center py-10 text-muted text-sm">
              No request details found.
            </td>
          </tr>
          <tr
            v-for="(detail, idx) in currentPlan?.details"
            :key="detail.id"
            class="hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 text-muted">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-medium">{{ detail.customer?.name ?? '-' }}</td>
            <td class="px-4 py-3">
              <div class="font-medium">{{ detail.part?.part_name ?? '-' }}</div>
              <div class="text-xs text-muted font-mono">{{ detail.part?.part_number ?? '' }}</div>
            </td>
            <td class="px-4 py-3 text-muted">{{ fmtDate(detail.delivery_date) }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ fmtNum(detail.qty_request) }}</td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                :class="{
                  'text-success-600': getBottleneckCapacity(detail) != null && getBottleneckCapacity(detail)! >= detail.qty_request,
                  'text-error-600':   getBottleneckCapacity(detail) != null && getBottleneckCapacity(detail)! < detail.qty_request,
                  'text-muted':       getBottleneckCapacity(detail) == null,
                }"
              >
                {{ getBottleneckCapacity(detail) != null ? fmtNum(getBottleneckCapacity(detail)) : '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                v-if="getBottleneckGap(detail) != null"
                :class="getBottleneckGap(detail)! >= 0 ? 'text-success-600' : 'text-error-600'"
              >
                {{ getBottleneckGap(detail)! >= 0 ? '+' : '' }}{{ fmtNum(getBottleneckGap(detail)) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="px-4 py-3 min-w-[180px]">
              <div v-if="detail.detail_lines?.length" class="flex flex-wrap gap-1">
                <span
                  v-for="dl in detail.detail_lines.slice().sort((a: PlanDetailLine, b: PlanDetailLine) => a.sequence - b.sequence)"
                  :key="dl.id"
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border border-default"
                  :class="{
                    'bg-success-50 border-success-200 text-success-700 dark:bg-success-950 dark:border-success-800 dark:text-success-400': dl.status === 'POSSIBLE',
                    'bg-error-50 border-error-200 text-error-700 dark:bg-error-950 dark:border-error-800 dark:text-error-400': dl.status === 'IMPOSSIBLE',
                  }"
                >
                  <span class="text-muted font-mono text-xs">{{ dl.sequence }}.</span>
                  {{ dl.line?.name ?? `Line #${dl.line_id}` }}
                </span>
              </div>
              <span v-else class="text-xs text-warning-600 flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
                No routing
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <UBadge
                :label="
                  detail.status === 'POSSIBLE'   ? 'POSSIBLE'
                  : detail.status === 'IMPOSSIBLE' ? 'IMPOSSIBLE'
                  : 'Not Calculated'
                "
                :color="detailStatusColor(detail.status)"
                variant="soft"
                size="sm"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>