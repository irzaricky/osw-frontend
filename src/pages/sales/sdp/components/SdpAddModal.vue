<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSdpStore } from '../../../../stores/sales/sdp.store'
import SdpConflictWarning from './SdpConflictWarning.vue'
import { useAppToast } from '../../../../composables/useAppToast'

const { toastError } = useAppToast()

const formRef = ref()
const store = useSdpStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  presetSpoId?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: any]
}>()

const timeOptions = [
  '08:00', '08:30',
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00'
]

const endTimeOptions = computed(() => {
  if (!state.time_start) return []
  return timeOptions.filter(t => t > state.time_start)
})

// State parameters for form
const state = reactive({
  scheduled_date: '',
  time_start: '',
  time_end: '',
  warehouse_id: undefined as number | undefined,
  dock_id: undefined as number | undefined,
  destination: '',
  selectedSpoItems: [] as { spo_detail_id: number; planned_qty: number; remaining_qty: number; label: string }[]
})

const scheduledDateModel = computed({
  get() {
    if (!state.scheduled_date) return null
    const [y, m, d] = state.scheduled_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) {
      state.scheduled_date = ''
      return
    }
    const yyyy = val.year
    const mm = String(val.month).padStart(2, '0')
    const dd = String(val.day).padStart(2, '0')
    state.scheduled_date = `${yyyy}-${mm}-${dd}`
  }
})

// Validation Schema
const schema = z.object({
  scheduled_date: z.string().min(1, 'Scheduled Date is required'),
  time_start: z.string().min(1, 'Start Time is required'),
  time_end: z.string().min(1, 'End Time is required'),
  warehouse_id: z.number({ message: 'Warehouse is required' }),
  dock_id: z.number({ message: 'Loading Dock is required' }),
  destination: z.string().min(1, 'Destination is required')
})

// Reset form on open
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      state.scheduled_date = ''
      state.time_start = ''
      state.time_end = ''
      state.warehouse_id = undefined
      state.dock_id = undefined
      state.destination = ''
      state.selectedSpoItems = []
      conflictData.value = null
      
      // Load prerequisites
      await store.fetchDropdownWarehouses()
      await store.fetchDropdownDocks()
      
      if (props.presetSpoId) {
        // Fetch only items for this SPO
        const res = await store.fetchAvailableSpoItems(props.presetSpoId)
        if (res.status && Array.isArray(res.data)) {
          state.selectedSpoItems = res.data.map((item: any) => ({
            spo_detail_id: item.id,
            planned_qty: item.remaining_qty,
            remaining_qty: item.remaining_qty,
            label: `${item.order?.spo_number} - ${item.part?.part_name}`
          }))
          
          // Pre-populate destination from SPO shipping address
          if (res.data.length > 0 && res.data[0].order) {
            state.destination = res.data[0].order.shipping_address || ''
          }
        }
      } else {
        // Load all available items normally
        await store.fetchAvailableSpoItems()
      }
    }
  }
)

// Computed Dropdowns
const warehouseItems = computed(() => store.warehouses)
const selectedWarehouse = computed({
  get: () => warehouseItems.value.find(w => w.id === state.warehouse_id),
  set: (val) => {
    state.warehouse_id = val?.id
    state.dock_id = undefined // reset dock
  }
})

const filteredDocks = computed(() => {
  if (!state.warehouse_id) return []
  return store.docks.filter(d => d.warehouse_id === state.warehouse_id)
})

const selectedDock = computed({
  get: () => filteredDocks.value.find(d => d.id === state.dock_id),
  set: (val) => {
    state.dock_id = val?.id
  }
})

// Available SPO Items
const readySpoItems = computed(() => store.availableSpoItems)

// Local Client-Side conflict tracking
const conflictData = ref<{ message: string; conflicting_plan?: string } | null>(null)

