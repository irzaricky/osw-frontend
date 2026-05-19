<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { POProduct, POSchedule, AddSchedulePayload, UpdateSchedulePayload } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  open:      boolean
  product:   POProduct | null
  schedule:  POSchedule | null   // null = create mode
  shifts:    { id: number; name: string; start_time: string; end_time: string }[]
  poStartDate: string
  poEndDate:   string
  saving:    boolean
}>()

const emit = defineEmits<{
  'update:open':  [value: boolean]
  'save':         [payload: AddSchedulePayload | UpdateSchedulePayload]
}>()

const isEdit = computed(() => !!props.schedule)

const form = reactive({
  production_date:       '',
  shift_id:              null as number | null,
  planned_qty_per_day:   null as number | null,
  line_capacity_per_day: null as number | null,
  notes:                 '',
})

// Populate when editing
watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (props.schedule) {
      form.production_date       = props.schedule.production_date
      form.shift_id              = props.schedule.shift_id
      form.planned_qty_per_day   = props.schedule.planned_qty_per_day
      form.line_capacity_per_day = props.schedule.line_capacity_per_day ?? null
      form.notes                 = props.schedule.notes ?? ''
    } else {
      form.production_date       = ''
      form.shift_id              = null
      form.planned_qty_per_day   = null
      form.line_capacity_per_day = null
      form.notes                 = ''
    }
  },
)

const utilization = computed(() => {
  if (!form.planned_qty_per_day || !form.line_capacity_per_day) return null
  return ((form.planned_qty_per_day / form.line_capacity_per_day) * 100).toFixed(1)
})

function handleSave() {
  if (!form.production_date || !form.shift_id || !form.planned_qty_per_day) return
  emit('save', {
    production_date:       form.production_date,
    shift_id:              form.shift_id,
    planned_qty_per_day:   form.planned_qty_per_day,
    line_capacity_per_day: form.line_capacity_per_day ?? undefined,
    notes:                 form.notes || undefined,
  })
}

const shiftItems = computed(() =>
  props.shifts.map((s) => ({
    label: `${s.name} (${s.start_time} – ${s.end_time})`,
    value: s.id,
  })),
)

const selectedShift = computed({
  get: () => shiftItems.value.find((s) => s.value === form.shift_id) ?? null,
  set: (v: any) => { form.shift_id = v?.value ?? null },
})
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-calendar-plus" class="w-5 h-5 text-primary" />
        <span class="font-semibold">
          {{ isEdit ? 'Edit Schedule Entry' : 'Add Schedule Entry' }}
        </span>
      </div>
      <p v-if="product" class="text-sm text-muted mt-0.5">
        {{ product.part?.part_name }} · {{ product.customer?.name }} · Line: {{ product.line?.name }}
      </p>
    </template>

    <div class="space-y-4 py-2">
      <!-- Production Date -->
      <UFormField label="Production Date" required>
        <UInput
          v-model="form.production_date"
          type="date"
          :min="poStartDate"
          :max="poEndDate"
          class="w-full"
        />
      </UFormField>

      <!-- Shift -->
      <UFormField label="Shift" required>
        <USelectMenu
          v-model="selectedShift"
          :items="shiftItems"
          value-key="value"
          option-attribute="label"
          placeholder="Select shift"
          class="w-full"
        />
      </UFormField>

      <!-- Qty per Day -->
      <UFormField label="Planned Qty / Day" required>
        <UInput
          v-model.number="form.planned_qty_per_day"
          type="number"
          min="1"
          :max="product?.planned_qty ?? undefined"
          placeholder="e.g. 500"
          class="w-full"
        />
        <template v-if="product" #hint>
          Planned: {{ product.planned_qty.toLocaleString() }} · Scheduled: {{ product.scheduled_qty.toLocaleString() }}
        </template>
      </UFormField>

      <!-- Line Capacity -->
      <UFormField label="Line Capacity / Day">
        <UInput
          v-model.number="form.line_capacity_per_day"
          type="number"
          min="1"
          placeholder="e.g. 600 (optional)"
          class="w-full"
        />
        <template v-if="utilization" #hint>
          <span :class="Number(utilization) > 100 ? 'text-error-500' : Number(utilization) > 90 ? 'text-warning-500' : 'text-success-500'">
            Utilization: {{ utilization }}%
          </span>
        </template>
      </UFormField>

      <!-- Notes -->
      <UFormField label="Notes">
        <UTextarea
          v-model="form.notes"
          placeholder="Optional notes..."
          :rows="2"
          class="w-full"
        />
      </UFormField>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('update:open', false)"
        />
        <UButton
          :label="isEdit ? 'Update' : 'Add Schedule'"
          icon="i-lucide-save"
          color="primary"
          :loading="saving"
          :disabled="!form.production_date || !form.shift_id || !form.planned_qty_per_day"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>