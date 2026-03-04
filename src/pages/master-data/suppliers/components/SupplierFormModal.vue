<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Suppliers } from '../../../../types/master-data/suppliers'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  supplier: Partial<Suppliers>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: Partial<Suppliers>): void
}>()

interface LocalSupplier {
  supplier_code: string
  name: string
  email: string
  notes: string
}

const localSupplier = reactive<LocalSupplier>({
  supplier_code: '',
  name: '',
  email: '',
  notes: ''
})

watch(
  () => props.supplier,
  (newVal) => {
    Object.assign(localSupplier, {
      supplier_code: newVal.supplier_code || '',
      name: newVal.name || '',
      email: newVal.email ?? '',
      notes: newVal.notes ?? ''
    })
  },
  { deep: true, immediate: true }
)

function handleSubmit() {
  emit('save', { ...localSupplier })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Supplier' : 'Edit Supplier'"
    :description="mode === 'add' ? 'Add a new supplier to the system.' : 'Update supplier details.'"
    :ui="{ content: 'sm:max-w-[600px]' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="supplier-form" class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Supplier Code" required>
            <UInput
              v-model="localSupplier.supplier_code"
              placeholder="e.g. SUP-001"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Name" required>
            <UInput
              v-model="localSupplier.name"
              placeholder="e.g. PT. Supplier Jaya"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <UFormField label="Email">
          <UInput
            v-model="localSupplier.email"
            type="email"
            placeholder="e.g. contact@supplier.com"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Notes">
          <UTextarea
            v-model="localSupplier.notes"
            placeholder="Additional notes..."
            class="w-full"
            :disabled="loading"
            :rows="3"
          />
        </UFormField>
      </form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="handleClose"
        />
        <UButton
          type="submit"
          form="supplier-form"
          label="Save"
          color="primary"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>