<script setup lang="ts">
import { ref, computed } from 'vue'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'
import type { Range } from '../../../../types'

const props = defineProps<{
  open:          boolean
  title?:        string
  description?:  string
  availableDos:  any[]
  selectedDoIds: number[]
  loading:       boolean
  fmtDate:       (d?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'toggle', id: number): void
  (e: 'select-all', ids: number[], select: boolean): void
}>()

const doSearch    = ref('')
const dateRange   = ref<Range | undefined>(undefined)

const filteredDOs = computed(() => {
  let result = props.availableDos

  // Filter by search
  if (doSearch.value) {
    const q = doSearch.value.toLowerCase()
    result = result.filter(
      (d) =>
        d.do_number.toLowerCase().includes(q) ||
        d.customer?.name?.toLowerCase().includes(q),
    )
  }

  // Filter by date range
  if (dateRange.value?.start || dateRange.value?.end) {
    const start = dateRange.value.start ? new Date(dateRange.value.start) : null
    const end   = dateRange.value.end   ? new Date(dateRange.value.end)   : null

    result = result.filter((d) => {
      if (!d.shipment_date) return false
      const date = new Date(d.shipment_date)
      if (start && date < start) return false
      if (end   && date > end)   return false
      return true
    })
  }

  return result
})

const allSelected = computed(() => {
  if (filteredDOs.value.length === 0) return false
  return filteredDOs.value.every((d) => props.selectedDoIds.includes(d.id))
})

function handleToggleAll() {
  emit('select-all', filteredDOs.value.map((d) => d.id), !allSelected.value)
}
</script>

<template>
  <UModal
    :open="open"
    :title="props.title || 'Select Delivery Orders'"
    :description="props.description || 'Select Delivery Orders to include in the production plan.'"
    :ui="{ content: 'sm:max-w-2xl', title: 'pt-2', description: 'pb-2' }"
    size="xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">

        <!-- Row: Date Range + Search -->
        <div class="flex flex-wrap items-center gap-3">
          <HomeDateRangePicker
            v-model="dateRange"
            class="w-full md:flex-1"
            clear
          />
          <UInput
            v-model="doSearch"
            icon="i-lucide-search"
            placeholder="Search by DO number or customer..."
            class="w-full md:flex-1"
          />
        </div>

        <div v-if="loading" class="flex justify-center py-10">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-muted" />
        </div>
        <div v-else-if="filteredDOs.length === 0" class="text-center py-8 text-sm text-muted">
          No Delivery Orders found.
        </div>

        <div v-else class="border border-default rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-elevated border-b border-default">
              <tr>
                <th class="w-10 px-4 py-3 cursor-pointer" @click="handleToggleAll">
                  <div class="flex items-center justify-center">
                    <UIcon
                      :name="allSelected ? 'i-lucide-check-square' : 'i-lucide-square'"
                      :class="allSelected ? 'w-4 h-4 text-primary' : 'w-4 h-4 text-muted'"
                    />
                  </div>
                </th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">DO Number</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Date</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Items</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="doItem in filteredDOs"
                :key="doItem.id"
                class="hover:bg-elevated/50 transition-colors cursor-pointer"
                @click="emit('toggle', doItem.id)"
              >
                <td class="px-4 py-3 text-center">
                  <UIcon
                    :name="selectedDoIds.includes(doItem.id) ? 'i-lucide-check-square' : 'i-lucide-square'"
                    :class="selectedDoIds.includes(doItem.id) ? 'w-4 h-4 text-primary' : 'w-4 h-4 text-muted'"
                  />
                </td>
                <td class="px-4 py-3 font-mono font-medium">{{ doItem.do_number }}</td>
                <td class="px-4 py-3">{{ doItem.customer?.name ?? '-' }}</td>
                <td class="px-4 py-3 text-muted">{{ fmtDate(doItem.shipment_date) }}</td>
                <td class="px-4 py-3 text-right text-muted">{{ doItem.details?.length ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <span class="text-sm text-muted">{{ selectedDoIds.length }} DO(s) selected</span>
        <div class="flex gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
          <UButton
            label="Confirm Selection"
            color="primary"
            :disabled="selectedDoIds.length === 0"
            @click="emit('update:open', false)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>