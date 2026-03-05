<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Defect, DefectCategory } from '../../../../types/master-data/defect'

const formRef = ref()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  defect: Partial<Defect>
  categories: Pick<DefectCategory, 'id' | 'name'>[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<Defect>]
}>()

const schema = z.object({
  name: z.string().min(1, 'Defect name is required'),
  defect_category_id: z.number({ message: 'Category is required' }),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  defect_category_id: undefined,
  description: ''
})

// Sync data when edit
watch(
  () => props.defect,
  (val) => {
    state.name = val.name ?? ''
    state.description = val.description ?? ''
    state.defect_category_id = val.defect_category_id ?? undefined
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
      state.defect_category_id = undefined
    }
  }
)

const categoryItems = computed(() => [
  props.categories.map(cat => cat.name)
])

const selectedCategory = computed({
  get() {
    if (!state.defect_category_id) return undefined

    const found = props.categories.find(
      c => c.id === state.defect_category_id
    )

    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      state.defect_category_id = undefined
      return
    }

    const found = props.categories.find(
      c => c.name === value
    )

    state.defect_category_id = found?.id
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
    :title="props.mode === 'add' ? 'Add New Defect' : 'Edit Defect'"
    :description="props.mode === 'add'
      ? 'Add a new defect to the system'
      : 'Update defect details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Defect Name" name="name" required>
          <UInput v-model="state.name" placeholder="e.g. Retak" class="w-full" />
        </UFormField>

        <UFormField label="Category" name="defect_category_id" required>
          <USelectMenu 
            v-model="selectedCategory"
            :items="categoryItems"
            placeholder="Select Category"
            class="w-full"
            clear
          />
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