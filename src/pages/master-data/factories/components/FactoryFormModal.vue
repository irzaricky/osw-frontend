<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Factory } from '../../../../types/master-data/factory'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  factory: Partial<Factory>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: Partial<Factory>): void
}>()

const localFactory = reactive<Partial<Factory>>({
  name: '',
  address: '',
  phone: '',
  maps_url: ''
})

watch(
  () => props.factory,
  (newVal) => {
    Object.assign(localFactory, {
      name: newVal.name || '',
      address: newVal.address ?? '',
      phone: newVal.phone ?? '',
      maps_url: newVal.maps_url ?? ''
    })
  },
  { deep: true, immediate: true }
)

function handleSubmit() {
  emit('save', { ...localFactory })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Factory' : 'Edit Factory'"
    :description="mode === 'add' ? 'Add a new factory to the database.' : 'Update factory details.'"
    :ui="{ content: 'sm:max-w-[600px]' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="factory-form" class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Name" required>
          <UInput
            v-model="localFactory.name"
            placeholder="e.g. PT Pabrik Sejahtera"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Phone">
          <UInput
            v-model="localFactory.phone"
            placeholder="e.g. +6221-12345678"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Address">
          <UTextarea
            v-model="localFactory.address"
            placeholder="Enter factory address"
            class="w-full"
            :disabled="loading"
            :rows="3"
          />
        </UFormField>

        <UFormField label="Google Maps URL">
          <UInput
            v-model="localFactory.maps_url"
            placeholder="e.g. https://maps.google.com/..."
            class="w-full"
            :disabled="loading"
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
          form="factory-form"
          label="Save"
          color="primary"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>