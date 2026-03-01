<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { StationJob } from '../../../../../../types/master-data/station'
import type { Job } from '../../../../../../types/master-data/job'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  stationJob: Partial<StationJob>
  jobDropdown: Pick<Job, 'id' | 'job_code' | 'name'>[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: Partial<StationJob>]
}>()

// ─── Form fields — tiap boolean sebagai ref terpisah ───────────────
const job_id = ref<number | undefined>(undefined)
const sequence = ref(0)
const mandatory = ref(true)
const active = ref(true)

watch(() => props.stationJob, (val) => {
  job_id.value = val.job_id ?? undefined
  sequence.value = val.sequence ?? 0
  mandatory.value = val.mandatory ?? true
  active.value = val.active ?? true
}, { immediate: true, deep: true })

// ─── Job dropdown ──────────────────────────────────────────────────
const jobItems = computed(() => [props.jobDropdown.map(j => `${j.job_code} – ${j.name}`)])

const selectedJob = computed({
  get: () => {
    if (!job_id.value) return undefined
    const j = props.jobDropdown.find(j => j.id === job_id.value)
    return j ? `${j.job_code} – ${j.name}` : undefined
  },
  set: (v) => {
    job_id.value = v
      ? props.jobDropdown.find(j => `${j.job_code} – ${j.name}` === v)?.id
      : undefined
  },
})

function handleSave() {
  emit('save', {
    job_id: job_id.value,
    sequence: sequence.value,
    mandatory: mandatory.value,
    active: active.value,
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Assign Job' : 'Edit Job Assignment'"
    :ui="{ content: 'sm:max-w-lg' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="station-job-form" class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Job" required>
          <USelectMenu
            v-model="selectedJob"
            :items="jobItems"
            placeholder="Select job"
            class="w-full"
            clear
            :disabled="mode === 'edit' || loading"
          />
        </UFormField>

        <UFormField label="Sequence" required>
          <UInput
            v-model.number="sequence"
            type="number"
            min="0"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Options">
          <div class="flex items-center gap-6">
            <UCheckbox v-model="mandatory" label="Mandatory" :disabled="loading" />
            <UCheckbox v-model="active" label="Active" :disabled="loading" />
          </div>
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" :disabled="loading" @click="emit('update:open', false)" />
        <UButton type="submit" form="station-job-form" label="Save" color="primary" :loading="loading" />
      </div>
    </template>
  </UModal>
</template>