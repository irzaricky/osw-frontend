<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'

const route = useRoute()
const store = useSdoStore()
const { loading, detail } = storeToRefs(store)

const sdoId = ref(route.params.id)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'SDO' },
  { label: 'Driver Mobile Portal' }
]

onMounted(async () => {
  if (sdoId.value) {
    try {
      await store.fetchSdoById(sdoId.value as string)
    } catch (e) {
      console.error('Failed to load SDO on mobile view:', e)
    }
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-900 text-gray-100 font-sans">
    <!-- Mobile Header -->
    <div class="bg-slate-950 px-4 py-3 border-b border-slate-800 sticky top-0 z-20 flex items-center gap-3">
      <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
        <UIcon name="i-lucide-smartphone" class="w-5 h-5" />
      </div>
      <div>
        <h1 class="font-bold text-sm text-gray-100">
          Driver Mobile Portal
        </h1>
        <p class="text-[10px] text-slate-500">
          Real-time Delivery Dispatch & Proof of Delivery
        </p>
      </div>
      <UBadge
        color="success"
        variant="subtle"
        size="xs"
        class="ml-auto"
      >
        Responsive Shell
      </UBadge>
    </div>

    <!-- Main Container -->
    <div class="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
      <Breadcrumbs :items="breadcrumbItems" class="text-xs text-slate-400 mb-2" />

      <!-- SDO Status Card -->
      <div class="bg-slate-950 rounded-2xl p-5 border border-slate-850 shadow-lg space-y-4 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
        
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[10px] uppercase font-mono tracking-wider text-slate-500">Delivery order</span>
            <h2 class="text-lg font-bold text-gray-200 mt-0.5">
              {{ detail?.do_number || `SDO ID #${sdoId}` }}
            </h2>
          </div>
          <UBadge
            :color="detail?.delivery_status === 'Delivered' ? 'success' : 'warning'"
            variant="solid"
            size="xs"
            class="rounded-full px-2.5"
          >
            {{ detail?.delivery_status || 'In Transit' }}
          </UBadge>
        </div>

        <hr class="border-slate-850">

        <!-- Mock details -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p class="text-slate-500">
              Destination
            </p>
            <p class="font-medium text-gray-300 mt-0.5 truncate">
              {{ detail?.deliveryPlan?.destination || 'Pending Logistics Routing' }}
            </p>
          </div>
          <div>
            <p class="text-slate-500">
              Shipment Date
            </p>
            <p class="font-medium text-gray-300 mt-0.5">
              {{ detail?.shipment_date || 'Today' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Mobile Driver Warning / Instruction -->
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs text-amber-300">
        <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 shrink-0" />
        <div>
          <h4 class="font-bold">
            Driver Action Required
          </h4>
          <p class="mt-0.5 text-amber-400/90 leading-relaxed">
            Please verify quantities delivered with the customer representative. Record any partial delivery shortages and upload clear POD receipts.
          </p>
        </div>
      </div>

      <!-- Detail list mockup -->
      <div class="bg-slate-950 rounded-2xl p-4 border border-slate-850 shadow-lg space-y-3">
        <h3 class="font-bold text-xs uppercase tracking-wider text-slate-400 px-1">
          Fulfillment Items
        </h3>

        <div v-if="loading" class="py-6 text-center text-slate-500 text-xs">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
          Loading shipment items...
        </div>

        <div v-else-if="detail?.details && detail.details.length > 0" class="space-y-2">
          <div
            v-for="item in detail.details"
            :key="item.id"
            class="bg-slate-900/50 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-semibold text-gray-200">
                {{ item.planDetail?.spoDetail?.part?.part_name || 'Part' }}
              </p>
              <p class="text-[10px] text-slate-500">
                Part No: {{ item.planDetail?.spoDetail?.part?.part_number || 'N/A' }}
              </p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono text-emerald-400 font-bold">{{ item.sent_qty }} Qty</span>
              <p class="text-[10px] text-slate-500">
                Scheduled sent
              </p>
            </div>
          </div>
        </div>

        <div v-else class="py-6 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
          No items found under this shipment reference
        </div>
      </div>
    </div>
  </div>
</template>
