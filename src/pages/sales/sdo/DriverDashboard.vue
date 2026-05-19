<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import { useAuthStore } from '../../../stores/auth.store'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const sdoStore = useSdoStore()
const { sdos, loading } = storeToRefs(sdoStore)

const activeTab = ref<'transit' | 'delivered'>('transit')

onMounted(async () => {
  try {
    await sdoStore.fetchSdos({ limit: 100 })
  } catch (err) {
    console.error('Error fetching driver SDOs:', err)
  }
})

// Filter SDOs locally just in case
const transitSdos = computed(() => {
  return sdos.value.filter(sdo => sdo.delivery_status === 'In Transit')
})

const deliveredSdos = computed(() => {
  return sdos.value.filter(sdo => sdo.delivery_status === 'Delivered')
})

const driverEmail = computed(() => authStore.user?.email || 'Driver')
const driverName = computed(() => {
  // Try to find the full name in the active SDOs if available
  const found = sdos.value.find(s => s.driver?.full_name)
  return found?.driver?.full_name || driverEmail.value
})

async function handleLogout() {
  await authStore.logout()
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getSlaBadgeConfig(status?: string) {
  switch (status) {
    case 'Delayed':
      return { color: 'error' as const, icon: 'i-lucide-clock-alert', label: 'Delayed' }
    case 'Near Expiry':
      return { color: 'warning' as const, icon: 'i-lucide-alert-triangle', label: 'Near Expiry' }
    case 'On Time':
    default:
      return { color: 'success' as const, icon: 'i-lucide-check-circle', label: 'On Time' }
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans pb-10">
    <!-- Header with Profile Greeting & Logout -->
    <div class="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 p-5 sticky top-0 z-50 shadow-lg">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner text-lg">
            {{ driverName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="text-xs text-slate-400">Driver Portal</p>
            <h2 class="font-bold text-base text-white truncate max-w-[180px]">{{ driverName }}</h2>
          </div>
        </div>
        <UButton
          icon="i-lucide-log-out"
          size="sm"
          color="error"
          variant="ghost"
          label="Logout"
          class="font-semibold text-slate-300 hover:text-white"
          @click="handleLogout"
        />
      </div>
    </div>

    <!-- Stats & Welcome Grid -->
    <div class="p-4 space-y-4">
      <div class="bg-gradient-to-r from-slate-800 to-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🚚</span>
          <div>
            <h3 class="font-bold text-lg text-white">Delivery Summary</h3>
            <p class="text-xs text-slate-400">Track and confirm your assigned shipments</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active</span>
            <span class="text-2xl font-black mt-1 text-amber-500">{{ transitSdos.length }} SDO</span>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
            <span class="text-2xl font-black mt-1 text-emerald-500">{{ deliveredSdos.length }} SDO</span>
          </div>
        </div>
      </div>

      <!-- Tab Selectors -->
      <div class="flex border border-slate-700/50 rounded-xl p-1 bg-slate-800/60">
        <button
          class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          :class="activeTab === 'transit' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          @click="activeTab = 'transit'"
        >
          <UIcon name="i-lucide-truck" class="w-4 h-4" />
          Active ({{ transitSdos.length }})
        </button>
        <button
          class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          :class="activeTab === 'delivered' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          @click="activeTab = 'delivered'"
        >
          <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
          Completed ({{ deliveredSdos.length }})
        </button>
      </div>

      <!-- SDO List Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 text-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        <span class="text-xs text-slate-400">Loading your deliveries...</span>
      </div>

      <!-- Empty States -->
      <div v-else-if="activeTab === 'transit' && transitSdos.length === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center gap-3 bg-slate-800/20 border border-dashed border-slate-700/30 rounded-2xl">
        <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
          <UIcon name="i-lucide-clipboard-list" class="w-8 h-8" />
        </div>
        <div>
          <h4 class="font-bold text-white text-base">No Active Deliveries</h4>
          <p class="text-xs text-slate-400 max-w-[240px] mt-1">You don't have any active "In Transit" orders assigned to you right now.</p>
        </div>
      </div>

      <div v-else-if="activeTab === 'delivered' && deliveredSdos.length === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center gap-3 bg-slate-800/20 border border-dashed border-slate-700/30 rounded-2xl">
        <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
          <UIcon name="i-lucide-history" class="w-8 h-8" />
        </div>
        <div>
          <h4 class="font-bold text-white text-base">No Completed Deliveries</h4>
          <p class="text-xs text-slate-400 max-w-[240px] mt-1">You haven't completed any SDO deliveries yet.</p>
        </div>
      </div>

      <!-- SDO Items -->
      <div v-else class="space-y-4">
        <div
          v-for="sdo in (activeTab === 'transit' ? transitSdos : deliveredSdos)"
          :key="sdo.id"
          class="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 shadow-sm hover:border-slate-600/50 transition-colors space-y-3"
        >
          <!-- DO number & Status -->
          <div class="flex justify-between items-start border-b border-slate-700/40 pb-2">
            <div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DO Number</p>
              <h4 class="font-mono font-black text-xs text-primary mt-0.5">{{ sdo.do_number }}</h4>
            </div>
            <div class="flex flex-col items-end gap-1">
              <UBadge
                :color="activeTab === 'transit' ? 'warning' : 'success'"
                variant="subtle"
                size="xs"
                class="rounded-full font-bold"
              >
                {{ sdo.delivery_status }}
              </UBadge>
              <UBadge
                v-if="activeTab === 'transit'"
                :color="getSlaBadgeConfig(sdo.sla_status).color"
                variant="subtle"
                size="xs"
                class="rounded-full font-bold text-[10px]"
              >
                <UIcon :name="getSlaBadgeConfig(sdo.sla_status).icon" class="mr-1 w-3 h-3" />
                {{ getSlaBadgeConfig(sdo.sla_status).label }}
              </UBadge>
            </div>
          </div>

          <!-- Customer details -->
          <div class="space-y-2 text-xs">
            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-user" class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] text-slate-400">Customer</p>
                <p class="font-bold text-white">{{ sdo.customer?.name || '-' }}</p>
              </div>
            </div>

            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] text-slate-400">Destination</p>
                <p class="font-semibold text-slate-300 leading-normal">{{ sdo.deliveryPlan?.destination || 'See details' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p class="text-[10px] text-slate-400">Shipment Date</p>
                <p class="font-semibold text-slate-300">{{ formatDate(sdo.shipment_date) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400">Plate Number</p>
                <p class="font-mono font-semibold text-slate-300">{{ sdo.vehicle?.license_plate || '-' }}</p>
              </div>
            </div>
          </div>

          <!-- Action block -->
          <div class="flex gap-2 pt-2 border-t border-slate-700/40">
            <!-- Navigation OSM Link -->
            <a
              v-if="sdo.deliveryPlan?.destination"
              :href="`https://www.openstreetmap.org/search?query=${encodeURIComponent(sdo.deliveryPlan.destination)}`"
              target="_blank"
              class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-600/30 text-center"
            >
              <UIcon name="i-lucide-navigation" class="w-4 h-4 text-blue-400" />
              Navigate
            </a>

            <!-- Confirm / View details -->
            <button
              v-if="activeTab === 'transit'"
              class="flex-1 bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg"
              @click="router.push(`/sales/sdo/mobile/${sdo.id}`)"
            >
              <UIcon name="i-lucide-file-check" class="w-4 h-4" />
              Confirm POD
            </button>
            <button
              v-else
              class="flex-1 bg-slate-750 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700/50"
              @click="router.push(`/sales/sdo/mobile/${sdo.id}`)"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4" />
              View Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
