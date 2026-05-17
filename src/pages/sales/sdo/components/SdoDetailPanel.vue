<script setup lang="ts">
 
import { computed } from 'vue'
import { useSdoStore } from '../../../../stores/sales/sdo.store'
import type { Sdo } from '../../../../types/sales/sdo'

const props = defineProps<{
  sdo: Sdo | null
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  refresh: []
}>()

const store = useSdoStore()

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Sent vs Received discrepancy metrics
const metrics = computed(() => {
  if (!props.sdo?.details || props.sdo.details.length === 0) {
    return { totalSent: 0, totalReceived: 0, ratio: 0, shortages: 0 }
  }
  const totalSent = props.sdo.details.reduce((acc, curr) => acc + curr.sent_qty, 0)
  const totalReceived = props.sdo.details.reduce((acc, curr) => acc + (curr.received_qty ?? curr.sent_qty), 0)
  const shortages = totalSent - totalReceived
  const ratio = totalSent > 0 ? (totalReceived / totalSent) * 100 : 0
  return { totalSent, totalReceived, ratio, shortages }
})

function printSuratJalan() {
  if (!props.sdo) return
  store.downloadSdoPdf(props.sdo.id)
}

function simulateDriverView() {
  if (!props.sdo) return
  const width = 450
  const height = 800
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  
  window.open(
    `/sales/sdo/mobile/${props.sdo.id}`,
    `driver_portal_${props.sdo.id}`,
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  )
}
</script>

<template>
  <div class="h-full flex flex-col bg-elevated border-l border-default shadow-2xl relative overflow-hidden">
    <!-- Close Header -->
    <div class="p-4 border-b border-default shrink-0 flex items-center justify-between bg-elevated/40">
      <div class="flex items-center gap-2">
        <div class="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
          <UIcon name="i-lucide-scroll" class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-default">
            Delivery Order Details
          </h3>
          <p class="text-[10px] text-muted">
            Inspect dispatch parameters and POD proof attachments
          </p>
        </div>
      </div>
      
      <UButton
        icon="i-lucide-x"
        size="xs"
        variant="ghost"
        color="neutral"
        @click="emit('close')"
      />
    </div>

    <!-- Loading State -->
    <div v-if="props.loading" class="flex-1 flex items-center justify-center p-12 text-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- SDO Details Content -->
    <div v-else-if="props.sdo" class="flex-1 overflow-y-auto p-5 space-y-6">
      <!-- Primary Info Header -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
            {{ props.sdo.do_number }}
          </span>
          <UBadge
            :color="props.sdo.delivery_status === 'Delivered' ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
            class="rounded-full font-bold"
          >
            {{ props.sdo.delivery_status }}
          </UBadge>
        </div>
        <h2 class="text-base font-black text-default leading-tight">
          {{ props.sdo.customer?.name || '-' }}
        </h2>
        <p class="text-xs text-muted-foreground">
          Shipped: {{ formatDate(props.sdo.shipment_date) }}
        </p>
      </div>

      <!-- Logistics Driver & Fleet Allocations -->
      <div class="bg-default/40 border border-default rounded-xl p-4 space-y-3">
        <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <UIcon name="i-lucide-truck" class="w-4 h-4 text-sky-500" />
          Logistics Allocation
        </h4>
        
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-[10px] text-muted font-semibold block uppercase">Driver Name</span>
            <span class="font-bold text-default block mt-0.5">
              {{ props.sdo.driver?.full_name || 'Not Assigned' }}
            </span>
          </div>
          <div>
            <span class="text-[10px] text-muted font-semibold block uppercase">Vehicle Plate</span>
            <span class="font-bold text-default block mt-0.5">
              {{ props.sdo.vehicle?.license_plate || 'Not Assigned' }} ({{ props.sdo.vehicle?.type || '-' }})
            </span>
          </div>
        </div>
      </div>

      <!-- Shipment Items List table -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <UIcon name="i-lucide-package-check" class="w-4 h-4 text-emerald-500" />
          Dispatched Materials
        </h4>

        <div class="border border-default rounded-xl overflow-hidden bg-default/20">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-default/50 border-b border-default text-[10px] uppercase font-bold text-muted-foreground">
                <th class="px-3 py-2">
                  Part Info
                </th>
                <th class="px-3 py-2 text-right">
                  Sent
                </th>
                <th class="px-3 py-2 text-right">
                  Recv
                </th>
                <th class="px-3 py-2 text-right">
                  Short
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in props.sdo.details"
                :key="item.id"
                class="border-b border-default last:border-0 hover:bg-default/10"
              >
                <td class="px-3 py-2.5 font-medium text-default">
                  {{ item.part?.part_name }}
                  <span class="block text-[9px] font-mono text-muted-foreground mt-0.5">
                    {{ item.part?.part_number }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right font-mono text-default">
                  {{ item.sent_qty }}
                </td>
                <td class="px-3 py-2.5 text-right font-mono text-default">
                  {{ item.received_qty ?? item.sent_qty }}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono font-bold"
                  :class="(item.sent_qty - (item.received_qty ?? item.sent_qty)) > 0 ? 'text-rose-500' : 'text-emerald-500'"
                >
                  {{ item.sent_qty - (item.received_qty ?? item.sent_qty) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Discrepancy Progress Alert for Delivered items -->
      <div v-if="props.sdo.delivery_status === 'Delivered'" class="space-y-2 bg-default/40 border border-default rounded-xl p-4">
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold text-default">Fulfillment Accuracy</span>
          <span
            class="font-mono font-bold text-xs"
            :class="metrics.shortages > 0 ? 'text-rose-500' : 'text-emerald-500'"
          >
            {{ metrics.shortages > 0 ? `Shortage: ${metrics.shortages} pcs` : '100% Fulfilled' }}
          </span>
        </div>
        
        <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="metrics.shortages > 0 ? 'bg-rose-500' : 'bg-emerald-500'"
            :style="{ width: `${metrics.ratio}%` }"
          />
        </div>
      </div>

      <!-- Physical Proof of Delivery Signature image preview -->
      <div v-if="props.sdo.proof_of_delivery" class="space-y-2">
        <h4 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <UIcon name="i-lucide-camera" class="w-4 h-4 text-indigo-500" />
          Proof of Delivery Signature
        </h4>
        
        <div class="border border-default rounded-xl overflow-hidden bg-default/40 p-2 flex justify-center">
          <img
            :src="`http://localhost:5000/uploads/pod/${props.sdo.proof_of_delivery}`"
            alt="Proof of Delivery Attachment"
            class="max-h-48 object-contain rounded-lg shadow-sm hover:scale-105 transition-transform cursor-zoom-in"
          >
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 py-16">
      <UIcon name="i-lucide-file-search" class="w-12 h-12 mb-3 opacity-30" />
      <p class="text-sm">
        Select an SDO from the list to view its details
      </p>
    </div>

    <!-- Action Controls Footer -->
    <div v-if="props.sdo" class="p-4 border-t border-default shrink-0 bg-elevated/40 flex gap-3">
      <UButton
        size="sm"
        color="neutral"
        variant="subtle"
        icon="i-lucide-printer"
        label="Download Surat Jalan"
        class="flex-1 font-bold text-xs"
        @click="printSuratJalan"
      />
      <UButton
        size="sm"
        color="primary"
        variant="solid"
        icon="i-lucide-smartphone"
        label="Simulate POD"
        class="flex-1 font-bold text-xs"
        @click="simulateDriverView"
      />
    </div>
  </div>
</template>

<style scoped>
/* Scoped panel layout rules */
</style>
