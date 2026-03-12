<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Shift, ShiftType, ShiftCategory } from '../../../../types/master-data/shift'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  shift: Partial<Shift>
  shiftTypes: ShiftType[]
  shiftCategories: ShiftCategory[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: Partial<Shift>]
}>()

const name = ref('')
const shift_number = ref('')
const type = ref<string | undefined>(undefined)
const start_time = ref('')
const end_time = ref('')
const category = ref<string | undefined>(undefined)
const description = ref('')
const active = ref(true)

watch(() => props.shift, (val) => {
  name.value = val.name ?? ''
  shift_number.value = val.shift_number ?? ''
  type.value = val.type ?? undefined
  start_time.value = val.start_time?.slice(0, 5) ?? ''
  end_time.value = val.end_time?.slice(0, 5) ?? ''
  category.value = val.category ?? undefined
  description.value = val.description ?? ''
  active.value = val.active ?? true
}, { immediate: true, deep: true })

const typeItems = computed(() => [props.shiftTypes.map(t => t.name)])
const categoryItems = computed(() => [props.shiftCategories.map(c => c.name)])

const selectedType = computed({
  get: () => props.shiftTypes.find(t => t.id === type.value)?.name,
  set: (v) => { type.value = v ? props.shiftTypes.find(t => t.name === v)?.id : undefined },
})

const selectedCategory = computed({
  get: () => props.shiftCategories.find(c => c.id === category.value)?.name,
  set: (v) => { category.value = v ? props.shiftCategories.find(c => c.name === v)?.id : undefined },
})

function handleSave() {
  emit('save', {
    name: name.value,
    shift_number: shift_number.value,
    type: type.value,
    start_time: start_time.value,
    end_time: end_time.value,
    category: category.value,
    description: description.value || null,
    active: active.value,
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Shift' : 'Edit Shift'"
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="shift-form" class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Name" required>
          <UInput v-model="name" placeholder="e.g. Shift 1 Morning" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Shift Number" required>
          <UInput v-model="shift_number" placeholder="e.g. MRN001" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Type" required>
          <USelectMenu v-model="selectedType" :items="typeItems" placeholder="Select type" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Category" required>
          <USelectMenu v-model="selectedCategory" :items="categoryItems" placeholder="Select category" class="w-full" clear :disabled="loading" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start Time" required>
            <UInput v-model="start_time" type="time" class="w-full" :disabled="loading" />
          </UFormField>
          <UFormField label="End Time" required>
            <UInput v-model="end_time" type="time" class="w-full" :disabled="loading" />
          </UFormField>
        </div>

        <UFormField label="Description">
          <UTextarea v-model="description" placeholder="Optional description" class="w-full" rows="2" :disabled="loading" />
        </UFormField>

        <UFormField label="Status">
          <UCheckbox v-model="active" label="Active" :disabled="loading" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" :disabled="loading" @click="emit('update:open', false)" />
        <UButton type="submit" form="shift-form" label="Save" color="primary" :loading="loading" />
      </div>
    </template>
  </UModal>
</template>