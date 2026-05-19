<script setup lang="ts">
import type { ProductionOrder } from '../../../../types/production-plan/order-schedule'
import { poStatusLabel, poStatusColor, priorityColor } from '../composables/useOrderScheduleColumns'

defineProps<{
  order:       ProductionOrder | null
  fmtDate:     (d?: string | null) => string
  fmtNum:      (n?: number | null) => string
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
        <span class="font-semibold">Production Order Information</span>
      </div>
    </template>

    <div v-if="order" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">PO Number</p>
        <p class="font-semibold font-mono">{{ order.po_number }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Plan</p>
        <p class="font-medium">{{ order.plan?.plan_number ?? '-' }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Priority</p>
        <UBadge
          :label="order.priority"
          :color="priorityColor[order.priority]"
          variant="soft"
        />
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Status</p>
        <UBadge
          :label="poStatusLabel[order.status]"
          :color="poStatusColor[order.status]"
          variant="subtle"
        />
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Production Start</p>
        <p>{{ fmtDate(order.production_start_date) }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Production End</p>
        <p>{{ fmtDate(order.production_end_date) }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Earliest Delivery</p>
        <p>{{ fmtDate(order.earliest_delivery_date) }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Latest Delivery</p>
        <p>{{ fmtDate(order.latest_delivery_date) }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Total Products</p>
        <p class="font-mono">{{ order.total_products }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Planned Qty</p>
        <p class="font-mono">{{ fmtNum(order.total_planned_qty) }}</p>
      </div>
      <div>
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Scheduled Qty</p>
        <p
          class="font-mono"
          :class="order.total_scheduled_qty >= order.total_planned_qty ? 'text-success-500' : 'text-warning-500'"
        >
          {{ fmtNum(order.total_scheduled_qty) }}
        </p>
      </div>
      <div v-if="order.po_description" class="col-span-full">
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Description</p>
        <p>{{ order.po_description }}</p>
      </div>
      <div v-if="order.notes" class="col-span-full">
        <p class="text-muted text-xs uppercase tracking-wide mb-1">Notes</p>
        <p class="text-muted italic">{{ order.notes }}</p>
      </div>
    </div>

    <div v-else class="text-muted text-sm py-4 text-center">No order data available.</div>
  </UCard>
</template>