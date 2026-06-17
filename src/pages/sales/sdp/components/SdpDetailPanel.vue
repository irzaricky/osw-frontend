<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ref, watch } from 'vue'
import type { Sdp } from '../../../../types/sales/sdp'
import { useSdoStore } from '../../../../stores/sales/sdo.store'
import SdpExecuteModal from './SdpExecuteModal.vue'

const props = defineProps<{
  plan: Sdp | null
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  delete: [id: number]
  refresh: []
}>()

const sdoStore = useSdoStore()

const isExecuting = ref(false)
const isExecutingModalOpen = ref(false)

const planDetails = computed(() => props.plan?.details || [])

// Watch for changes in active plan to fetch corresponding SDO if not loaded
watch(
  () => props.plan,
  async (newPlan) => {
    if (newPlan && newPlan.status !== 'Draft') {
      try {
        await sdoStore.fetchSdos({ limit: 100 })
      } catch (err) {
        console.error('Error pre-fetching SDOs:', err)
      }
    }
  },
  { immediate: true }
)

// Computed property to find SDO associated with this plan
const associatedSdo = computed(() => {
  if (!props.plan) return null
  return sdoStore.sdos.find(s => s.delivery_plan_id === props.plan!.id)
})

async function onExecuteSave(payload: { driver_id: number; vehicle_id: number }) {
  if (!props.plan) return
  isExecuting.value = true
  try {
    const res = await sdoStore.createSdo({
      delivery_plan_id: props.plan.id,
      vehicle_id: payload.vehicle_id,
      driver_id: payload.driver_id
    })
    if (res.status) {
      isExecutingModalOpen.value = false
      // Re-fetch SDO list to populate the associated SDO relationship
      await sdoStore.fetchSdos({ limit: 100 })
      // Notify parent list to refresh the planner dashboard
      emit('refresh')
    }
  } catch (err: any) {
    console.error('Error executing SDO:', err)
  } finally {
    isExecuting.value = false
  }
}

