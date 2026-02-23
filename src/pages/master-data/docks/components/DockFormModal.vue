<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Dock } from '../../../../types/master-data/dock'
import type { DropdownOption } from '../composables/useDockDropdowns'

const formRef = ref()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  dock: Partial<Dock>
  areas: DropdownOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<Dock>]
}>()

const schema = z.object({
  dock_code: z.string().min(1, 'Dock code is required'),
  name: z.string().min(1, 'Dock name is required'),
  area_id: z.number({ message: 'Warehouse Area is required' })
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  dock_code: '',
  name: '',
  area_id: undefined
})

// Sync data when edit
watch(
  () => props.dock,
  (val) => {
    state.dock_code = val.dock_code ?? ''
    state.name = val.name ?? ''

    state.area_id = val.area?.id ?? undefined
  },
  { immediate: true, deep: true }
)

// Reset when open in add mode
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.dock_code = ''
      state.name = ''
      state.area_id = undefined
    }
  }
)

const areaItems = computed(() => [
  props.areas.map(area => area.name)
])

const selectedArea = computed({
  get() {
    if (state.area_id == null) return undefined

    const found = props.areas.find(
      a => a.id === state.area_id
    )
    return found?.name
  },
  set(value: string | undefined) {
    if (!value) {
      state.area_id = undefined
      return
    }

    const found = props.areas.find(
      a => a.name === value
    )

    state.area_id = found?.id
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
    :title="props.mode === 'add' ? 'Add Dock' : 'Edit Dock'"
    :description="props.mode === 'add' ? 'Add a new dock to the system' : 'Update dock details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :state="state" :schema="schema" @submit="onSubmit" class="space-y-4">
        <UFormField label="Dock Code" name="dock_code" required>
          <UInput v-model="state.dock_code" placeholder="e.g. D001" class="w-full" />
        </UFormField>

        <UFormField label="Dock Name" name="name" required>
          <UInput v-model="state.name" placeholder="e.g. Main Dock" class="w-full" />
        </UFormField>

        <UFormField label="Warehouse Area" name="area_id" required>
          <USelectMenu
            v-model="selectedArea"
            :items="areaItems"
            placeholder="Select Warehouse Area"
            class="w-full"
            clear
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
        <UButton color="primary" label="Save" :loading="props.loading" @click="submitForm" />
      </div>
    </template>
  </UModal>
</template>