<script setup lang="ts">
 
import { ref, computed, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useSdoStore } from '../../../../stores/sales/sdo.store'
import { useCustomerStore } from '../../../../stores/master-data/customer.store'
import { storeToRefs } from 'pinia'
import type { Sdo } from '../../../../types/sales/sdo'

const props = defineProps<{
  status: string
  search?: string
}>()

const emit = defineEmits<{
  (e: 'select', sdo: Sdo): void
}>()

const store = useSdoStore()
const customerStore = useCustomerStore()
const sentinel = ref<HTMLElement | null>(null)
const isFilterOpen = ref(false)

const { kanbanSdos, kanbanMeta, kanbanFilters } = storeToRefs(store)
const { customers } = storeToRefs(customerStore)

const items = computed(() => kanbanSdos.value[props.status] || [])
const meta = computed(() => kanbanMeta.value[props.status] || { page: 1, total: 0, totalPages: 0, loading: false })

const columnFilter = computed({
  get: () => kanbanFilters.value[props.status] || { customer_id: null, start_date: '', end_date: '' },
  set: (val) => { kanbanFilters.value[props.status] = val }
})

const customerFilterVal = computed({
  get: () => columnFilter.value.customer_id ?? undefined,
  set: (val) => {
    columnFilter.value = {
      ...columnFilter.value,
      customer_id: val ?? null
    }
  }
})

const hasActiveFilter = computed(() => !!columnFilter.value.customer_id || !!columnFilter.value.start_date || !!columnFilter.value.end_date)

function applyFilter() {
  store.kanbanMeta[props.status] = { page: 1, total: 0, totalPages: 0, loading: false }
  store.kanbanSdos[props.status] = []
  store.fetchKanbanByStatus(props.status, { search: props.search }, false)
}

function clearFilter() {
  columnFilter.value = { customer_id: null, start_date: '', end_date: '' }
  applyFilter()
}

// Intersection Observer for Infinite Scroll pagination
useIntersectionObserver(
  sentinel,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !meta.value.loading && items.value.length > 0) {
      if (meta.value.page < meta.value.totalPages) {
        store.fetchKanbanByStatus(props.status, { search: props.search }, true)
      }
    }
  },
  { threshold: 0.1 }
)

onMounted(() => {
  if (customers.value.length === 0) {
    customerStore.fetchCustomers({ limit: 100 })
  }
})

