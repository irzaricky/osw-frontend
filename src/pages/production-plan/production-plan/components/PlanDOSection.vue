<script setup lang="ts">
defineProps<{
  selectedDoItems: any[]
  selectedDoIds: number[]
  fmtDate: (d?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'open-modal'): void
  (e: 'remove', id: number): void
}>()
</script>

<template>
  <div class="bg-default border border-default rounded-xl">
    <!-- Card header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-package" class="w-4 h-4 text-primary" />
        Delivery Orders
        <UBadge
          v-if="selectedDoIds.length > 0"
          :label="`${selectedDoIds.length} selected`"
          color="primary"
          variant="soft"
          size="sm"
        />
      </h2>
      <UButton
        label="Select Delivery Orders"
        icon="i-lucide-plus"
        color="primary"
        size="sm"
        variant="soft"
        @click="emit('open-modal')"
      />
    </div>

    <!-- Selected DOs table -->
    <div v-if="selectedDoItems.length > 0">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">No. DO</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Item</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="doItem in selectedDoItems"
            :key="doItem.id"
            class="hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 font-mono font-medium text-sm">{{ doItem.do_number }}</td>
            <td class="px-4 py-3 text-sm">{{ doItem.customer?.name ?? '-' }}</td>
            <td class="px-4 py-3 text-sm text-muted">{{ fmtDate(doItem.shipment_date) }}</td>
            <td class="px-4 py-3 text-right text-sm text-muted">{{ doItem.details?.length ?? '-' }}</td>
            <td class="px-4 py-3 text-right">
              <UButton
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                size="xs"
                @click="emit('remove', doItem.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-center text-muted gap-2">
      <UIcon name="i-lucide-package-open" class="w-8 h-8" />
      <p class="text-sm">No Delivery Orders selected yet</p>
      <p class="text-xs">Click "Select Delivery Orders" to choose Delivery Orders.</p>
    </div>
  </div>
</template>