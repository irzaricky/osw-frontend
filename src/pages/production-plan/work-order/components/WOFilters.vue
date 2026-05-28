<script setup lang="ts">
/**
 * WoFilters.vue — [PERUBAHAN]
 *
 * Perubahan dari versi sebelumnya:
 * 1. Props `filters` kini menyertakan field `shift_id`.
 * 2. Tambah prop `shifts` (daftar master data Shift) untuk mengisi dropdown.
 * 3. Tambah computed `selectedShift` yang mengirim `shift_id` saat berubah.
 * 4. Komponen `USelectMenu` baru untuk memilih Shift ditambahkan di baris filter.
 * 5. `hasActiveFilters` kini juga mendeteksi filter shift yang aktif.
 */
import { computed } from 'vue'
import type { WorkOrderStatus, Shift } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  search:  string
  filters: {
    status?:    WorkOrderStatus
    work_date?: string
    line_id?:   number
    shift_id?:  number    // [BARU]
  }
  shifts?: Shift[]        // [BARU] data master shift untuk dropdown
}>()

const emit = defineEmits<{
  'update:search':  [value: string]
  'update:filters': [value: typeof props.filters]
  'reset':          []
}>()

const statusItems = ['Draft', 'Released', 'In_Progress', 'Completed', 'Cancelled'] as WorkOrderStatus[]

const statusLabel: Record<WorkOrderStatus, string> = {
  Draft:       'Draft',
  Released:    'Released',
  In_Progress: 'In Progress',
  Completed:   'Completed',
  Cancelled:   'Cancelled',
}

const selectedStatus = computed({
  get: () => props.filters.status ?? null,
  set: (v) => emit('update:filters', { ...props.filters, status: v ?? undefined }),
})

const selectedDate = computed({
  get: () => props.filters.work_date ?? '',
  set: (v) => emit('update:filters', { ...props.filters, work_date: v || undefined }),
})

// [BARU] Computed untuk filter shift_id.
// USelectMenu menggunakan objek Shift, tapi kita emit hanya id-nya ke parent.
const selectedShift = computed({
  get: () => props.shifts?.find((s) => s.id === props.filters.shift_id) ?? null,
  set: (v: Shift | null) => emit('update:filters', { ...props.filters, shift_id: v?.id ?? undefined }),
})

// Label yang ditampilkan di dalam dropdown shift: "Shift 1 · 07:00 - 15:00"
function shiftLabel(s: Shift) {
  return `${s.name} · ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`
}

// [PERUBAHAN] Deteksi filter aktif kini juga mengecek shift_id
const hasActiveFilters = computed(() =>
  !!props.search || !!props.filters.status || !!props.filters.work_date || !!props.filters.shift_id,
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">

    <!-- Status Filter — tidak berubah -->
    <USelectMenu
      v-model="selectedStatus"
      :items="statusItems"
      placeholder="All Statuses"
      class="w-44"
      clear
    />

    <!-- Work Date Filter — tidak berubah -->
    <UInput
      v-model="selectedDate"
      type="date"
      icon="i-lucide-calendar"
      placeholder="Work Date"
      class="w-48"
    />

    <!--
      [BARU] Shift Filter Dropdown
      Hanya ditampilkan jika prop `shifts` tersedia (dikirim dari halaman parent).
      Menggunakan valueKey agar USelectMenu bisa membandingkan objek dengan benar.
    -->
    <USelectMenu
      v-if="shifts && shifts.length > 0"
      v-model="selectedShift"
      :items="shifts"
      :option-attribute="undefined"
      value-key="id"
      placeholder="All Shifts"
      class="w-52"
      clear
    >
      <template #label>
        <template v-if="selectedShift">
          <UIcon name="i-lucide-clock" class="w-4 h-4 text-muted" />
          <span>{{ shiftLabel(selectedShift) }}</span>
        </template>
        <template v-else>
          <UIcon name="i-lucide-clock" class="w-4 h-4 text-muted" />
          <span class="text-muted">All Shifts</span>
        </template>
      </template>

      <template #option="{ option: s }">
        <div class="flex flex-col">
          <span class="font-medium text-sm">{{ s.name }}</span>
          <span class="text-xs text-muted">{{ s.start_time.slice(0, 5) }} – {{ s.end_time.slice(0, 5) }}</span>
        </div>
      </template>
    </USelectMenu>

    <!-- Search & Reset -->
    <div class="ml-auto flex items-center gap-2">
      <UButton
        v-if="hasActiveFilters"
        label="Reset"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="emit('reset')"
      />
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search WO number..."
        class="w-64"
        @update:model-value="emit('update:search', $event)"
      />
    </div>

  </div>
</template>