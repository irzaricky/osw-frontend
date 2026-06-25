<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import type { LocalDetail } from '../composables/useBomForm'
import { useBomComponentColumns } from '../composables/useBomComponentColumns'

interface Props {
  localDetails:    LocalDetail[]
  loading:         boolean
  saving:          boolean
  isDirty:         boolean
  isCreate:        boolean
  isEditable:      boolean
  currentBom?:     any
  canAddDetail:    boolean
  resolveUomCode:  (d: LocalDetail) => string
}

const props = defineProps<Props>()
const emit  = defineEmits<{
  addDetail:    []
  editDetail:   [d: LocalDetail]
  deleteDetail: [d: LocalDetail]
  save:         [andSubmit: boolean]
  discard:      []
}>()

const router = useRouter()

function goToChildBom(childBomId: number) {
  router.push(`/production-plan/bom/${childBomId}`)
}

const ui = {
  UButton:       resolveComponent('UButton') as any,
  UDropdownMenu: resolveComponent('UDropdownMenu') as any,
  UBadge:        resolveComponent('UBadge') as any,
}

const TYPE_FILTER_OPTIONS = [
  { label: 'Product', value: 'PRODUCT' },
  { label: 'WIP',     value: 'WIP' },
  { label: 'Raw',     value: 'RAW' },
]

const LEVEL_FILTER_OPTIONS = [0, 1, 2, 3, 4, 5].map((lvl) => ({
  label: `L${lvl}`,
  value: lvl,
}))

// ── Filters ───────────────────────────────────────────────────────────────────
const search      = ref('')
const typeFilter  = ref<string | undefined>(undefined)
const levelFilter = ref<number | undefined>(undefined)

// ── Pagination ────────────────────────────────────────────────────────────────
const page  = ref(1)
const limit = 10

function resetPage() {
  page.value = 1
}

// ── Data pipeline ─────────────────────────────────────────────────────────────
const sortedDetails = computed(() =>
  props.localDetails.slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
)

const filteredDetails = computed(() => {
  let list = sortedDetails.value

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((d) =>
      (d._part?.part_number ?? '').toLowerCase().includes(q) ||
      (d._part?.part_name   ?? '').toLowerCase().includes(q),
    )
  }

  if (typeFilter.value !== undefined && typeFilter.value !== null) {
    list = list.filter((d) => d.type === typeFilter.value)
  }

  if (levelFilter.value !== undefined && levelFilter.value !== null) {
    list = list.filter((d) => d.level === levelFilter.value)
  }

  return list
})

// Meta untuk pagination text (mirip pola yang diminta)
const meta = computed(() => ({
  total: filteredDetails.value.length,
  page:  page.value,
  limit,
}))

const pageOffset = computed(() => (page.value - 1) * limit)

const paginatedDetails = computed(() =>
  filteredDetails.value.slice(pageOffset.value, pageOffset.value + limit),
)

// ── Columns ───────────────────────────────────────────────────────────────────
const isEditableOrCreate = computed(() => props.isEditable || props.isCreate)

const { columns } = useBomComponentColumns(
  {
    onEdit:         (d) => emit('editDetail', d),
    onDelete:       (d) => emit('deleteDetail', d),
    onViewChildBom: goToChildBom, // ← sekarang terhubung
  },
  ui,
  props.resolveUomCode,
  isEditableOrCreate,
  pageOffset,
)
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold flex items-center gap-2">
          Components
          <UBadge
            v-if="localDetails.length"
            :label="String(localDetails.length)"
            color="neutral"
            variant="soft"
            size="sm"
          />
        </h3>
        <UButton
          v-if="isEditable || isCreate"
          label="Add Component"
          :disabled="!canAddDetail"
          @click="emit('addDetail')"
        />
      </div>

      <!-- Filters -->
      <div v-if="localDetails.length" class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search part number or name..."
          class="w-full sm:w-64"
          @update:model-value="resetPage"
        />
        <USelectMenu
          v-model="typeFilter"
          :items="TYPE_FILTER_OPTIONS"
          value-key="value"
          label-key="label"
          placeholder="Filter by Type"
          class="w-full sm:w-40"
          clearable
          @update:model-value="resetPage"
        />
        <USelectMenu
          v-model="levelFilter"
          :items="LEVEL_FILTER_OPTIONS"
          value-key="value"
          label-key="label"
          placeholder="Filter by Level"
          class="w-full sm:w-36"
          clearable
          @update:model-value="resetPage"
        />
      </div>

      <!-- Empty: belum ada komponen sama sekali -->
      <div
        v-if="!loading && !localDetails.length"
        class="flex flex-col items-center justify-center py-12 gap-3 text-muted"
      >
        <UIcon name="i-lucide-package-open" class="w-10 h-10" />
        <p class="text-sm">
          <template v-if="!canAddDetail">
            Select a parent part above before adding components.
          </template>
          <template v-else>
            No components yet. Add the first component to this BOM.
          </template>
        </p>
        <UButton
          v-if="isEditable || isCreate"
          label="Add Component"
          :disabled="!canAddDetail"
          @click="emit('addDetail')"
        />
      </div>

      <!-- Empty: filter tidak cocok -->
      <div
        v-else-if="!loading && !filteredDetails.length"
        class="flex flex-col items-center justify-center py-12 gap-3 text-muted"
      >
        <UIcon name="i-lucide-search-x" class="w-10 h-10" />
        <p class="text-sm">No components match your filters.</p>
      </div>

      <!-- Table -->
      <UTable
        v-else
        :data="paginatedDetails"
        :columns="columns"
        :loading="loading && !isCreate"
      />

      <!-- Pagination -->
      <div
        v-if="filteredDetails.length > limit"
        class="flex items-center justify-between gap-3"
      >
        <div class="text-sm text-muted">
          {{ meta.total === 0 ? '0' : ((meta.page - 1) * meta.limit) + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} of {{ meta.total }} row(s)
        </div>
        <UPagination
          v-model:page="page"
          :total="filteredDetails.length"
          :items-per-page="limit"
        />
      </div>
    </div>

    <!-- Actions -->
    <div v-if="isEditable || isCreate" class="flex justify-end gap-2">
      <div class="flex-1 text-sm text-muted flex items-center gap-2">
        <p class="text-muted">
          <template v-if="isCreate">
            <span class="font-medium">{{ localDetails.length }}</span> component(s) added.
            Save as Draft to keep editing later, or Submit directly for approval.
          </template>
          <template v-else-if="isDirty">
            <span class="text-warning-600 dark:text-warning-400 font-medium">
              <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 inline-block mr-1" />
              Unsaved changes
            </span>
            — save to apply all changes at once.
          </template>
          <template v-else>
            <span class="text-success-600 dark:text-success-400">
              <UIcon name="i-lucide-check" class="w-3 h-3 inline-block mr-1" />
              All changes saved.
            </span>
          </template>
        </p>
      </div>
      <UButton
        v-if="!isCreate && isDirty"
        label="Discard"
        color="neutral"
        variant="ghost"
        :disabled="saving"
        @click="emit('discard')"
      />
      <UButton
        color="neutral"
        variant="outline"
        :loading="saving"
        :disabled="!isDirty && !isCreate"
        @click="emit('save', false)"
      >
        {{ isCreate ? 'Save as Draft' : 'Save Changes' }}
      </UButton>
      <UButton
        v-if="isCreate || currentBom?.doc_status === 'Draft' || currentBom?.doc_status === 'Rejected'"
        color="primary"
        :loading="saving"
        :disabled="!localDetails.length"
        @click="emit('save', true)"
      >
        Submit for Approval
      </UButton>
    </div>
  </div>
</template>