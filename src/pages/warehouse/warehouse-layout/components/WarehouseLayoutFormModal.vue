<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

import type { Warehouse } from '../../../../types/master-data/warehouse'
import type { WarehouseLayout } from '../../../../types/warehouse/warehouse-layout'

const formRef = ref()

const props = defineProps<{
  open: boolean
  loading: boolean
  warehouses: Pick<Warehouse, 'id' | 'warehouse_code' | 'name'>[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<WarehouseLayout>]
}>()

const state = reactive({
  warehouse_id: undefined as number | undefined,
})

const schema = z.object({
  warehouse_id: z.number({
    message: 'Warehouse is required',
  }),
})

const warehouseItems = computed(() =>
  props.warehouses.map(
    warehouse => `${warehouse.warehouse_code} - ${warehouse.name}`
  )
)

const selectedWarehouse = computed({
  get() {
    if (!state.warehouse_id) return undefined

    const found = props.warehouses.find(
      warehouse => warehouse.id === state.warehouse_id
    )

    return found
      ? `${found.warehouse_code} - ${found.name}`
      : undefined
  },

  set(value: string | undefined) {
    if (!value) {
      state.warehouse_id = undefined
      return
    }

    const found = props.warehouses.find(
      warehouse =>
        `${warehouse.warehouse_code} - ${warehouse.name}` === value
    )

    state.warehouse_id = found?.id
  },
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      state.warehouse_id = undefined
    }
  },
)

function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  emit('save', event.data)
  emit('update:open', false)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Add Warehouse Layout"
    description="Select warehouse to create layout"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Warehouse"
          name="warehouse_id"
          required
        >
          <USelectMenu
            v-model="selectedWarehouse"
            :items="warehouseItems"
            placeholder="Select Warehouse"
            class="w-full"
            clear
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />

        <UButton
          color="primary"
          icon="i-lucide-plus"
          label="Add Layout"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>