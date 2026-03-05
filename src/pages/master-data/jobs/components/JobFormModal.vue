<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Job, JobType } from '../../../../types/master-data/job'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  job: Partial<Job>
  jobTypes: JobType[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: Partial<Job>]
}>()

const job_code = ref('')
const name = ref('')
const job_type_id = ref<number | undefined>(undefined)
const standard_time = ref(0)
const active = ref(true)

watch(() => props.job, (val) => {
  job_code.value = val.job_code ?? ''
  name.value = val.name ?? ''
  job_type_id.value = val.job_type_id ?? undefined
  standard_time.value = val.standard_time ?? 0
  active.value = val.active ?? true
}, { immediate: true, deep: true })

const typeItems = computed(() => [props.jobTypes.map(t => t.name)])

const selectedType = computed({
  get: () => props.jobTypes.find(t => t.id === job_type_id.value)?.name,
  set: (v) => { job_type_id.value = v ? props.jobTypes.find(t => t.name === v)?.id : undefined },
})

function handleSave() {
  emit('save', {
    job_code: job_code.value,
    name: name.value,
    job_type_id: job_type_id.value,
    standard_time: standard_time.value,
    active: active.value,
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Job' : 'Edit Job'"
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="job-form" class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Job Code" required>
          <UInput v-model="job_code" placeholder="e.g. JOB-001" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Name" required>
          <UInput v-model="name" placeholder="e.g. Bolt Tightening" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Job Type" required>
          <USelectMenu v-model="selectedType" :items="typeItems" placeholder="Select type" class="w-full" clear :disabled="loading" />
        </UFormField>

        <UFormField label="Standard Time (minutes)" required>
          <UInput v-model.number="standard_time" type="number" min="0" class="w-full" :disabled="loading" />
        </UFormField>

        <UFormField label="Status">
          <UCheckbox v-model="active" label="Active" :disabled="loading" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" :disabled="loading" @click="emit('update:open', false)" />
        <UButton type="submit" form="job-form" label="Save" color="primary" :loading="loading" />
      </div>
    </template>
  </UModal>
</template>