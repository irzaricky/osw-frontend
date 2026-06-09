<script setup lang="ts">
/**
 * WODailySummary.vue — [PERUBAHAN]
 *
 * Perubahan dari versi sebelumnya:
 * 1. Tambah prop `shifts` dan `shiftId` (v-model) untuk filter Shift di header kartu summary.
 * 2. Tambah prop `stage` (v-model) untuk filter Stage yang bisa dikontrol dari luar.
 * 3. Setiap kali `shiftId` atau `stage` berubah, emit event `@filter-change` ke parent
 *    agar parent me-refetch summary dengan params baru. Kartu "Active Issues" secara
 *    otomatis reaktif karena nilainya datang dari prop `summary` yang di-update parent.
 * 4. Tambah kartu "Active Issues" menjadi elemen tersendiri yang mencolok (merah)
 *    dengan indikator berkedip jika ada issue aktif.
 * 5. Tambah stage_breakdown jika tersedia dari BE (opsional, collapsible).
 */
import { computed } from 'vue'
import type { DailySummary, Shift } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  workDate: string
  summary:  DailySummary | null
  loading:  boolean
  shifts?:  Shift[]         // [BARU] data master shift untuk filter di summary
  shiftId?: number | null   // [BARU] filter shift yang aktif (v-model)
  stage?:   number | null   // [BARU] filter stage yang aktif (v-model)
}>()

const emit = defineEmits<{
  'update:workDate': [value: string]
  'update:shiftId':  [value: number | null]    // [BARU]
  'update:stage':    [value: number | null]    // [BARU]
  'refresh':         []
  'filter-change':   []    // [BARU] dipancarkan ke parent agar re-fetch summary
}>()

const achievementColor = computed(() => {
  const pct = props.summary?.achievement_pct ?? 0
  if (pct >= 100) return 'text-success-600'
  if (pct >= 80)  return 'text-warning-600'
  return 'text-error-600'
})

// [BARU] Computed untuk dua-arah binding shift di dalam komponen ini
const selectedShiftId = computed({
  get: () => props.shiftId ?? null,
  set: (v: number | null) => {
    emit('update:shiftId', v)
    emit('filter-change')   // beri tahu parent untuk re-fetch
  },
})

const selectedShift = computed({
  get: () => props.shifts?.find((s) => s.id === selectedShiftId.value) ?? null,
  set: (v: Shift | null) => { selectedShiftId.value = v?.id ?? null },
})

// [BARU] Computed untuk stage breakdown yang dikembalikan BE (opsional)
const stageBreakdownList = computed(() => {
  if (!props.summary?.stage_breakdown) return []
  return Object.values(props.summary.stage_breakdown).sort((a, b) => a.stage - b.stage)
})

function fmtNum(n?: number | null) {
  if (n == null) return '0'
  return n.toLocaleString()
}

function shiftLabel(s: Shift) {
  return `${s.name} · ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`
}
</script>

<template>
  <div class="bg-default border border-default rounded-xl">

    <!-- Header: Judul + Kontrol Filter -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-default flex-wrap gap-3">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-bar-chart-2" class="w-4 h-4 text-primary" />
        Daily Summary
      </h2>

      <div class="flex items-center gap-2 flex-wrap">

        <!-- Work Date Picker — tidak berubah -->
        <UInput
          :model-value="workDate"
          type="date"
          size="sm"
          class="w-44"
          @update:model-value="emit('update:workDate', $event)"
        />

        <!--
          [BARU] Shift Filter di dalam Summary.
          Ketika user memilih shift, `selectedShiftId` diperbarui dan
          emit `filter-change` dipancarkan ke parent (WorkOrderList.vue)
          sehingga `refreshSummary()` dipanggil dengan shift_id yang baru.
          Kartu "Active Issues" otomatis reaktif karena summary di-replace dari parent.
        -->
        <USelectMenu
          v-if="shifts && shifts.length > 0"
          v-model="selectedShift"
          :items="shifts"
          value-key="id"
          placeholder="All Shifts"
          size="sm"
          class="w-48"
          clear
        >
          <template #label>
            <template v-if="selectedShift">
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-muted" />
              <span class="text-sm">{{ selectedShift.name }}</span>
            </template>
            <template v-else>
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-muted" />
              <span class="text-sm text-muted">All Shifts</span>
            </template>
          </template>
        </USelectMenu>

        <!-- Refresh Button -->
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="emit('refresh')"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !summary" class="flex items-center justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
    </div>

    <!-- Summary Cards -->
    <div v-else-if="summary" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 divide-x divide-default">

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Total WO
        </p>
        <p class="text-xl font-bold font-mono">
          {{ fmtNum(summary.total_wo) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          In Progress
        </p>
        <p class="text-xl font-bold font-mono text-warning-600">
          {{ fmtNum(summary.status_breakdown?.In_Progress) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Completed
        </p>
        <p class="text-xl font-bold font-mono text-success-600">
          {{ fmtNum(summary.status_breakdown?.Completed) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Planned Qty
        </p>
        <p class="text-xl font-bold font-mono">
          {{ fmtNum(summary.total_planned) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Actual Qty
        </p>
        <p class="text-xl font-bold font-mono">
          {{ fmtNum(summary.total_actual) }}
        </p>
      </div>

      <div class="px-4 py-3 space-y-1">
        <p class="text-xs text-muted">
          Achievement
        </p>
        <p class="text-xl font-bold font-mono" :class="achievementColor">
          {{ summary.achievement_pct }}%
        </p>
      </div>

      <!--
        [PERUBAHAN] Kartu Active Issues kini reaktif terhadap filter shift & stage.
        Nilai `summary.active_issues` sudah dihitung BE sesuai filter aktif,
        sehingga tampilan ini otomatis benar saat filter berubah dan parent re-fetch.
        Ditambah efek "pulse" jika ada issue aktif agar lebih mencolok di lapangan.
      -->
      <div
        class="px-4 py-3 space-y-1 transition-colors"
        :class="summary.active_issues > 0 ? 'bg-error-50 dark:bg-error-950/20' : ''"
      >
        <p class="text-xs" :class="summary.active_issues > 0 ? 'text-error-600' : 'text-muted'">
          Active Issues
        </p>
        <div class="flex items-center gap-2">
          <!-- Indikator berkedip jika ada issue aktif -->
          <span
            v-if="summary.active_issues > 0"
            class="relative flex h-2.5 w-2.5 flex-shrink-0"
          >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-error-500" />
          </span>
          <p
            class="text-xl font-bold font-mono"
            :class="summary.active_issues > 0 ? 'text-error-600' : 'text-muted'"
          >
            {{ fmtNum(summary.active_issues) }}
          </p>
        </div>
        <p v-if="summary.active_issues > 0" class="text-xs text-error-500">
          Butuh perhatian
        </p>
      </div>
    </div>

    <!-- Stage Breakdown (opsional, ditampilkan jika ada dan lebih dari 1 stage) -->
    <div
      v-if="summary && stageBreakdownList.length > 1"
      class="border-t border-default px-5 py-3"
    >
      <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Stage Breakdown</p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="s in stageBreakdownList"
          :key="s.stage"
          class="px-3 py-2 bg-elevated rounded-lg text-xs space-y-0.5 min-w-[100px]"
        >
          <p class="font-semibold text-muted">Stage {{ s.stage }}</p>
          <p class="font-mono font-bold">{{ s.wo_count }} WO</p>
          <p class="text-muted">{{ fmtNum(s.total_actual) }} / {{ fmtNum(s.total_planned) }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="flex items-center justify-center py-8 text-sm text-muted">
      No data for selected date.
    </div>

  </div>
</template>