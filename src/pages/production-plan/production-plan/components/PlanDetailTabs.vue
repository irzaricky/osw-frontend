<script setup lang="ts">
defineProps<{
  loading: boolean
  currentPlan: any
  fmtDate: (d?: string | null) => string
  fmtNum: (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
  detailStatusColor: (s?: string | null) => string
}>()
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
          Products requested from Delivery Orders.
        </p>
      </div>
      <UBadge
        v-if="currentPlan?.overall_status"
        :label="overallStatusLabel[currentPlan.overall_status]"
        :color="overallStatusColor[currentPlan.overall_status]"
        variant="soft"
      />
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
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Available Capacity</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Capacity Gap</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="loading">
            <td colspan="8" class="text-center py-10 text-muted">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin inline-block mr-2" />
              Loading data...
            </td>
          </tr>
          <tr v-else-if="!currentPlan?.details?.length">
            <td colspan="8" class="text-center py-10 text-muted text-sm">
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
              <!-- part_name & part_number sesuai type PlanDetail yang diperbarui -->
              <div class="font-medium">{{ detail.part?.part_name ?? '-' }}</div>
              <div class="text-xs text-muted font-mono">{{ detail.part?.part_number ?? '' }}</div>
            </td>
            <td class="px-4 py-3 text-muted">{{ fmtDate(detail.delivery_date) }}</td>
            <td class="px-4 py-3 text-right font-mono">{{ fmtNum(detail.qty_request) }}</td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                :class="{
                  'text-success-600': detail.qty_capacity != null && detail.qty_capacity >= detail.qty_request,
                  'text-error-600':   detail.qty_capacity != null && detail.qty_capacity < detail.qty_request,
                  'text-muted':       detail.qty_capacity == null,
                }"
              >
                {{ detail.qty_capacity != null ? fmtNum(detail.qty_capacity) : '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-mono">
              <span
                v-if="detail.capacity_gap != null"
                :class="detail.capacity_gap >= 0 ? 'text-success-600' : 'text-error-600'"
              >
                {{ detail.capacity_gap >= 0 ? '+' : '' }}{{ fmtNum(detail.capacity_gap) }}
              </span>
              <span v-else class="text-muted">—</span>
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