function checkLocalConflict() {
  if (
    !state.scheduled_date ||
    !state.time_start ||
    !state.time_end ||
    !state.warehouse_id ||
    !state.dock_id
  ) {
    conflictData.value = null
    return
  }

  // Find any existing slot overlap
  const conflict = store.plans.find(p => {
    const pDate = p.scheduled_date.split('T')[0]
    const stateDate = state.scheduled_date
    if (
      pDate !== stateDate ||
      p.warehouse_id !== state.warehouse_id ||
      p.dock_id !== state.dock_id
    ) {
      return false
    }
    
    // Check overlap: existing.start < new.end AND existing.end > new.start
    const newStart = state.time_start
    const newEnd = state.time_end
    return p.time_start < newEnd && p.time_end > newStart
  })

  if (conflict) {
    conflictData.value = {
      message: `Dock conflict with plan ${conflict.dp_number} (${conflict.time_start.slice(0,5)} – ${conflict.time_end.slice(0,5)})`,
      conflicting_plan: conflict.dp_number
    }
  } else {
    conflictData.value = null
  }
}

// Watchers for Conflict Check
watch(
  () => [state.scheduled_date, state.time_start, state.time_end, state.warehouse_id, state.dock_id],
  () => {
    checkLocalConflict()
  },
  { deep: true }
)

watch(
  () => state.time_start,
  (newStart) => {
    if (newStart && state.time_end && state.time_end <= newStart) {
      state.time_end = ''
    }
  }
)

// Handle SPO item check state
function toggleSpoItem(item: any) {
  const idx = state.selectedSpoItems.findIndex(x => x.spo_detail_id === item.id)
  if (idx === -1 && isAddressMismatch(item)) return
  if (idx > -1) {
    state.selectedSpoItems.splice(idx, 1)
    if (state.selectedSpoItems.length === 0) {
      state.destination = ''
    } else {
      const nextItemId = state.selectedSpoItems[0].spo_detail_id
      const nextItem = readySpoItems.value.find(x => x.id === nextItemId)
      if (nextItem?.order?.shipping_address) {
        state.destination = nextItem.order.shipping_address
      }
    }
  } else {
    state.selectedSpoItems.push({
      spo_detail_id: item.id,
      planned_qty: item.remaining_qty,
      remaining_qty: item.remaining_qty,
      label: `${item.order?.spo_number} - ${item.part?.part_name}`
    })
    if (item.order?.shipping_address) {
      state.destination = item.order.shipping_address
    }
  }
}

function isAddressMismatch(item: any) {
  if (state.selectedSpoItems.length === 0) return false
  return item.order?.shipping_address !== state.destination
}

function isSelected(itemId: number) {
  return state.selectedSpoItems.some(x => x.spo_detail_id === itemId)
}

function getSelectedRef(itemId: number) {
  return state.selectedSpoItems.find(x => x.spo_detail_id === itemId)
}

