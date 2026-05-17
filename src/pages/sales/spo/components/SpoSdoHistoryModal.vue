<script setup lang="ts">
import { watch } from 'vue'
import { useSpoStore } from '../../../../stores/sales/spo.store'

const props = defineProps<{
  open: boolean
  spoId: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const store = useSpoStore()

watch(() => props.open, (isOpen) => {
  if (isOpen && props.spoId) {
    store.fetchSdoHistory(props.spoId)
  }
})

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDoStatusColor(status: string): any {
  const map: Record<string, string> = {
    'Draft': 'neutral',
    'Sent': 'warning',
    'Delivered': 'success',
    'Cancelled': 'error'
  }
  return map[status] || 'neutral'
}

function getFulfillmentPct(delivered: number, ordered: number): number {
  if (!ordered) return 0
  return Math.min(100, Math.round((delivered / ordered) * 100))
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Delivery History"
    description="Summary of delivery fulfillment and related Delivery Orders"
    class="sm:max-w-3xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="store.loading" class="flex justify-center py-10">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary" />
      </div>

      <div v-else-if="store.sdoHistory" class="space-y-6">
        <!-- Aggregation Table -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold flex items-center gap-1.5">
            <UIcon name="i-lucide-bar-chart-3" class="w-4 h-4 text-primary" />
            Fulfillment Summary
          </h3>
          <div class="border border-default rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-elevated/50 border-b border-default">
                <tr>
                  <th class="p-3 text-left font-medium">
                    Part
                  </th>
                  <th class="p-3 text-center font-medium w-24">
                    Ordered
                  </th>
                  <th class="p-3 text-center font-medium w-24">
                    Delivered
                  </th>
                  <th class="p-3 text-center font-medium w-24">
                    Remaining
                  </th>
                  <th class="p-3 text-left font-medium w-32">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in store.sdoHistory.aggregation"
                  :key="row.part_id"
                  class="border-b border-default last:border-b-0 hover:bg-elevated/20 transition-colors"
                >
                  <td class="p-3">
                    <p class="font-mono text-xs font-semibold text-primary">
                      {{ row.part_number }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ row.part_name }}
                    </p>
                  </td>
                  <td class="p-3 text-center font-mono font-semibold">
                    {{ row.ordered_qty.toLocaleString() }}
                  </td>
                  <td class="p-3 text-center font-mono font-semibold text-success-600 dark:text-success-400">
                    {{ row.delivered_qty.toLocaleString() }}
                  </td>
                  <td class="p-3 text-center font-mono font-semibold" :class="row.remaining_qty > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-muted'">
                    {{ row.remaining_qty.toLocaleString() }}
                  </td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 rounded-full bg-elevated">
                        <div
                          class="h-1.5 rounded-full transition-all"
                          :class="getFulfillmentPct(row.delivered_qty, row.ordered_qty) >= 100 ? 'bg-success-500' : 'bg-primary'"
                          :style="{ width: `${getFulfillmentPct(row.delivered_qty, row.ordered_qty)}%` }"
                        />
                      </div>
                      <span class="text-xs font-mono text-muted w-9 text-right">
                        {{ getFulfillmentPct(row.delivered_qty, row.ordered_qty) }}%
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="!store.sdoHistory.aggregation.length">
                  <td colspan="5" class="p-8 text-center text-muted text-sm">
                    No items found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SDO List -->
        <div class="space-y-2">
          <h3 class="text-sm font-semibold flex items-center gap-1.5">
            <UIcon name="i-lucide-truck" class="w-4 h-4 text-primary" />
            Delivery Orders
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ store.sdoHistory.sdo_history.length }}
            </UBadge>
          </h3>
          <div v-if="!store.sdoHistory.sdo_history.length" class="p-6 text-center text-muted text-sm border border-default rounded-xl">
            <UIcon name="i-lucide-inbox" class="w-6 h-6 mx-auto mb-2 opacity-30" />
            No Delivery Orders found for this SPO.
          </div>
          <div v-else class="border border-default rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-elevated/50 border-b border-default">
                <tr>
                  <th class="p-3 text-left font-medium">
                    DO Number
                  </th>
                  <th class="p-3 text-left font-medium">
                    DO Date
                  </th>
                  <th class="p-3 text-left font-medium">
                    Received At
                  </th>
                  <th class="p-3 text-left font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sdo in store.sdoHistory.sdo_history"
                  :key="sdo.id"
                  class="border-b border-default last:border-b-0 hover:bg-elevated/20 transition-colors"
                >
                  <td class="p-3 font-mono text-xs font-semibold text-primary">
                    {{ sdo.do_number }}
                  </td>
                  <td class="p-3 text-muted text-xs">
                    {{ formatDate(sdo.do_date) }}
                  </td>
                  <td class="p-3 text-muted text-xs">
                    {{ formatDate(sdo.received_at) }}
                  </td>
                  <td class="p-3">
                    <UBadge :color="getDoStatusColor(sdo.status)" variant="subtle" size="xs">
                      {{ sdo.status }}
                    </UBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-muted text-sm">
        No history data available.
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Close"
          @click="emit('update:open', false)"
        />
      </div>
    </template>
  </UModal>
</template>
