<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Station, StationType } from '../../../../types/master-data/station'
import type { Line } from '../../../../types/master-data/line'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  station: Partial<Station>
  lines: Pick<Line, 'id' | 'name'>[]
  stationTypes: StationType[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: Partial<Station>]
}>()

const station_code = ref('')
const name = ref('')
const line_id = ref<number | undefined>(undefined)
const station_type_id = ref<number | undefined>(undefined)
const sequence = ref(0)
const status = ref(true)

watch(() => props.station, (val) => {
  station_code.value = val.station_code ?? ''
  name.value = val.name ?? ''
  line_id.value = val.line_id ?? undefined
  station_type_id.value = val.station_type_id ?? undefined
  sequence.value = val.sequence ?? 0
  status.value = val.status ?? true
}, { immediate: true, deep: true })

const lineItems = computed(() => [props.lines.map(l => l.name)])
const typeItems = computed(() => [props.stationTypes.map(t => t.name)])

const selectedLine = computed({
  get: () => props.lines.find(l => l.id === line_id.value)?.name,
  set: (v) => { line_id.value = v ? props.lines.find(l => l.name === v)?.id : undefined },
})

const selectedType = computed({
  get: () => props.stationTypes.find(t => t.id === station_type_id.value)?.name,
  set: (v) => { station_type_id.value = v ? props.stationTypes.find(t => t.name === v)?.id : undefined },
})

function handleSave() {
  emit('save', {
    station_code: station_code.value,
    name: name.value,
    line_id: line_id.value,
    station_type_id: station_type_id.value,
    sequence: sequence.value,
    status: status.value,
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Station' : 'Edit Station'"
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="station-form" class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Station Code" required>
          <UInput v-model="station_code" placeholder="e.g. ST-001" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Name" required>
          <UInput v-model="name" placeholder="e.g. Assembly A" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Line" required>
          <USelectMenu v-model="selectedLine" :items="lineItems" placeholder="Select line" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Station Type" required>
          <USelectMenu v-model="selectedType" :items="typeItems" placeholder="Select type" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Sequence" required>
          <UInput v-model.number="sequence" type="number" min="0" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Status">
          <UCheckbox v-model="status" label="Active" :disabled="loading" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" :disabled="loading" @click="emit('update:open', false)" />
        <UButton type="submit" form="station-form" label="Save" color="primary" :loading="loading" />
      </div>
    </template>
  </UModal>
</template>