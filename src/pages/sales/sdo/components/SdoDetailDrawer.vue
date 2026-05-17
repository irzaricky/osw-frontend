<script setup lang="ts">
 
import { ref, computed, watch } from 'vue'
import { useSdoStore } from '../../../../stores/sales/sdo.store'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  sdoId: number | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const store = useSdoStore()
const { detail, loading } = storeToRefs(store)

const loadingDetail = ref(false)

async function loadDetail() {
  if (!props.sdoId) return
  loadingDetail.value = true
  try {
    await store.fetchSdoById(props.sdoId)
  } catch (e) {
    console.error('Failed to load SDO details:', e)
  } finally {
    loadingDetail.value = false
  }
}

watch(
  () => props.sdoId,
  () => {
    if (props.open && props.sdoId) {
      loadDetail()
    }
  },
  { immediate: true }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.sdoId) {
      loadDetail()
    }
  }
)

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Compute backend POD absolute url safely
const podAbsoluteUrl = computed(() => {
  if (!detail.value?.proof_of_delivery) return ''
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  return `${apiBase}${detail.value.proof_of_delivery}`
})

function printSuratJalan() {
  if (props.sdoId) {
    store.downloadSdoPdf(props.sdoId)
  }
}

function simulateDriverView() {
  if (!props.sdoId) return
  const width = 450
  const height = 800
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  
  window.open(
    `/sales/sdo/mobile/${props.sdoId}`,
    `driver_portal_${props.sdoId}`,
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  )
}
</script>