// Helper methods
function getStatusBulletClass(status: string) {
  return status === 'Delivered' ? 'bg-emerald-500' : 'bg-amber-500'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Calculation for Sent vs Received Qty metrics
function getFulfillmentMetrics(sdo: Sdo) {
  if (!sdo.details || sdo.details.length === 0) return { totalSent: 0, totalReceived: 0, ratio: 0, shortages: 0 }
  const totalSent = sdo.details.reduce((acc, curr) => acc + curr.sent_qty, 0)
  const totalReceived = sdo.details.reduce((acc, curr) => acc + (curr.received_qty ?? curr.sent_qty), 0)
  const shortages = totalSent - totalReceived
  const ratio = totalSent > 0 ? (totalReceived / totalSent) * 100 : 0
  return { totalSent, totalReceived, ratio, shortages }
}

function printSuratJalan(e: Event, id: number) {
  e.stopPropagation()
  store.downloadSdoPdf(id)
}

function simulateDriverView(e: Event, id: number) {
  e.stopPropagation()
  const width = 450
  const height = 800
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  
  window.open(
    `/sales/sdo/mobile/${id}`,
    `driver_portal_${id}`,
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  )
}
</script>

<template>
  <div class="flex flex-col w-80 bg-elevated/40 rounded-2xl border border-default/60 backdrop-blur-sm overflow-hidden h-full">
    <!-- Column Header -->
    <div class="p-4 border-b border-default flex items-center justify-between shrink-0 bg-elevated/20">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full animate-pulse" :class="getStatusBulletClass(props.status)" />
        <h3 class="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          {{ props.status }}
        </h3>
      </div>
      <div class="flex items-center gap-2">
        <UPopover v-model:open="isFilterOpen" :content="{ align: 'end', side: 'bottom' }">
          <template #default="{ open: popoverOpen }">
            <UButton
              icon="i-lucide-filter"
              size="sm"
              variant="ghost"
              :color="hasActiveFilter ? 'primary' : 'neutral'"
              :class="hasActiveFilter ? 'bg-primary/10' : ''"
              :trailing-icon="popoverOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            />
          </template>
          <template #content>
            <div class="p-4 space-y-4 w-64 bg-default border border-default rounded-xl shadow-xl z-50">
              <h4 class="font-bold text-sm">
                Filter {{ props.status }}
              </h4>
              
              <UFormField label="Customer" size="sm">
                <USelectMenu
                  v-model="customerFilterVal"
                  :items="customers"
                  value-key="id"
                  label-key="name"
                  placeholder="All Customers"
                  searchable
                  clearable
                />
              </UFormField>
              
              <UFormField label="Start Date" size="sm">
                <UInput v-model="columnFilter.start_date" type="date" />
              </UFormField>
              
              <UFormField label="End Date" size="sm">
                <UInput v-model="columnFilter.end_date" type="date" />
              </UFormField>

              <div class="flex justify-end gap-2 pt-2 border-t border-default/50">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  label="Clear"
                  @click="clearFilter(); isFilterOpen = false"
                />
                <UButton
                  size="xs"
                  color="primary"
                  label="Apply"
                  @click="applyFilter(); isFilterOpen = false"
                />
              </div>
            </div>
          </template>
        </UPopover>

        <span class="text-[10px] font-bold font-mono text-muted-foreground bg-default px-1.5 py-0.5 rounded border border-default">
          {{ meta.total }}
        </span>
      </div>
    </div>

    <!-- Column Content -->
    <div class="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
      <!-- Initial Loading Skeleton -->
      <div v-if="meta.loading && items.length === 0" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-36 bg-default/50 animate-pulse rounded-xl" />
      </div>

      <!-- Cards -->
      <template v-else>
        <div
          v-for="sdo in items"
          :key="sdo.id"
          class="group relative bg-default border border-default rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer ring-primary/20 hover:ring-2"
          @click="emit('select', sdo)"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-[9px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">{{ sdo.do_number }}</span>
            <UIcon name="i-lucide-arrow-up-right" class="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <h4 class="text-xs font-bold mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
            {{ sdo.customer?.name || '-' }}
          </h4>
          
          <!-- Dispatch details info -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-[10px] text-muted-foreground">
              <UIcon name="i-lucide-truck" class="w-3 h-3 text-sky-500 shrink-0" />
              <span class="font-medium truncate">
                {{ sdo.driver?.full_name || 'Driver Not Assigned' }} ({{ sdo.vehicle?.license_plate || 'No Plate' }})
              </span>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-muted-foreground">
              <UIcon name="i-lucide-calendar" class="w-3 h-3 text-indigo-500 shrink-0" />
              <span>Shipped: {{ formatDate(sdo.shipment_date) }}</span>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-muted-foreground">
              <UIcon name="i-lucide-package" class="w-3 h-3 text-emerald-500 shrink-0" />
              <span class="font-bold">{{ sdo.details?.length || 0 }} items dispatched</span>
            </div>
          </div>

          <!-- Dynamic discrepancy details progress bar for Delivered items -->
          <div v-if="props.status === 'Delivered'" class="mt-3 space-y-1">
            <div class="flex justify-between items-center text-[9px] font-semibold text-muted-foreground">
              <span>Fulfillment</span>
              <span :class="getFulfillmentMetrics(sdo).shortages > 0 ? 'text-rose-500' : 'text-emerald-500'">
                {{ getFulfillmentMetrics(sdo).shortages > 0 ? `Shortage: ${getFulfillmentMetrics(sdo).shortages} pcs` : '100% Completed' }}
              </span>
            </div>
            <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getFulfillmentMetrics(sdo).shortages > 0 ? 'bg-rose-500' : 'bg-emerald-500'"
                :style="{ width: `${getFulfillmentMetrics(sdo).ratio}%` }"
              />
            </div>
          </div>

          <!-- Printable & simulation controls -->
          <div class="mt-4 pt-3 border-t border-default/50 flex gap-2">
            <UButton
              size="xs"
              color="neutral"
              variant="subtle"
              icon="i-lucide-printer"
              label="Surat Jalan"
              class="flex-1 font-bold text-[9px]"
              @click="printSuratJalan($event, sdo.id)"
            />
            <UButton
              size="xs"
              color="primary"
              variant="subtle"
              icon="i-lucide-smartphone"
              label="Simulate POD"
              class="flex-1 font-bold text-[9px]"
              @click="simulateDriverView($event, sdo.id)"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="items.length === 0 && !meta.loading" class="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-16">
          <UIcon name="i-lucide-inbox" class="w-10 h-10 mb-3 opacity-20 animate-bounce" />
          <span class="text-[10px] font-bold uppercase tracking-widest">No Shipment Orders</span>
        </div>

        <!-- Sentinel for Infinite Scroll pagination -->
        <div ref="sentinel" class="h-10 w-full flex items-center justify-center">
          <UIcon v-if="meta.loading" name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary/50" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
