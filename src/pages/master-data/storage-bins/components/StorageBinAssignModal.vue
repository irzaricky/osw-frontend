<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { WarehouseBin } from '../../../../services/master-data/warehouse-bin.service'
import type { PartDropdown } from '../../../../types'

type BinUsageType = 'FREE' | 'CATEGORY' | 'DEDICATED'

const props = defineProps<{
  open: boolean
  bin: WarehouseBin | null
  parts: PartDropdown[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: {
    is_dedicated: boolean
    dedicated_part_number: string | null
    capacity: number
  }]
  clear: []
}>()

const usageTypeItems = [
  { label: 'Free Bin', value: 'FREE' },
  { label: 'Dedicated Part Bin', value: 'DEDICATED' }
]

const categoryItems = [
  { label: 'Raw Material', value: 'RAW' },
  { label: 'WIP', value: 'WIP' },
  { label: 'Product', value: 'PRODUCT' }
]

const form = reactive({
  usage_type: 'FREE' as BinUsageType,
  part_number: '' as string,
  allowed_part_category: null as string | null,
  capacity: 0 as number
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return

    form.part_number =
      props.bin?.dedicated_part_number || ''

    form.capacity =
      Number(props.bin?.capacity || 0)

    form.usage_type =
      props.bin?.is_dedicated &&
      props.bin?.dedicated_part_number
        ? 'DEDICATED'
        : 'FREE'
  }
)

const partItems = computed(() =>
  (props.parts || []).map(p => `${p.part_number} — ${p.part_name}`)
)

const selectedUsageType = computed({
  get() {
    return usageTypeItems.find(item => item.value === form.usage_type)?.label
  },
  set(value: string | undefined) {
    const found = usageTypeItems.find(item => item.label === value)
    form.usage_type = (found?.value || 'FREE') as BinUsageType

    if (form.usage_type === 'FREE') {
      form.part_number = ''
      form.allowed_part_category = null
    }

    if (form.usage_type === 'CATEGORY') {
      form.part_number = ''
    }

    if (form.usage_type === 'DEDICATED') {
      form.allowed_part_category = null
    }
  }
})

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

const selectedCategory = computed({
  get() {
    return categoryItems.find(item => item.value === form.allowed_part_category)?.label
  },
  set(value: string | undefined) {
    const found = categoryItems.find(item => item.label === value)
    form.allowed_part_category = found?.value || null
  }
})

function close() {
  emit('update:open', false)
}

function handleSave() {
  if (Number(form.capacity || 0) <= 0) return

  if (form.usage_type === 'DEDICATED' && !form.part_number) return
  if (form.usage_type === 'CATEGORY' && !form.allowed_part_category) return

  emit('save', {
    is_dedicated: form.usage_type === 'DEDICATED',
    dedicated_part_number: form.usage_type === 'DEDICATED'
      ? form.part_number
      : null,
    capacity: Number(form.capacity || 0)
  })
}

function handleClear() {
  emit('clear')
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Configure Storage Bin"
    description="Set bin usage type and safe operational capacity."
    @update:open="emit('update:open', $event)"
  >
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
        <UFormField label="Bin Usage Type" required>
          <USelectMenu
            v-model="selectedUsageType"
            :items="usageTypeItems.map(item => item.label)"
            placeholder="Select bin usage type"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="form.usage_type === 'DEDICATED'"
          label="Dedicated Part"
          required
        >
          <USelectMenu
            v-model="selectedPart"
            :items="partItems"
            searchable
            clear
            placeholder="Select dedicated part"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="form.usage_type === 'CATEGORY'"
          label="Allowed Part Category"
          required
        >
          <USelectMenu
            v-model="selectedCategory"
            :items="categoryItems.map(item => item.label)"
            searchable
            clear
            placeholder="Select allowed category"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Safe Capacity / Max Active Labels" required>
          <UInput
            v-model.number="form.capacity"
            type="number"
            min="1"
            placeholder="e.g. 100"
            class="w-full"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />

        <UButton
          v-if="props.bin?.is_dedicated || props.bin?.capacity"
          color="error"
          variant="soft"
          label="Clear Bin"
          :loading="props.loading"
          @click="handleClear"
        />

        <UButton
          color="primary"
          label="Save"
          :loading="props.loading"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>