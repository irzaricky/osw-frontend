<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSdoStore } from '../../../stores/sales/sdo.store'
import { useAuthStore } from '../../../stores/auth.store'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const sdoStore = useSdoStore()
const { sdos, loading, meta } = storeToRefs(sdoStore)

const activeTab = ref<'transit' | 'delivered'>('transit')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const activeCount = ref(0)
const completedCount = ref(0)

async function fetchDriverSdos() {
  try {
    const status = activeTab.value === 'transit' ? 'In Transit' : 'Delivered'
    await sdoStore.fetchSdos({
      page: currentPage.value,
      limit: itemsPerPage.value,
      delivery_status: status
    })
    if (activeTab.value === 'transit') {
      activeCount.value = meta.value.total
    } else {
      completedCount.value = meta.value.total
    }
  } catch (err) {
    console.error('Error fetching driver SDOs:', err)
  }
}

async function fetchCounts() {
  try {
    await sdoStore.fetchSdos({ limit: 1, delivery_status: 'In Transit' })
    activeCount.value = sdoStore.meta.total

    await sdoStore.fetchSdos({ limit: 1, delivery_status: 'Delivered' })
    completedCount.value = sdoStore.meta.total
  } catch (err) {
    console.error('Error fetching driver SDO counts:', err)
  }
}

watch(activeTab, () => {
  currentPage.value = 1
  fetchDriverSdos()
})

watch(currentPage, () => {
  fetchDriverSdos()
})

onMounted(async () => {
  await fetchCounts()
  await fetchDriverSdos()
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
  <div class="flex flex-col min-h-screen bg-default/10 text-default font-sans pb-10">
    <!-- Header with Profile Greeting & Logout -->
    <div class="bg-elevated/80 backdrop-blur-md border-b border-default p-5 sticky top-0 z-50 shadow-lg">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner text-lg">
            {{ driverName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="text-xs text-muted-foreground">
              Driver Portal
            </p>
            <h2 class="font-bold text-base text-default truncate max-w-[180px]">
              {{ driverName }}
            </h2>
          </div>
        </div>
        <UButton
          icon="i-lucide-log-out"
          size="sm"
          color="error"
          variant="ghost"
          label="Logout"
          class="font-semibold text-muted-foreground hover:text-default"
          @click="handleLogout"
        />
      </div>
    </div>

    <!-- Stats & Welcome Grid -->
    <div class="p-4 space-y-4">
      <div class="bg-elevated border border-default rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">🚚</span>
          <div>
            <h3 class="font-bold text-lg text-default">
              Delivery Summary
            </h3>
            <p class="text-xs text-muted-foreground">
              Track and confirm your assigned shipments
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="bg-default/20 p-3 rounded-xl border border-default flex flex-col justify-between">
            <span class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active</span>
            <span class="text-2xl font-black mt-1 text-amber-500">{{ activeCount }} SDO</span>
          </div>
          <div class="bg-default/20 p-3 rounded-xl border border-default flex flex-col justify-between">
            <span class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Completed</span>
            <span class="text-2xl font-black mt-1 text-emerald-500">{{ completedCount }} SDO</span>
          </div>
        </div>
      </div>

      <!-- Tab Selectors -->
      <div class="flex border border-default rounded-xl p-1 bg-default/40">
        <button
          class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'transit' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-default'"
          @click="activeTab = 'transit'"
        >
          <UIcon name="i-lucide-truck" class="w-4 h-4" />
          Active ({{ activeCount }})
        </button>
        <button
          class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'delivered' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-default'"
          @click="activeTab = 'delivered'"
        >
          <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
          Completed ({{ completedCount }})
        </button>
      </div>

      <!-- SDO List Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 text-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        <span class="text-xs text-muted-foreground">Loading your deliveries...</span>
      </div>

      <!-- Empty States -->
      <div v-else-if="activeTab === 'transit' && activeCount === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center gap-3 bg-default/10 border border-dashed border-default rounded-2xl">
        <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted-foreground">
          <UIcon name="i-lucide-clipboard-list" class="w-8 h-8" />
        </div>
        <div>
          <h4 class="font-bold text-default text-base">
            No Active Deliveries
          </h4>
          <p class="text-xs text-muted-foreground max-w-[240px] mt-1">
            You don't have any active "In Transit" orders assigned to you right now.
          </p>
        </div>
      </div>

      <div v-else-if="activeTab === 'delivered' && completedCount === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center gap-3 bg-default/10 border border-dashed border-default rounded-2xl">
        <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted-foreground">
          <UIcon name="i-lucide-history" class="w-8 h-8" />
        </div>
        <div>
          <h4 class="font-bold text-default text-base">
            No Completed Deliveries
          </h4>
          <p class="text-xs text-muted-foreground max-w-[240px] mt-1">
            You haven't completed any SDO deliveries yet.
          </p>
        </div>
      </div>

      <!-- SDO Items -->
      <div v-else class="space-y-4">
        <div
          v-for="sdo in sdos"
          :key="sdo.id"
          class="bg-elevated border border-default rounded-2xl p-4 shadow-sm hover:border-default/80 transition-colors space-y-3"
        >
          <!-- DO number & Status -->
          <div class="flex justify-between items-start border-b border-default pb-2">
            <div>
              <p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                DO Number
              </p>
              <h4 class="font-mono font-black text-xs text-primary mt-0.5">
                {{ sdo.do_number }}
              </h4>
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
              <UIcon name="i-lucide-user" class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] text-muted-foreground">
                  Customer
                </p>
                <p class="font-bold text-default">
                  {{ sdo.customer?.name || '-' }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p class="text-[10px] text-muted-foreground">
                  Destination
                </p>
                <p class="font-semibold text-default leading-normal">
                  {{ sdo.deliveryPlan?.destination || 'See details' }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p class="text-[10px] text-muted-foreground">
                  Shipment Date
                </p>
                <p class="font-semibold text-default">
                  {{ formatDate(sdo.shipment_date) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] text-muted-foreground">
                  Plate Number
                </p>
                <p class="font-mono font-semibold text-default">
                  {{ sdo.vehicle?.license_plate || '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action block -->
          <div class="flex gap-2 pt-2 border-t border-default">
            <!-- Navigation OSM Link -->
            <a
              v-if="sdo.deliveryPlan?.destination"
              :href="`https://www.openstreetmap.org/search?query=${encodeURIComponent(sdo.deliveryPlan.destination)}`"
              target="_blank"
              class="flex-1 bg-default/45 hover:bg-default/70 text-default font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-default text-center"
            >
              <UIcon name="i-lucide-navigation" class="w-4 h-4 text-blue-400" />
              Navigate
            </a>

            <!-- Confirm / View details -->
            <button
              v-if="activeTab === 'transit'"
              class="flex-1 bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
              @click="router.push(`/sales/sdo/mobile/${sdo.id}`)"
            >
              <UIcon name="i-lucide-file-check" class="w-4 h-4" />
              See details
            </button>
            <button
              v-else
              class="flex-1 bg-default/20 hover:bg-default/30 text-default font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-default cursor-pointer"
              @click="router.push(`/sales/sdo/mobile/${sdo.id}`)"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4" />
              View Detail
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="meta.totalPages > 1" class="flex justify-center pt-4">
          <UPagination
            v-model:page="currentPage"
            :total="meta.total"
            :items-per-page="itemsPerPage"
            :max="5"
            size="sm"
            class="font-semibold"
          />
        </div>
      </div>
    </div>
  </div>
</template>
