<script setup lang="ts">
import { computed } from 'vue'
import type { PlanDetail } from '../../../../types/production-plan/plan'

const props = defineProps<{
  loading:            boolean
  currentPlan:        any
  isEditable:         boolean
  fmtDate:            (d?: string | null) => string
  fmtNum:             (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
  detailStatusColor:  (s?: string | null) => string
}>()

function getCapacity(detail: PlanDetail): number | null {
  if (detail.qty_capacity == null) return null
  return detail.qty_capacity
}

function getGap(detail: PlanDetail): number | null {
  const cap = getCapacity(detail)
  if (cap === null) return null
  return cap - detail.qty_request
}
</script>

<template>
  <div class="mt-4 bg-default border border-default rounded-xl">
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

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">No</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Product</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Requested Qty</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Capacity</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Gap</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Production Line</th>
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
                  'text-success-600': getCapacity(detail) != null && getCapacity(detail)! >= detail.qty_request,
                  'text-error-600':   getCapacity(detail) != null && getCapacity(detail)! < detail.qty_request,
                  'text-muted':       getCapacity(detail) == null,
                }"
              >
                {{ getCapacity(detail) != null ? fmtNum(getCapacity(detail)) : '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                v-if="getGap(detail) != null"
                :class="getGap(detail)! >= 0 ? 'text-success-600' : 'text-error-600'"
              >
                {{ getGap(detail)! >= 0 ? '+' : '' }}{{ fmtNum(getGap(detail)) }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="px-4 py-3 min-w-[160px]">
              <span
                v-if="detail.assigned_line_id"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border border-default"
                :class="{
                  'bg-success-50 border-success-200 text-success-700 dark:bg-success-950 dark:border-success-800 dark:text-success-400': detail.status === 'POSSIBLE',
                  'bg-error-50 border-error-200 text-error-700 dark:bg-error-950 dark:border-error-800 dark:text-error-400':           detail.status === 'IMPOSSIBLE',
                }"
              >
                {{ detail.assigned_line?.name ?? `Line #${detail.assigned_line_id}` }}
              </span>
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