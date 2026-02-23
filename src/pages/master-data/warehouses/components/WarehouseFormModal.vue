<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { WarehousePayload } from '../../../../types'
import type { DropdownOption } from '../composables/useWarehouseDropdowns'

const formRef = ref()

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

const schema = z.object({
  warehouse_code: z.string().min(1, 'Warehouse code is required'),
  name: z.string().min(1, 'Warehouse name is required'),
  category_id: z.number({ message: 'Category is required' }),
  line_id:  z.number({ message: 'Line is required' }),
  notes: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  warehouse_code: '',
  name: '',
  category_id: undefined,
  line_id: undefined,
  notes: ''
})

// Sync data when edit
watch(
  () => props.warehouse,
  (val) => {
    state.warehouse_code = val.warehouse_code ?? ''
    state.name = val.name ?? ''
    state.notes = val.notes ?? ''

    state.category_id = val.category_id ?? val.category?.id
    state.line_id = val.line_id ?? val.line?.id
  },
  { immediate: true, deep: true }
)

// Reset when open in add mode
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.warehouse_code = ''
      state.name = ''
      state.category_id = undefined
      state.line_id = undefined
      state.notes = ''
    }
  }
)

const categoryItems = computed(() =>
  props.categories.map(cat => cat.name)
)

const lineItems = computed(() =>
  props.lines.map(line => line.name)
)

const selectedCategory = computed({
  get() {
    if (!state.category_id) return undefined

    const found = props.categories.find(
      c => c.id === state.category_id
    )

    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      state.category_id = undefined
      return
    }

    const found = props.categories.find(
      c => c.name === value
    )

    state.category_id = found?.id
  }
})

const selectedLine = computed({
  get() {
    if (!state.line_id) return undefined

    const found = props.lines.find(
      l => l.id === state.line_id
    )

    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      state.line_id = undefined
      return
    }

    const found = props.lines.find(
      l => l.name === value
    )

    state.line_id = found?.id
  }
})

function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  emit('save', event.data)
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
      <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Warehouse Code" name="warehouse_code" required>
          <UInput v-model="state.warehouse_code" placeholder="e.g. WH-001" class="w-full" />
        </UFormField>

        <UFormField label="Warehouse Name" name="name" required>
          <UInput v-model="state.name" placeholder="e.g. Main Warehouse" class="w-full" />
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

        <UFormField label="Line" name="line_id" required>
          <USelectMenu
            v-model="selectedLine"
            :items="lineItems"
            placeholder="Select Line"
            class="w-full"
            clear
          />
        </UFormField>

        <UFormField label="Notes" name="notes">
          <UTextarea v-model="state.notes" placeholder="Additional notes..." class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
        <UButton color="primary" label="Save" :loading="props.loading" @click="submitForm" />
      </div>
    </template>
  </UModal>
</template>