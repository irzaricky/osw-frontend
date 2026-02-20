<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { WarehousePayload } from '../../../../types'
import type { DropdownOption } from '../composables/useWarehouseDropdowns'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  warehouse: Partial<WarehousePayload>
  categories: DropdownOption[]
  lines: DropdownOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<WarehousePayload>]
}>()

const form = reactive<Partial<WarehousePayload>>({})

// Sync form when warehouse prop changes
watch(() => props.warehouse, (val) => {
  for (const key in form) {
    delete form[key as keyof Partial<WarehousePayload>]
  }

  Object.assign(form, val)
  if (!form.category_id && val.category?.id) {
    form.category_id = val.category.id
  }
  if (!form.line_id && val.line?.id) {
    form.line_id = val.line.id
  }
}, { immediate: true, deep: true })

// Reset when open in add mode
watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'add') {
    for (const key in form) {
      delete form[key as keyof Partial<WarehousePayload>]
    }
    Object.assign(form, props.warehouse)
  }
})

const categoryItems = computed(() =>
  props.categories.map(cat => cat.name)
)

const lineItems = computed(() =>
  props.lines.map(line => line.name)
)

const selectedCategory = computed({
  get() {
    if (!form.category_id) return undefined

    const found = props.categories.find(
      c => c.id === form.category_id
    )

    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      form.category_id = undefined
      return
    }

    const found = props.categories.find(
      c => c.name === value
    )

    form.category_id = found?.id
  }
})

const selectedLine = computed({
  get() {
    if (!form.line_id) return undefined

    const found = props.lines.find(
      l => l.id === form.line_id
    )

    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      form.line_id = undefined
      return
    }

    const found = props.lines.find(
      l => l.name === value
    )

    form.line_id = found?.id
  }
})

function handleSave() {
  emit('save', {
    warehouse_code: form.warehouse_code,
    name: form.name,
    line_id: form.line_id,
    category_id: form.category_id,
    notes: form.notes
  })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal 
    :open="props.open"
    :title="props.mode === 'add' ? 'Add New Warehouse' : 'Edit Warehouse'"
    :description="props.mode === 'add'
      ? 'Add a new warehouse to the system'
      : 'Update warehouse details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form @submit.prevent="handleSave" class="space-y-4">
        <UFormField label="Warehouse Code" name="warehouse_code" required>
          <UInput v-model="form.warehouse_code" placeholder="WH-001" class="w-full" />
        </UFormField>

        <UFormField label="Warehouse Name" name="name" required>
          <UInput v-model="form.name" placeholder="Main Warehouse" class="w-full" />
        </UFormField>

        <UFormField label="Category" name="category_id" required>
          <USelectMenu 
            v-model="selectedCategory"
            :items="categoryItems"
            placeholder="Select Category"
            class="w-full"
            clear
          />
        </UFormField>

        <UFormField label="Line" name="line_id">
          <USelectMenu
            v-model="selectedLine"
            :items="lineItems"
            placeholder="Select Line"
            class="w-full"
            clear
          />
        </UFormField>

        <UFormField label="Notes" name="notes">
          <UTextarea v-model="form.notes" placeholder="Additional notes..." class="w-full" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
        <UButton color="primary" label="Save" :loading="props.loading" @click="handleSave" />
      </div>
    </template>
  </UModal>
</template>