<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Customer } from '../../../../types/master-data/customer'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  customer: Partial<Customer>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: Partial<Customer>): void
}>()

// Use a local copy for form editing
const localCustomer = reactive<Partial<Customer>>({
  customer_code: '',
  name: '',
  email: '',
  address: ''
})

// Sync props.customer to localCustomer when modal opens or customer changes
watch(
  () => props.customer,
  (newVal) => {
    Object.assign(localCustomer, {
      customer_code: newVal.customer_code || '',
      name: newVal.name || '',
      email: newVal.email || '',
      address: newVal.address || ''
    })
  },
  { deep: true, immediate: true }
)

function handleSubmit() {
  emit('save', { ...localCustomer })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Customer' : 'Edit Customer'"
    :description="mode === 'add' ? 'Add a new customer to the database.' : 'Update customer details.'"
    :ui="{ content: 'sm:max-w-[600px]' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="customer-form" class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Code" required>
          <UInput 
            v-model="localCustomer.customer_code" 
            placeholder="e.g. C001"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Name" required>
          <UInput 
            v-model="localCustomer.name" 
            placeholder="e.g. PT Sejahtera Abadi Motor"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Email" required>
          <UInput 
            v-model="localCustomer.email" 
            type="email"
            placeholder="e.g. email@company.com"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Address" required>
          <UTextarea 
            v-model="localCustomer.address" 
            placeholder="Enter customer head office address"
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
          form="customer-form"
          label="Save" 
          color="primary" 
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>
