<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const formRef = ref()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  parts: { id: number; part_number: string; part_name: string }[]
  loading: boolean
  partDisabled?: boolean
  kanbanDisabled?: boolean
  item?: { part_id: number; total_kanban: number } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: { part_id: number; total_kanban: number }]
}>()

const schema = z.object({
  part_id: z.number({ message: 'Part is required' }),
  total_kanban: z.number().min(1, 'Total Kanban must be at least 1')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  part_id: undefined,
  total_kanban: 1
})

// Reset when open in add mode
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.mode === 'edit' && props.item) {
        state.part_id = props.item.part_id
        state.total_kanban = props.item.total_kanban
      } else {
        state.part_id = undefined
        state.total_kanban = 1
      }
    }
  }
)

const partItems = computed(() =>
  props.parts.map(p => `${p.part_number} - ${p.part_name}`)
)

const selectedPart = computed({
  get() {
    if (!state.part_id) return undefined

    const found = props.parts.find(
      p => p.id === state.part_id
    )

    return found ? `${found.part_number} - ${found.part_name}` : undefined
  },
  set(value: string | undefined) {
    if (!value) {
      state.part_id = undefined
      return
    }

    const found = props.parts.find(
      p => `${p.part_number} - ${p.part_name}` === value
    )

    state.part_id = found?.id
  }
})

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
    :title="props.mode === 'add' ? 'Add New Item' : 'Edit Item'"
    :description="props.mode === 'add'
      ? 'Add a new item to the work order'
      : 'Update item details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Part" name="part_id" required>
          <USelectMenu 
            v-model="selectedPart"
            :items="partItems"
            placeholder="Select Part"
            class="w-full"
            clear
            :disabled="props.partDisabled"
          />
        </UFormField>

        <UFormField label="Total Kanban" name="total_kanban" required>
          <UInput
            type="number"
            v-model="state.total_kanban"
            placeholder="Enter total kanban"
            class="w-full"
            :disabled="props.kanbanDisabled"
          />
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