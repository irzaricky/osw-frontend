<script setup lang="ts">
import type { DriverPerformanceItem } from '../../../../stores/sales/analytics.store'

defineProps<{
  drivers: DriverPerformanceItem[]
  loading: boolean
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-base">
            Performa Pengemudi
          </h3>
          <p class="text-xs text-muted">
            Peringkat pengemudi berdasarkan jumlah SDO diselesaikan (status Delivered)
          </p>
        </div>
        <UIcon name="i-lucide-trophy" class="w-5 h-5 text-yellow-500 animate-pulse" />
      </div>
    </template>

    <div v-if="loading && !drivers.length" class="h-[250px] flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>
    
    <div v-else-if="!drivers.length" class="h-[250px] flex items-center justify-center text-muted text-sm">
      Tidak ada data performa pengemudi dalam periode ini
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-default text-xs text-muted font-medium">
            <th class="py-3 px-4 w-20">Rank</th>
            <th class="py-3 px-4">Nama Pengemudi</th>
            <th class="py-3 px-4 text-right w-40">SDO Selesai</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr 
            v-for="(driver, index) in drivers" 
            :key="driver.driver_name"
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
            <td class="py-3 px-4 font-medium text-black">
              {{ driver.driver_name }}
            </td>
            <td class="py-3 px-4 text-right font-semibold text-black">
              {{ driver.completed_sdos }} SDO
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
