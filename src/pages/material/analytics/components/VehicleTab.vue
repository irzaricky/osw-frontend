<script setup lang="ts">
import type { MdoVehiclePerformance } from '../../../../types/material/analytics'

defineProps<{
  vehicles: MdoVehiclePerformance[]
  loading: boolean
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-base">
            Vehicle Performance
          </h3>
          <p class="text-xs text-muted">
            Ranking kendaraan berdasarkan jumlah trip MDO pada rentang ini
          </p>
        </div>
        <UIcon name="i-lucide-truck" class="w-5 h-5 text-primary" />
      </div>
    </template>

    <div v-if="loading && !vehicles.length" class="h-[250px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!vehicles.length" class="h-[250px] flex items-center justify-center text-muted text-sm">
      Tidak ada data kendaraan pada rentang ini
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-default text-xs text-muted font-medium">
            <th class="py-3 px-4 w-20">
              Rank
            </th>
            <th class="py-3 px-4">
              Plate Number
            </th>
            <th class="py-3 px-4 text-right">
              Trip Count
            </th>
            <th class="py-3 px-4 text-right w-44">
              Total Weight
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="(vehicle, index) in vehicles"
            :key="vehicle.vehicle_id"
            class="text-sm transition-colors hover:bg-default/20"
          >
            <td class="py-3 px-4">
              <span
                v-if="index === 0"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold"
              >
                1
              </span>
              <span
                v-else-if="index === 1"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 text-xs font-bold"
              >
                2
              </span>
              <span
                v-else-if="index === 2"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/20 text-amber-500 text-xs font-bold"
              >
                3
              </span>
              <span v-else class="text-muted pl-2">{{ index + 1 }}</span>
            </td>
            <td class="py-3 px-4 font-medium">
              {{ vehicle.plate_number || '-' }}
            </td>
            <td class="py-3 px-4 text-right font-semibold">
              {{ vehicle.trip_count }} trip
            </td>
            <td class="py-3 px-4 text-right">
              {{ vehicle.total_weight_kg.toLocaleString() }} kg
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>