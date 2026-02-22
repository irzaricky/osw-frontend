<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { WarehouseArea, WarehouseAreaPayload } from '../../../../types'

type DropdownOption = { id: number; name: string } 

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  area: Partial<WarehouseArea>
  warehouses: DropdownOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: WarehouseAreaPayload]
}>()


const form = reactive<Partial<WarehouseAreaPayload> & { warehouse_id?: number }>({
  warehouse_id: undefined,
  area_code: '',
  name: '',
  total_cols: 1,
  total_rows: 1
})


function resetFormFromProps() {
  form.warehouse_id =
    (props.area as any)?.warehouse?.id ??
    (props.area as any)?.warehouse_id ??
    undefined

  form.area_code = props.area.area_code ?? ''
  form.name = props.area.name ?? ''
  form.total_cols = props.area.total_cols ?? 1
  form.total_rows = props.area.total_rows ?? 1
}

watch(
  () => props.area,
  () => resetFormFromProps(),
  { immediate: true, deep: true }
)


watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      resetFormFromProps()
    }
  }
)


const warehouseItems = computed(() =>
  (props.warehouses || []).map(w => w.name)
)

const selectedWarehouse = computed<string | undefined>({
  get() {
    if (!form.warehouse_id) return undefined
    const found = props.warehouses.find(w => w.id === form.warehouse_id)
    return found?.name
  },
  set(value) {
    if (!value) {
      form.warehouse_id = undefined
      return
    }
    const found = props.warehouses.find(w => w.name === value)
    form.warehouse_id = found?.id
  }
})

function handleSave() {
  
  if (!form.warehouse_id) return
  if (!form.area_code?.trim()) return
  if (!form.name?.trim()) return

  emit('save', {
    warehouse_id: form.warehouse_id!,   
    area_code: form.area_code!,
    name: form.name!,
    total_cols: form.total_cols!,
    total_rows: form.total_rows!
  })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="props.open" :title="props.mode === 'add' ? 'Add Warehouse Area' : 'Edit Warehouse Area'" :description="props.mode === 'add'
    ? 'Add a new warehouse area to the system'
    : 'Update warehouse area details'" @update:open="emit('update:open', $event)">
    <template #body>
      <form @submit.prevent="handleSave" class="space-y-4">
        <UFormField label="Warehouse" name="warehouse_id" required>
          <USelectMenu v-model="selectedWarehouse" :items="warehouseItems" placeholder="Select warehouse" class="w-full"
            clear searchable />
        </UFormField>

        <UFormField label="Area Code" name="area_code" required>
          <UInput v-model="form.area_code" placeholder="e.g. A01" class="w-full" />
        </UFormField>

        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="e.g. Area A" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Total Cols" name="total_cols" required>
            <UInput v-model.number="form.total_cols" type="number" min="1" class="w-full" />
          </UFormField>

          <UFormField label="Total Rows" name="total_rows" required>
            <UInput v-model.number="form.total_rows" type="number" min="1" class="w-full" />
          </UFormField>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
        <UButton color="primary" :label="props.mode === 'add' ? 'Create' : 'Update'" :loading="props.loading"
          @click="handleSave" />
      </div>
    </template>
  </UModal>
</template>