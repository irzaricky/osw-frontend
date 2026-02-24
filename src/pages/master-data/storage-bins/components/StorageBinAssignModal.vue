<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { WarehouseBin } from '../../../../services/master-data/warehouse-bin.service'
import type { PartDropdown } from '../../../../services/master-data/part.service'

const props = defineProps<{
  open: boolean
  bin: WarehouseBin | null
  parts: PartDropdown[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: { dedicated_part_number: string; capacity: number }]
  clear: []
}>()

const form = reactive({
  part_number: '' as string,
  capacity: 0 as number
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    form.part_number = props.bin?.dedicated_part_number || ''
    form.capacity = Number(props.bin?.capacity || 0)
  }
)

const partItems = computed(() =>
  (props.parts || []).map(p => `${p.part_number} — ${p.part_name}`)
)

const selectedPart = computed({
  get() {
    if (!form.part_number) return undefined
    const found = (props.parts || []).find(p => p.part_number === form.part_number)
    return found ? `${found.part_number} — ${found.part_name}` : undefined
  },
  set(val: string | undefined) {
    if (!val) {
      form.part_number = ''
      return
    }
    const partNumber = val.split(' — ')[0]?.trim()
    form.part_number = partNumber || ''
  }
})

function close() {
  emit('update:open', false)
}

function handleSave() {
  if (!form.part_number) return
  emit('save', {
    dedicated_part_number: form.part_number,
    capacity: Number(form.capacity || 0)
  })
}

function handleClear() {
  emit('clear')
}
</script>

<template>
  <UModal :open="props.open" title="Assign Storage Bin" description="Select part and set max capacity for this bin"
    @update:open="emit('update:open', $event)">
    <template #body>
      <div v-if="props.bin" class="mb-4 flex items-center gap-2 text-sm">
        <span class="text-muted">Bin :</span>

        <span class="font-semibold">
          {{ props.bin.bin_code }}
        </span>

        <span class="text-muted">
          (R{{ props.bin.row_index }} C{{ props.bin.col_index }})
        </span>
      </div>

      <form class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Part Name" required>
          <USelectMenu v-model="selectedPart" :items="partItems" searchable placeholder="Select Part" class="w-full"
            clear />
        </UFormField>

        <UFormField label="Max Storage Capacity" required>
          <UInput v-model.number="form.capacity" type="number" min="0" placeholder="e.g. 100" class="w-full" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
        <UButton v-if="props.bin?.is_dedicated" color="error" variant="soft" label="Clear Bin" :loading="props.loading"
          @click="handleClear" />
        <UButton color="primary" label="Save" :loading="props.loading" @click="handleSave" />
      </div>
    </template>
  </UModal>
</template>