async function handleDownloadPdf() {
  if (!associatedSdo.value) {
    // If associatedSdo is not found, fallback to search by plan id
    try {
      await sdoStore.fetchSdos({ limit: 100 })
    } catch (err) {
      console.error(err)
    }
    if (!associatedSdo.value) return
  }
  try {
    await sdoStore.downloadSdoPdf(associatedSdo.value.id)
  } catch (err) {
    console.error('Error generating PDF:', err)
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-elevated border-l border-default shadow-2xl relative overflow-hidden">
    <!-- Close trigger button -->
    <div class="p-4 border-b border-default shrink-0 flex items-center justify-between bg-elevated/40">
      <div class="flex items-center gap-2">
        <div class="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
          <UIcon name="i-lucide-scroll" class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-base font-extrabold text-default">
            Plan Details
          </h3>
          <p class="text-xs text-muted">
            {{ props.plan?.dp_number || 'Select a plan' }}
          </p>
        </div>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        size="sm"
        class="rounded-full"
        @click="emit('close')"
      />
    </div>

    <!-- Active Details View -->
    <div v-if="props.plan" class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Big DP Number Badge Card -->
      <div class="p-5 rounded-2xl border border-default bg-elevated/20 relative overflow-hidden flex flex-col justify-center">
        <!-- Premium Radial Glow -->
        <div class="absolute -right-20 -bottom-20 w-44 h-44 bg-primary/5 rounded-full blur-2xl" />
        
        <span class="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
          Delivery Plan Code
        </span>
        <h2 class="text-3xl font-black text-default tracking-tight">
          {{ props.plan.dp_number }}
        </h2>
        
        <div class="flex items-center gap-2 mt-4">
          <UBadge
            :color="props.plan.status === 'Draft' ? 'warning' : props.plan.status === 'Scheduled' ? 'primary' : 'success'"
            variant="subtle"
            class="rounded-full font-bold px-2.5 py-0.5 text-xs"
          >
            {{ props.plan.status }}
          </UBadge>
          <span class="text-xs text-muted font-medium">
            Created on {{ new Date(props.plan.createdAt).toLocaleDateString('id-ID') }}
          </span>
        </div>
      </div>

      <!-- General Slot Metadata Information -->
      <div class="space-y-4">
        <h4 class="text-sm font-extrabold text-muted uppercase tracking-wider">
          Slot Allocations
        </h4>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Source Warehouse -->
          <div class="p-4 rounded-xl border border-default bg-elevated/40">
            <span class="text-xs text-muted font-bold block mb-1">Warehouse</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-sm mt-1">
              <UIcon name="i-lucide-warehouse" class="w-4 h-4 text-primary shrink-0" />
              <span>{{ props.plan.warehouse?.name || '-' }}</span>
            </div>
            <span class="text-xs text-muted block mt-0.5">Code: {{ props.plan.warehouse?.code || '-' }}</span>
          </div>

          <!-- Loading Dock -->
          <div class="p-4 rounded-xl border border-default bg-elevated/40">
            <span class="text-xs text-muted font-bold block mb-1">Loading Dock</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-sm mt-1">
              <UIcon name="i-lucide-navigation" class="w-4 h-4 text-secondary shrink-0" />
              <span>{{ props.plan.dock?.name || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Scheduled Date -->
          <div class="p-4 rounded-xl border border-default bg-elevated/40">
            <span class="text-xs text-muted font-bold block mb-1">Scheduled Date</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-sm mt-1">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{{ new Date(props.plan.scheduled_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            </div>
          </div>

          <!-- Time Slot -->
          <div class="p-4 rounded-xl border border-default bg-elevated/40">
            <span class="text-xs text-muted font-bold block mb-1">Time Slot</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-sm mt-1">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-amber-500 shrink-0" />
              <span>{{ props.plan.time_start.slice(0, 5) }} – {{ props.plan.time_end.slice(0, 5) }}</span>
            </div>
          </div>
        </div>

        <!-- Destination Address -->
        <div class="p-4 rounded-xl border border-default bg-elevated/40">
          <span class="text-xs text-muted font-bold block mb-1">Destination Address</span>
          <div class="flex items-start gap-1.5 font-bold text-default text-sm mt-1">
            <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span class="leading-relaxed">{{ props.plan.destination }}</span>
          </div>
        </div>

        <!-- Associated SDO Details if Scheduled -->
        <div v-if="associatedSdo" class="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <span class="text-xs text-primary font-black block mb-1">Active SDO Shipment</span>
          <div class="grid grid-cols-2 gap-3 mt-2">
            <div>
              <span class="text-xs text-muted block">DO Number</span>
              <span class="text-sm font-bold text-default">{{ associatedSdo.do_number }}</span>
            </div>
            <div>
              <span class="text-xs text-muted block">Driver</span>
              <span class="text-sm font-bold text-default">{{ associatedSdo.driver?.full_name || '-' }}</span>
            </div>
            <div>
              <span class="text-xs text-muted block">Vehicle Plate</span>
              <span class="text-sm font-bold text-default">{{ associatedSdo.vehicle?.license_plate || '-' }}</span>
            </div>
            <div>
              <span class="text-xs text-muted block">Status</span>
              <span class="text-sm font-black text-primary">{{ associatedSdo.delivery_status }}</span>
            </div>
          </div>
        </div>

        <!-- Created By -->
        <div class="p-4 rounded-xl border border-default bg-elevated/40">
          <span class="text-xs text-muted font-bold block mb-1">Scheduled By</span>
          <div class="flex items-center gap-1.5 font-bold text-default text-sm mt-1">
            <UIcon name="i-lucide-user" class="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{{ props.plan.creator?.user_detail?.full_name || props.plan.creator?.email || 'System' }}</span>
          </div>
        </div>
      </div>

      <!-- Scheduled Parts list table -->
      <div class="space-y-4">
        <h4 class="text-sm font-extrabold text-muted uppercase tracking-wider">
          Scheduled Delivery Items
        </h4>
        
        <div class="border border-default rounded-xl overflow-hidden">
          <div class="divide-y divide-default bg-elevated/20">
            <div
              v-for="detail in planDetails"
              :key="detail.id"
              class="p-4 hover:bg-elevated/40 transition-colors"
            >
              <div class="flex justify-between items-start gap-3">
                <div class="space-y-1.5">
                  <span class="text-xs font-bold text-muted bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                    SPO: {{ detail.spoDetail?.order?.spo_number || '-' }}
                  </span>
                  <h5 class="text-sm font-bold text-default mt-2">
                    {{ detail.spoDetail?.part?.part_name || '-' }}
                  </h5>
                  <p class="text-xs text-muted">
                    Part No: {{ detail.spoDetail?.part?.part_number || '-' }}
                  </p>
                </div>

                <div class="text-right shrink-0">
                  <span class="text-xs font-bold text-muted block mb-0.5">Planned Qty</span>
                  <span class="text-base font-black text-primary">
                    {{ detail.planned_qty }} pcs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Container -->
      <div class="pt-6 border-t border-default flex flex-col gap-3">
        <!-- Trigger Assignment / execution modal if Draft -->
        <UButton
          v-if="props.plan.status === 'Draft'"
          color="success"
          class="w-full font-bold justify-center"
          icon="i-lucide-truck"
          label="Schedule the Delivery"
          @click="isExecutingModalOpen = true"
        />

        <!-- Print physical Surat Jalan DO document if Scheduled or Shipped -->
        <UButton
          v-else
          color="primary"
          class="w-full font-bold justify-center"
          icon="i-lucide-printer"
          label="Print Delivery Note"
          :loading="sdoStore.loading"
          @click="handleDownloadPdf"
        />

        <!-- Only allow deletion for Draft status plans -->
        <UButton
          v-if="props.plan.status === 'Draft'"
          color="error"
          variant="outline"
          class="w-full font-bold justify-center"
          icon="i-lucide-trash"
          label="Delete Plan"
          @click="emit('delete', props.plan!.id)"
        />
      </div>
    </div>

    <!-- Empty Selection Screen -->
    <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-elevated/10">
      <div class="w-12 h-12 bg-default rounded-full flex items-center justify-center text-muted mb-4 opacity-50 shadow-inner">
        <UIcon name="i-lucide-calendar-days" class="w-6 h-6 text-default" />
      </div>
      <h3 class="text-sm font-bold text-default">
        No Plan Selected
      </h3>
    </div>

    <!-- Execution Modal popup -->
    <SdpExecuteModal
      v-model:open="isExecutingModalOpen"
      :plan="props.plan"
      :loading="isExecuting"
      @save="onExecuteSave"
    />
  </div>
</template>
