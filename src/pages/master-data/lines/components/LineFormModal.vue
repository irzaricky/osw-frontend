<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { Line } from '../../../../types/master-data/line'
import type { Factory } from '../../../../types/master-data/factory'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  line: Partial<Line>
  factories: Pick<Factory, 'id' | 'name'>[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: Partial<Line>): void
}>()

const localLine = reactive<Partial<Line>>({
  line_code: '',
  name: '',
  factory_id: undefined,
  sequence: 0
})

watch(
  () => props.line,
  (newVal) => {
    Object.assign(localLine, {
      line_code: newVal.line_code || '',
      name: newVal.name || '',
      factory_id: newVal.factory_id ?? undefined,
      sequence: newVal.sequence ?? 0
    })
  },
  { deep: true, immediate: true }
)

const factoryItems = computed(() => [
  props.factories.map(f => f.name)
])

const selectedFactory = computed({
  get() {
    if (localLine.factory_id == null) return undefined
    return props.factories.find(f => f.id === localLine.factory_id)?.name
  },
  set(value: string | undefined) {
    if (!value) {
      localLine.factory_id = undefined
      return
    }
    const found = props.factories.find(f => f.name === value)
    localLine.factory_id = found?.id
  }
})

function handleSubmit() {
  emit('save', { ...localLine })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Line' : 'Edit Line'"
    :description="mode === 'add' ? 'Add a new production line.' : 'Update production line details.'"
    :ui="{ content: 'sm:max-w-[600px]' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="line-form" class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Line Code" required>
          <UInput
            v-model="localLine.line_code"
            placeholder="e.g. L001"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Name" required>
          <UInput
            v-model="localLine.name"
            placeholder="e.g. Assembly Line 1"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Factory" required>
          <USelectMenu
            v-model="selectedFactory"
            :items="factoryItems"
            placeholder="Select factory"
            class="w-full"
            clear
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Sequence" required>
          <UInput
            v-model.number="localLine.sequence"
            type="number"
            placeholder="e.g. 1"
            class="w-full"
            :disabled="loading"
            :min="0"
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
          form="line-form"
          label="Save"
          color="primary"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>