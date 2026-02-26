<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { DefectCategory } from '../../../../types/master-data/defect'

const formRef = ref()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  category: Partial<DefectCategory>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<DefectCategory>]
}>()

const schema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  description: ''
})

// Sync data when edit
watch(
  () => props.category,
  (val) => {
    state.name = val.name ?? ''
    state.description = val.description ?? ''
  },
  { immediate: true, deep: true }
)

// Reset when open in add mode
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.name = ''
      state.description = ''
    }
  }
)

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
    :title="props.mode === 'add' ? 'Add New Defect Category' : 'Edit Defect Category'"
    :description="props.mode === 'add'
      ? 'Add a new defect category to the system'
      : 'Update defect category details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Defect Category Name" name="name" required>
          <UInput v-model="state.name" placeholder="e.g. Kerusakan Fisik" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" placeholder="Additional description..." class="w-full" />
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