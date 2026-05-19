<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  open: boolean
	title?: string
	description?: string
  availableDos: any[]
  selectedDoIds: number[]
  loading: boolean
  fmtDate: (d?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'toggle', id: number): void
	(e: 'select-all', ids: number[], select: boolean): void
}>()

const doSearch = ref('')

const filteredDOs = computed(() => {
  if (!doSearch.value) return props.availableDos
  const q = doSearch.value.toLowerCase()
  return props.availableDos.filter(
    (d) =>
      d.do_number.toLowerCase().includes(q) ||
      d.customer?.name?.toLowerCase().includes(q),
  )
})

const allSelected = computed(() => {
  if (filteredDOs.value.length === 0) return false

  return filteredDOs.value.every((d) =>
    props.selectedDoIds.includes(d.id),
  )
})

function handleToggleAll() {
  emit(
    'select-all',
    filteredDOs.value.map((d) => d.id),
    !allSelected.value,
  )
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal 
		:open="open" 
		@update:open="emit('update:open', $event)" 
		:title="props.title || 'Select Delivery Orders'" 
		:description="props.description || 'Select Delivery Orders to include in the production plan.'" 
		:ui="{ content: 'sm:max-w-2xl', title: 'pt-2', description: 'pb-2' }"
		size="xl">

    <template #body>
      <div class="space-y-4">
        <UInput
          v-model="doSearch"
          icon="i-lucide-search"
          placeholder="Search DO by number or customer..."
          class="w-full"
        />

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
											v-if="allSelected"
											name="i-lucide-check-square"
											class="w-4 h-4 text-primary"
										/>
										<UIcon
											v-else
											name="i-lucide-square"
											class="w-4 h-4 text-muted"
										/>
									</div>
								</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">No. DO</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Delivery Date</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Item</th>
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
                    v-if="selectedDoIds.includes(doItem.id)"
                    name="i-lucide-check-square"
                    class="w-4 h-4 text-primary"
                  />
                  <UIcon v-else name="i-lucide-square" class="w-4 h-4 text-muted" />
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
        <span class="text-sm text-muted">{{ selectedDoIds.length }} DO selected</span>
        <div class="flex gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
          <UButton
            label="Confirm Selection"
            color="primary"
            :disabled="selectedDoIds.length === 0"
            @click="close"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>