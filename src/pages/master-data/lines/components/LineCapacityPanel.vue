<script setup lang="ts">
import type { LineCapacityParamsResponse } from '../../../../types/master-data/line-capacity'

const props = defineProps<{
  params: LineCapacityParamsResponse | undefined
}>()

// Format detik → "Xm Ys" atau langsung detik
function formatSeconds(seconds: number): string {
  if (!seconds && seconds !== 0) return '-'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <div v-if="params" class="px-10 p-4 bg-elevated space-y-5">

    <!-- ── Saved Params ─────────────────────────────────────────────── -->
    <div v-if="params.saved_params">
      <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
        Saved Parameters
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <div
          v-for="(value, key) in params.saved_params"
          :key="key"
          class="bg-default rounded-md px-3 py-2 border border-default"
        >
          <p class="text-[11px] text-muted mb-0.5 leading-snug">{{ formatLabel(String(key)) }}</p>
          <p class="text-sm font-semibold text-highlighted">{{ value ?? '-' }}</p>
        </div>
      </div>
    </div>

    <!-- ── Actual Summary (dari _getLineSummary) ────────────────────── -->
    <div v-if="params.actual">
      <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
        Actual Line Condition
      </p>

      <!-- Top-level metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Active Stations</p>
          <p class="text-sm font-semibold text-highlighted">
            {{ params.actual.total_active_stations ?? '-' }}
          </p>
        </div>
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Active Jobs</p>
          <p class="text-sm font-semibold text-highlighted">
            {{ params.actual.total_active_jobs ?? '-' }}
          </p>
        </div>
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Max Takt Time</p>
          <p class="text-sm font-semibold text-highlighted">
            {{ params.actual.max_takt_time_seconds }}s
          </p>
        </div>
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Operators</p>
          <p class="text-sm font-semibold text-highlighted">
            {{ params.actual.default_manpower ?? '-' }}
          </p>
        </div>
        <div class="bg-default rounded-md px-3 py-2 border border-default">
          <p class="text-[11px] text-muted mb-0.5">Total Members</p>
          <p class="text-sm font-semibold text-highlighted">
            {{ params.actual.total_all_members ?? '-' }}
          </p>
        </div>
      </div>

      <!-- Bottleneck station -->
      <div
        v-if="params.actual.bottleneck_station"
        class="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-md px-3 py-2 mb-3 w-fit"
      >
        <UIcon name="i-lucide-alert-triangle" class="text-warning mt-0.5 shrink-0 w-4 h-4" />
        <div>
          <p class="text-[11px] text-muted mb-0.5">Bottleneck Station</p>
          <p class="text-sm font-semibold text-highlighted">
            {{ params.actual.bottleneck_station.station_code }} — {{ params.actual.bottleneck_station.name }}
            <span class="text-muted font-normal ml-1">
              ({{ params.actual.bottleneck_station.takt_time_seconds }}s,
              {{ params.actual.bottleneck_station.total_jobs }} jobs)
            </span>
          </p>
        </div>
      </div>

      <!-- Stations table -->
      <div v-if="params.actual.stations?.length" class="mb-3">
        <p class="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">Stations</p>
        <div class="rounded-md border border-default overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-elevated border-b border-default">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-muted">Seq</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-muted">Code</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-muted">Name</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-muted">Jobs</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-muted">Takt Time</th>
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
                <td class="px-3 py-2 text-muted">{{ station.sequence }}</td>
                <td class="px-3 py-2 font-medium">{{ station.station_code }}</td>
                <td class="px-3 py-2 text-muted max-w-[200px] truncate">{{ station.name }}</td>
                <td class="px-3 py-2 text-right text-muted">{{ station.total_jobs }}</td>
                <td class="px-3 py-2 text-right">
                  <span
                    class="font-medium"
                    :class="params.actual.bottleneck_station?.station_id === station.station_id
                      ? 'text-warning'
                      : 'text-highlighted'"
                  >
                    {{ station.takt_time_seconds }}s
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Employee Groups -->
      <div v-if="params.actual.groups?.length">
        <p class="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">Employee Groups</p>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="group in params.actual.groups"
            :key="group.group_id"
            class="bg-default rounded-md px-3 py-2 border border-default text-sm"
          >
            <p class="font-medium text-highlighted">{{ group.group_name }}</p>
            <p class="text-[11px] text-muted mt-0.5">
              {{ group.total_operators }} operators / {{ group.total_members }} members
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Fallback — seharusnya tidak muncul karena expand hanya aktif jika ada params -->
  <div v-else class="px-10 py-4 text-sm text-muted">
    No capacity data available.
  </div>
</template>