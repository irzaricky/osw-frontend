<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LineCapacityParamsResponse } from '../../../../types/master-data/line-capacity'

const props = defineProps<{
  params: LineCapacityParamsResponse | undefined
  calculating?: boolean
}>()

const emit = defineEmits<{
  (e: 'calculate', efficiencyFactor: number): void
}>()

const efficiencyFactor = ref<number>(
  props.params?.saved_params?.default_efficiency_factor ?? 0.85
)

watch(
  () => props.params?.saved_params?.default_efficiency_factor,
  (val) => { if (val != null) efficiencyFactor.value = val }
)

function formatSeconds(seconds: number): string {
  if (!seconds && seconds !== 0) return '-'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// Definisi eksplisit — label rapi + skip id & last_updated_at
const savedParamFields: {
  key: keyof NonNullable<LineCapacityParamsResponse['saved_params']>
  label: string
  unit?: string
  highlight?: boolean
}[] = [
  { key: 'default_working_days',            label: 'Working Days',      unit: 'days'  },
  { key: 'default_shifts_per_day',          label: 'Shifts / Day',      unit: 'shift' },
  { key: 'default_working_hours_per_shift', label: 'Hours / Shift',     unit: 'hrs'   },
  { key: 'default_manpower',                label: 'Manpower',          unit: 'pax'   },
  { key: 'default_efficiency_factor',       label: 'Efficiency',        highlight: true },
  { key: 'default_overtime_hours',          label: 'Overtime',          unit: 'hrs'   },
  { key: 'default_max_takt_time',           label: 'Max Takt Time',     unit: 's'     },
]

function formatSavedValue(
  key: keyof NonNullable<LineCapacityParamsResponse['saved_params']>,
  value: any
): string {
  if (value == null) return '-'
  if (key === 'default_efficiency_factor')
    return `${(Number(value) * 100).toFixed(0)}%`
  if (key === 'default_max_takt_time')
    return formatSeconds(Number(value))
  return String(value)
}
</script>

<template>
  <div class="px-10 p-4 bg-elevated space-y-5">
    <!-- ── Calculate Form ──────────────────────────────────────────── -->
    <div class="flex items-end gap-4 p-4 bg-default border border-default rounded-lg">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-muted uppercase tracking-widest">
          Efficiency Factor
        </label>
        <div class="flex items-center gap-2">
          <UInput
            v-model.number="efficiencyFactor"
            type="number"
            min="0.1"
            max="1"
            step="0.01"
            class="w-28 font-mono"
          />
          <span class="text-sm text-muted">
            ({{ (efficiencyFactor * 100).toFixed(0) }}%)
          </span>
        </div>
        <p class="text-[11px] text-muted mt-0.5">
          Working days, shifts & hours are derived from shift calendar.
        </p>
      </div>
      <UButton
        :label="params?.saved_params ? 'Recalculate' : 'Calculate'"
        icon="i-lucide-play"
        color="primary"
        :loading="calculating"
        :disabled="efficiencyFactor < 0.1 || efficiencyFactor > 1"
        @click="emit('calculate', efficiencyFactor)"
      />
    </div>

    <template v-if="params">
      <!-- ── Saved Params ───────────────────────────────────────────── -->
      <div v-if="params.saved_params">
        <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          Saved Parameters
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <div
            v-for="field in savedParamFields"
            :key="field.key"
            class="rounded-md px-3 py-2 border border-default bg-default flex flex-col gap-1 min-w-0"
            :class="field.highlight ? 'border-primary/50 bg-primary/5' : ''"
          >
            <p class="text-[11px] text-muted leading-tight truncate">
              {{ field.label }}
            </p>
            <p class="text-sm font-semibold text-highlighted truncate font-mono">
              {{ formatSavedValue(field.key, params.saved_params![field.key]) }}
              <span
                v-if="field.unit && field.key !== 'default_max_takt_time' && field.key !== 'default_efficiency_factor'"
                class="text-[11px] font-normal text-muted"
              >
                {{ field.unit }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- ── Calendar Params ────────────────────────────────────────── -->
      <div v-if="params.calendar_params">
        <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          Derived from Shift Calendar
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Working Days
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.calendar_params.working_days }}
              <span class="text-[11px] font-normal text-muted">days</span>
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Shifts / Day
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.calendar_params.shifts_per_day }}
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Hours / Shift
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.calendar_params.working_hours_per_shift }}
              <span class="text-[11px] font-normal text-muted">hrs</span>
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Overtime
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.calendar_params.overtime_hours }}
              <span class="text-[11px] font-normal text-muted">
                hrs / {{ params.calendar_params.total_overtime_days }} days
              </span>
            </p>
          </div>
        </div>
        <p class="text-[11px] text-muted">
          Period: {{ params.calendar_params.date_range?.start }} –
          {{ params.calendar_params.date_range?.end }}
        </p>
      </div>

      <!-- ── Actual Line Condition ──────────────────────────────────── -->
      <div v-if="params.actual">
        <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          Actual Line Condition
        </p>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Active Stations
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.actual.total_active_stations ?? '-' }}
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Active Jobs
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.actual.total_active_jobs ?? '-' }}
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Max Takt Time
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ formatSeconds(params.actual.max_takt_time_seconds) }}
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Operators
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.actual.default_manpower ?? '-' }}
              <span class="text-[11px] font-normal text-muted">pax</span>
            </p>
          </div>
          <div class="bg-default rounded-md px-3 py-2 border border-default">
            <p class="text-[11px] text-muted mb-0.5">
              Total Members
            </p>
            <p class="text-sm font-semibold font-mono text-highlighted">
              {{ params.actual.total_all_members ?? '-' }}
              <span class="text-[11px] font-normal text-muted">pax</span>
            </p>
          </div>
        </div>

        <!-- Bottleneck -->
        <div
          v-if="params.actual.bottleneck_station"
          class="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-md px-3 py-2 mb-3 w-fit max-w-full"
        >
          <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5 shrink-0 w-4 h-4" />
          <div class="min-w-0">
            <p class="text-[11px] text-muted mb-0.5">
              Bottleneck Station
            </p>
            <p class="text-sm font-semibold text-highlighted truncate">
              {{ params.actual.bottleneck_station.station_code }} —
              {{ params.actual.bottleneck_station.name }}
              <span class="text-muted font-normal ml-1 whitespace-nowrap">
                ({{ formatSeconds(params.actual.bottleneck_station.takt_time_seconds) }},
                {{ params.actual.bottleneck_station.total_jobs }} jobs)
              </span>
            </p>
          </div>
        </div>

        <!-- Stations table -->
        <div v-if="params.actual.stations?.length" class="mb-3">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
            Stations
          </p>
          <div class="rounded-md border border-default overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-elevated border-b border-default">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-muted w-12">
                    Seq
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-muted w-28">
                    Code
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-muted">
                    Name
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-muted w-16">
                    Jobs
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-muted w-24">
                    Takt Time
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="station in params.actual.stations"
                  :key="station.station_id"
                  class="border-t border-default hover:bg-elevated/60 transition-colors"
                  :class="{
                    'bg-warning/5': params.actual.bottleneck_station?.station_id === station.station_id
                  }"
                >
                  <td class="px-3 py-2 text-muted">
                    {{ station.sequence }}
                  </td>
                  <td class="px-3 py-2 font-medium font-mono">
                    {{ station.station_code }}
                  </td>
                  <td class="px-3 py-2 text-muted truncate max-w-[200px]">
                    {{ station.name }}
                  </td>
                  <td class="px-3 py-2 text-right text-muted">
                    {{ station.total_jobs }}
                  </td>
                  <td class="px-3 py-2 text-right">
                    <span
                      class="font-medium font-mono"
                      :class="params.actual.bottleneck_station?.station_id === station.station_id
                        ? 'text-warning' : 'text-highlighted'"
                    >
                      {{ formatSeconds(station.takt_time_seconds) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Employee Groups -->
        <div v-if="params.actual.groups?.length">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
            Employee Groups
          </p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="group in params.actual.groups"
              :key="group.group_id"
              class="bg-default rounded-md px-3 py-2 border border-default text-sm min-w-0"
            >
              <p class="font-medium text-highlighted truncate">
                {{ group.group_name }}
              </p>
              <p class="text-[11px] text-muted mt-0.5 whitespace-nowrap">
                {{ group.total_operators }} operators / {{ group.total_members }} members
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Belum ada params sama sekali -->
    <p v-else class="text-sm text-muted">
      No capacity data yet. Set efficiency factor and click Calculate.
    </p>
  </div>
</template>