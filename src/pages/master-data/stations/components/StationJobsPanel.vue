<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { Station, StationJob } from '../../../../types/master-data/station'
import type { Job } from '../../../../types/master-data/job'

const props = defineProps<{
  station: Station
  stationJobs: StationJob[]
  jobDropdown: Pick<Job, 'id' | 'job_code' | 'name'>[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'add': [data: Partial<StationJob>]
  'update': [id: number, data: Partial<StationJob>]
  'delete': [id: number]
}>()

const router = useRouter()
const PREVIEW_LIMIT = 5

const panelSearch = ref('')

const filteredJobs = computed(() => {
  if (!panelSearch.value.trim()) return props.stationJobs
  const q = panelSearch.value.toLowerCase()
  return props.stationJobs.filter(sj =>
    sj.job?.name?.toLowerCase().includes(q) ||
    sj.job?.job_code?.toLowerCase().includes(q)
  )
})

const displayedJobs = computed(() =>
  panelSearch.value.trim()
    ? filteredJobs.value
    : filteredJobs.value.slice(0, PREVIEW_LIMIT)
)

const hiddenCount = computed(() =>
  panelSearch.value.trim() ? 0 : Math.max(0, props.stationJobs.length - PREVIEW_LIMIT)
)

const isAdding = ref(false)
const newJobId = ref<number | undefined>(undefined)
const newSequence = ref(0)
const newMandatory = ref(true)
const newActive = ref(true)

const editingId = ref<number | null>(null)
const editJobId = ref<number | undefined>(undefined)
const editSequence = ref(0)
const editMandatory = ref(true)
const editActive = ref(true)

const assignedJobIds = computed(() => new Set(props.stationJobs.map(sj => sj.job_id)))

const availableJobItems = computed(() => [
  props.jobDropdown
    .filter(j => !assignedJobIds.value.has(j.id))
    .map(j => `${j.job_code} – ${j.name}`)
])

const allJobItems = computed(() => [
  props.jobDropdown.map(j => `${j.job_code} – ${j.name}`)
])

function jobLabel(job_id: number | undefined) {
  if (!job_id) return undefined
  const j = props.jobDropdown.find(j => j.id === job_id)
  return j ? `${j.job_code} – ${j.name}` : undefined
}

function jobIdFromLabel(label: string | undefined) {
  if (!label) return undefined
  return props.jobDropdown.find(j => `${j.job_code} – ${j.name}` === label)?.id
}

const selectedNewJob = computed({
  get: () => jobLabel(newJobId.value),
  set: (v) => { newJobId.value = jobIdFromLabel(v) },
})

const selectedEditJob = computed({
  get: () => jobLabel(editJobId.value),
  set: (v) => { editJobId.value = jobIdFromLabel(v) },
})

function startAdd() {
  isAdding.value = true
  newJobId.value = undefined
  newSequence.value = 0
  newMandatory.value = true
  newActive.value = true
}

function cancelAdd() {
  isAdding.value = false
}

function submitAdd() {
  if (!newJobId.value) return
  emit('add', {
    job_id: newJobId.value,
    sequence: newSequence.value,
    mandatory: newMandatory.value,
    active: newActive.value,
  })
  isAdding.value = false
}

function startEdit(sj: StationJob) {
  editingId.value = sj.id
  editJobId.value = sj.job_id
  editSequence.value = sj.sequence
  editMandatory.value = sj.mandatory
  editActive.value = sj.active
}

function cancelEdit() {
  editingId.value = null
}

function submitEdit(id: number) {
  emit('update', id, {
    job_id: editJobId.value,
    sequence: editSequence.value,
    mandatory: editMandatory.value,
    active: editActive.value,
  })
  editingId.value = null
}

const confirm = reactive({
  open: false,
  jobName: '',
  targetId: null as number | null,
})

function openDeleteConfirm(sj: StationJob) {
  confirm.targetId = sj.id
  confirm.jobName = sj.job?.name ?? 'this job'
  confirm.open = true
}

function submitDelete() {
  if (confirm.targetId === null) return
  emit('delete', confirm.targetId)
  confirm.open = false
  confirm.targetId = null
}

function goToDetail() {
  router.push(`/master-data/stations/${props.station.id}/jobs`)
}
</script>

<template>
  <div class="px-6 py-4 bg-elevated/40 border-b border-default space-y-3">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <p class="text-sm font-semibold">Jobs — {{ station.name }}</p>
        <UBadge :label="`${stationJobs.length} total`" color="neutral" variant="soft" size="xs" />
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="!isAdding"
          icon="i-lucide-plus"
          label="Add Job"
          size="xs"
          color="primary"
          variant="soft"
          @click="startAdd"
        />
        <UButton
          icon="i-lucide-external-link"
          label="View All"
          size="xs"
          color="neutral"
          variant="ghost"
          trailing
          @click="goToDetail"
        />
      </div>
    </div>

    <UInput
      v-if="stationJobs.length > 0"
      v-model="panelSearch"
      icon="i-lucide-search"
      placeholder="Search jobs..."
      size="xs"
      class="w-full max-w-xs"
    />

    <!-- Add row -->
    <div v-if="isAdding" class="flex items-center gap-3 p-2 rounded-lg border border-primary/30 bg-primary/5">
      <USelectMenu v-model="selectedNewJob" :items="availableJobItems" placeholder="Select job" class="flex-1 min-w-0" clear />
      <UInput v-model.number="newSequence" type="number" placeholder="Seq" class="w-20" :min="0" />
      <UCheckbox v-model="newMandatory" label="Mandatory" />
      <UCheckbox v-model="newActive" label="Active" />
      <UButton icon="i-lucide-check" color="primary" size="xs" :disabled="!newJobId || loading" @click="submitAdd" />
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="cancelAdd" />
    </div>

    <!-- Empty state -->
    <p v-if="!stationJobs.length && !isAdding" class="text-sm text-muted text-center py-2">
      No jobs assigned to this station yet.
    </p>

    <!-- No search result -->
    <p v-else-if="stationJobs.length && !displayedJobs.length" class="text-sm text-muted text-center py-2">
      No jobs found for "{{ panelSearch }}".
    </p>

    <!-- Job rows -->
    <div
      v-for="sj in displayedJobs"
      :key="sj.id"
      class="flex items-center gap-2 p-2 rounded-lg border border-default bg-default"
    >
      <!-- Edit mode -->
      <template v-if="editingId === sj.id">
        <USelectMenu v-model="selectedEditJob" :items="allJobItems" placeholder="Select job" class="flex-1 min-w-0" clear />
        <UInput v-model.number="editSequence" type="number" placeholder="Seq" class="w-20" :min="0" />
        <UCheckbox v-model="editMandatory" label="Mandatory" />
        <UCheckbox v-model="editActive" label="Active" />
        <UButton icon="i-lucide-check" color="primary" size="xs" :disabled="loading" @click="submitEdit(sj.id)" />
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="cancelEdit" />
      </template>

      <!-- View mode -->
      <template v-else>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ sj.job?.name ?? '—' }}</p>
          <p class="text-xs text-muted">{{ sj.job?.job_code }} · {{ sj.job?.standard_time }}m</p>
        </div>
        <span class="text-xs text-muted w-14 text-center shrink-0">Seq: {{ sj.sequence }}</span>
        <UBadge
          :label="sj.mandatory ? 'Mandatory' : 'Optional'"
          :color="sj.mandatory ? 'warning' : 'neutral'"
          variant="soft" size="xs" class="shrink-0"
        />
        <UBadge
          :label="sj.active ? 'Active' : 'Inactive'"
          :color="sj.active ? 'success' : 'neutral'"
          variant="soft" size="xs" class="shrink-0"
        />
        <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="startEdit(sj)" />
        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" :disabled="loading" @click="openDeleteConfirm(sj)" />
      </template>
    </div>

    <button
      v-if="hiddenCount > 0"
      class="w-full text-xs text-muted text-center py-1 hover:text-primary transition-colors"
      @click="goToDetail"
    >
      +{{ hiddenCount }} more job{{ hiddenCount > 1 ? 's' : '' }} — View All
    </button>

  </div>

  <UModal v-model:open="confirm.open" title="Remove Job" :ui="{ content: 'sm:max-w-sm' }">
    <template #body>
      <p class="text-sm text-muted">
        Remove <span class="font-semibold text-default">{{ confirm.jobName }}</span> from this station?
        This action cannot be undone.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="confirm.open = false" />
        <UButton label="Remove" color="error" :loading="loading" @click="submitDelete" />
      </div>
    </template>
  </UModal>
</template>