// Form Submit
function submitForm() {
  if (conflictData.value) return // Block if conflict exists
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  if (state.selectedSpoItems.length === 0) {
    toastError('Please select at least one SPO item to schedule.')
    return
  }

  const payload = {
    scheduled_date: event.data.scheduled_date,
    time_start: `${event.data.time_start}:00`,
    time_end: `${event.data.time_end}:00`,
    warehouse_id: event.data.warehouse_id,
    dock_id: event.data.dock_id,
    destination: event.data.destination,
    details: state.selectedSpoItems.map(item => ({
      spo_detail_id: item.spo_detail_id,
      planned_qty: Number(item.planned_qty)
    }))
  }

  emit('save', payload)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Create Sales Delivery Plan"
    description="Set up loading dock, date, and items for the physical delivery process."
    class="sm:max-w-4xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Error Slot Warning -->
        <SdpConflictWarning :conflict="conflictData" class="mb-4" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Left side: Basic Config -->
          <div class="space-y-4">
            <!-- Warehouse -->
            <UFormField label="Source Warehouse" name="warehouse_id" required>
              <USelectMenu
                v-model="selectedWarehouse"
                :items="warehouseItems"
                class="w-full"
                placeholder="Select warehouse"
                label-key="name"
              />
            </UFormField>

            <!-- Loading Dock -->
            <UFormField label="Loading Dock" name="dock_id" required>
              <USelectMenu
                v-model="selectedDock"
                :items="filteredDocks"
                class="w-full"
                placeholder="Select dock slot"
                label-key="name"
                :disabled="!state.warehouse_id"
              />
            </UFormField>

            <!-- Target Date -->
            <UFormField label="Shipment Date" name="scheduled_date" required>
              <UInputDate v-model="scheduledDateModel">
                <template #trailing>
                  <UPopover>
                    <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                    <template #content>
                      <UCalendar
                        v-model="scheduledDateModel"
                        class="p-2"
                      />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>

            <!-- Start / End Times -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Start Time" name="time_start" required>
                <USelectMenu
                  v-model="state.time_start"
                  :items="timeOptions"
                  class="w-full"
                  placeholder="Select start"
                />
              </UFormField>
              <UFormField label="End Time" name="time_end" required>
                <USelectMenu
                  v-model="state.time_end"
                  :items="endTimeOptions"
                  class="w-full"
                  placeholder="Select end"
                  :disabled="!state.time_start"
                />
              </UFormField>
            </div>

            <!-- Destination -->
            <UFormField label="Destination Address/Location" name="destination" required>
              <UInput v-model="state.destination" placeholder="Select SPO item to set destination" class="w-full" :disabled="true" />
            </UFormField>
          </div>

          <!-- Right side: SPO Items selection -->
          <div class="flex flex-col h-[400px] border border-default rounded-xl overflow-hidden bg-elevated/20">
            <div class="p-3 bg-elevated border-b border-default shrink-0 flex items-center justify-between">
              <h4 class="text-sm font-bold text-default flex items-center gap-1.5">
                <UIcon name="i-lucide-box-select" class="text-primary w-4 h-4" />
                <span>Select Ready SPO Items</span>
              </h4>
              <UBadge
                color="primary"
                variant="subtle"
                size="xs"
                class="rounded-full"
              >
                {{ state.selectedSpoItems.length }} selected
              </UBadge>
            </div>

            <!-- Available SPO scroll frame -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2">
              <div v-if="readySpoItems.length === 0" class="flex flex-col items-center justify-center h-full text-center p-4">
                <UIcon name="i-lucide-folder-open" class="w-8 h-8 text-muted mb-2 opacity-50" />
                <p class="text-xs text-muted font-medium">
                  No SPO items ready for scheduling.
                </p>
                <p class="text-[10px] text-muted/70 mt-1">
                  Ready items must belong to Locked/Processing SPO orders.
                </p>
              </div>

              <div
                v-for="item in readySpoItems"
                :key="item.id"
                class="p-3 rounded-lg border transition-all duration-200"
                :class="[
                  isSelected(item.id)
                    ? 'border-primary bg-primary-50/10 dark:bg-primary-950/10 shadow-sm'
                    : 'border-default bg-elevated hover:bg-elevated/50',
                  isAddressMismatch(item) ? 'opacity-40 cursor-not-allowed select-none' : ''
                ]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex gap-2">
                    <UCheckbox
                      :model-value="isSelected(item.id)"
                      :disabled="isAddressMismatch(item)"
                      class="mt-1"
                      @update:model-value="toggleSpoItem(item)"
                    />
                    <div class="text-xs">
                      <p class="font-bold text-default">
                        {{ item.order?.spo_number }}
                      </p>
                      <p class="text-muted font-medium mt-0.5">
                        {{ item.part?.part_name }}
                      </p>
                      <p class="text-[10px] text-muted/80 mt-1 flex items-center gap-1">
                        <span>Due: {{ item.order?.delivery_due_date ? new Date(item.order.delivery_due_date).toLocaleDateString('id-ID') : '-' }}</span>
                        <span>•</span>
                        <span>Customer: {{ item.order?.customer?.name || '-' }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="text-right">
                    <span class="text-[10px] font-semibold text-muted block mb-1">
                      Rem: {{ item.remaining_qty }} pcs
                    </span>
                    
                    <div v-if="isSelected(item.id)" class="w-24 mt-1">
                      <UInput
                        v-model="getSelectedRef(item.id)!.planned_qty"
                        type="number"
                        min="1"
                        :max="item.remaining_qty"
                        size="xs"
                        placeholder="Qty"
                        class="text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />
        <UButton
          color="primary"
          label="Schedule Delivery"
          :loading="props.loading"
          :disabled="!!conflictData"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>