<template>
  <USlideover
    :open="props.open"
    class="sm:max-w-xl"
    title="Delivery Order Details"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <!-- Loading indicator -->
      <div v-if="loadingDetail || loading" class="flex flex-col items-center justify-center p-16 space-y-3">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        <span class="text-xs text-muted font-bold">Querying dispatch data...</span>
      </div>

      <div v-else-if="detail" class="space-y-6">
        <!-- Header Info Row -->
        <div class="flex justify-between items-start gap-4">
          <div>
            <span class="text-[10px] font-bold text-muted bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
              {{ detail.do_number }}
            </span>
            <h3 class="text-lg font-bold text-default mt-1.5">
              {{ detail.customer?.name || '-' }}
            </h3>
            <p class="text-[10px] text-muted font-mono mt-0.5">
              Customer Code: {{ detail.customer?.customer_code || '-' }}
            </p>
          </div>

          <UBadge
            :color="detail.delivery_status === 'Delivered' ? 'success' : 'warning'"
            variant="solid"
            size="xs"
            class="rounded-full font-bold px-3 py-1"
          >
            {{ detail.delivery_status }}
          </UBadge>
        </div>

        <!-- Quick actions buttons panel -->
        <div class="flex gap-2 border-t border-b border-default py-3">
          <UButton
            size="sm"
            color="neutral"
            variant="subtle"
            icon="i-lucide-printer"
            label="Download PDF Surat Jalan"
            class="flex-1 font-bold justify-center"
            @click="printSuratJalan"
          />
          <UButton
            size="sm"
            color="primary"
            variant="subtle"
            icon="i-lucide-smartphone"
            label="Simulate POD Portal"
            class="flex-1 font-bold justify-center"
            @click="simulateDriverView"
          />
        </div>

        <!-- Dispatch allocations grid -->
        <div class="space-y-3">
          <h4 class="text-[10px] font-bold text-muted uppercase tracking-wider">
            Dispatch Details
          </h4>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-elevated/40 p-3 rounded-xl border border-default">
              <span class="text-[10px] text-muted block mb-0.5">Assigned Driver</span>
              <div class="flex items-center gap-1.5 font-bold text-default mt-1">
                <UIcon name="i-lucide-user" class="w-3.5 h-3.5 text-sky-500" />
                <span>{{ detail.driver?.full_name || '-' }}</span>
              </div>
            </div>

            <div class="bg-elevated/40 p-3 rounded-xl border border-default">
              <span class="text-[10px] text-muted block mb-0.5">Assigned Vehicle</span>
              <div class="flex items-center gap-1.5 font-bold text-default mt-1">
                <UIcon name="i-lucide-truck" class="w-3.5 h-3.5 text-indigo-500" />
                <span class="font-mono">{{ detail.vehicle?.license_plate || '-' }}</span>
              </div>
            </div>

            <div class="bg-elevated/40 p-3 rounded-xl border border-default">
              <span class="text-[10px] text-muted block mb-0.5">Shipment Date</span>
              <div class="flex items-center gap-1.5 font-bold text-default mt-1">
                <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-emerald-500" />
                <span>{{ formatDate(detail.shipment_date) }}</span>
              </div>
            </div>

            <div class="bg-elevated/40 p-3 rounded-xl border border-default">
              <span class="text-[10px] text-muted block mb-0.5">Planner Logs</span>
              <div class="flex items-center gap-1.5 font-bold text-default mt-1">
                <UIcon name="i-lucide-user-cog" class="w-3.5 h-3.5 text-purple-500" />
                <span class="truncate">{{ detail.creator?.user_detail?.full_name || detail.creator?.email || 'System' }}</span>
              </div>
            </div>

            <div class="bg-elevated/40 p-3 rounded-xl border border-default col-span-2 space-y-1">
              <span class="text-[10px] text-muted block">Destination Address</span>
              <p class="font-semibold text-default text-xs leading-relaxed">
                {{ detail.deliveryPlan?.destination || '-' }}
              </p>
              <div v-if="detail.deliveryPlan?.destination" class="pt-2">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-map-pin"
                  label="Google Maps Coordinates"
                  class="font-bold"
                  :to="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.deliveryPlan.destination)}`"
                  target="_blank"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Proof of Delivery Image Section (Delivered only) -->
        <div class="space-y-3">
          <h4 class="text-[10px] font-bold text-muted uppercase tracking-wider">
            Proof Of Delivery (POD)
          </h4>

          <div v-if="detail.delivery_status === 'Delivered'" class="bg-elevated/20 p-4 border border-default rounded-xl space-y-4">
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-[10px] text-muted block mb-0.5">Received Date</span>
                <span class="font-bold text-default">{{ formatDateTime(detail.received_at) }}</span>
              </div>
              <div>
                <span class="text-[10px] text-muted block mb-0.5">Fulfillment Quality</span>
                <span class="font-bold text-emerald-500">SAVED</span>
              </div>
            </div>

            <!-- Upload Photo Preview Frame -->
            <div v-if="detail.proof_of_delivery" class="space-y-2">
              <span class="text-[10px] text-muted block">Receipt Signature Photo</span>
              <div class="border border-default rounded-xl overflow-hidden shadow-inner max-h-56">
                <img
                  :src="podAbsoluteUrl"
                  class="w-full h-full object-cover"
                  alt="POD Signed receipt"
                >
              </div>
            </div>

            <!-- Overall Dispatch notes -->
            <div v-if="detail.notes" class="text-xs">
              <span class="text-[10px] text-muted block mb-0.5">Delivery Notes</span>
              <p class="bg-elevated p-2 rounded border border-default text-muted-foreground italic leading-relaxed">
                "{{ detail.notes }}"
              </p>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center p-6 border border-dashed border-default rounded-xl text-center text-muted gap-2">
            <UIcon name="i-lucide-clock" class="w-8 h-8 opacity-30 animate-pulse text-amber-500" />
            <p class="text-xs font-semibold">
              Awaiting Field Dispatch Delivery
            </p>
            <p class="text-[9px] text-slate-500 max-w-xs leading-relaxed">
              Driver has not captured signed Surat Jalan receipt yet. Use "Simulate POD Portal" above to update.
            </p>
          </div>
        </div>

        <!-- Dispatched parts items list table -->
        <div class="space-y-3">
          <h4 class="text-[10px] font-bold text-muted uppercase tracking-wider">
            Fulfillment Item List
          </h4>

          <div class="border border-default rounded-xl overflow-hidden text-xs">
            <table class="w-full text-left border-collapse">
              <thead class="bg-elevated/50 border-b border-default font-semibold text-muted">
                <tr>
                  <th class="p-3 border-r border-default w-6 text-center">
                    #
                  </th>
                  <th class="p-3 border-r border-default">
                    Part Details
                  </th>
                  <th class="p-3 border-r border-default text-center w-20">
                    Sent
                  </th>
                  <th class="p-3 border-r border-default text-center w-20">
                    Received
                  </th>
                  <th class="p-3">
                    Item Notes
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default bg-elevated/10">
                <tr
                  v-for="(item, idx) in detail.details"
                  :key="item.id"
                  class="hover:bg-elevated/20 transition-colors"
                >
                  <td class="p-3 border-r border-default text-center text-muted">
                    {{ idx + 1 }}
                  </td>
                  <td class="p-3 border-r border-default space-y-0.5">
                    <p class="font-bold text-default">
                      {{ item.planDetail?.spoDetail?.part?.part_name || 'Part' }}
                    </p>
                    <p class="font-mono text-[9px] text-muted">
                      No: {{ item.planDetail?.spoDetail?.part?.part_number || 'N/A' }}
                    </p>
                  </td>
                  <td class="p-3 border-r border-default text-center font-bold font-mono text-default">
                    {{ item.sent_qty }}
                  </td>
                  <td
                    class="p-3 border-r border-default text-center font-bold font-mono"
                    :class="(item.received_qty ?? item.sent_qty) < item.sent_qty ? 'text-rose-500' : 'text-emerald-500'"
                  >
                    {{ item.received_qty ?? '-' }}
                  </td>
                  <td class="p-3 text-muted-foreground italic truncate max-w-[120px]" :title="item.notes || ''">
                    {{ item.notes || '-' }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-elevated/30 border-t border-default font-bold">
                <tr>
                  <td colspan="2" class="p-3 text-right text-muted">
                    Total pcs
                  </td>
                  <td class="p-3 text-center border-r border-default text-primary font-mono font-bold">
                    {{ detail.details?.reduce((acc, curr) => acc + curr.sent_qty, 0) }}
                  </td>
                  <td class="p-3 text-center border-r border-default text-success font-mono font-bold">
                    {{ detail.details?.reduce((acc, curr) => acc + (curr.received_qty ?? curr.sent_qty), 0) }}
                  </td>
                  <td class="p-3 text-rose-500 font-mono text-[10px] text-center">
                    <span v-if="detail.details?.some(item => (item.received_qty ?? item.sent_qty) < item.sent_qty)">
                      Shortages!
                    </span>
                    <span v-else class="text-emerald-500 font-bold">
                      Full
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          color="neutral"
          variant="outline"
          label="Close Drawer"
          class="font-bold"
          @click="emit('update:open', false)"
        />
      </div>
    </template>
  </USlideover>
</template>
