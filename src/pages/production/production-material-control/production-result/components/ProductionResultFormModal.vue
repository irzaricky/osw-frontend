<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import DatePicker from '../../../../../components/home/DatePicker.vue'

type DropdownOption = {
  id: number
  name: string
  description?: string | null
  start_time?: string | null
  end_time?: string | null
}

type ProductionWo = {
  wo_id: number
  wo_number: string
  production_date: string
  planning_qty: number
  actual_quantity?: number
  shift_id: number
  shift_name: string
  part_id: number
  part_number: string
  part_name: string
  stations: {
    station_id: number
    station_name: string
    sequence: number
    planned_quantity: number
    actual_quantity: number
    status: string
  }[]
}

type MaterialLabel = {
  wo_item_label_id: number
  label_id: number
  label_number: string
  material_part_id: number
  part_number: string
  part_name: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  shifts: DropdownOption[]
  stations: DropdownOption[]
  products: DropdownOption[]
  productionWos: ProductionWo[]
  materialLabels: MaterialLabel[]
  materialLabelLoading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  selectProductionWo: [productionWoId: number, stationId: number]
  save: [data: any]
}>()

const form = reactive({
  production_wo_id: undefined as number | undefined,
  production_date: undefined as Date | undefined,
  shift_id: undefined as number | undefined,
  station_id: undefined as number | undefined,
  part_id: undefined as number | undefined,
  planning_qty: 0,
  actual_qty: 0,
  total_ok: 0,
  total_ng: 0,
  remarks: '',
  ng_materials: [] as {
    wo_item_label_id: number
    label_id: number
    material_part_id: number
    checked: boolean
    qty_ng: number
    remarks: string
  }[]
})

const selectedProductionWo = computed(() =>
  props.productionWos.find(item => item.wo_id === form.production_wo_id)
)

const productionWoItems = computed(() =>
  props.productionWos.map(item => ({
    label: `${item.wo_number} | ${item.part_number} - ${item.part_name} | ${item.production_date}`,
    value: item.wo_id
  }))
)

const woStationItems = computed(() =>
  selectedProductionWo.value?.stations?.map(item => ({
    label: `${item.station_name} - Seq ${item.sequence}`,
    value: item.station_id
  })) || []
)

const shiftItems = computed(() =>
  props.shifts.map(item => ({
    label: `${item.name} - ${item.description || '-'} (${item.start_time || '-'} - ${item.end_time || '-'})`,
    value: item.id
  }))
)

const productItems = computed(() =>
  props.products.map(item => item.name)
)

const selectedShift = computed<number | undefined>({
  get: () => form.shift_id,
  set: value => {
    form.shift_id = value
  }
})

const selectedProduct = computed<string | undefined>({
  get: () => props.products.find(item => item.id === form.part_id)?.name,
  set: value => {
    form.part_id = props.products.find(item => item.name === value)?.id
  }
})

const isQtyInvalid = computed(() =>
  Number(form.total_ok || 0) + Number(form.total_ng || 0) !== Number(form.actual_qty || 0)
)

const totalNgMaterial = computed(() =>
  form.ng_materials.reduce((sum, item) => sum + Number(item.qty_ng || 0), 0)
)

const isNgDetailInvalid = computed(() =>
  Number(form.total_ng || 0) > 0 &&
  totalNgMaterial.value !== Number(form.total_ng || 0)
)

const isFormInvalid = computed(() =>
  !form.production_wo_id ||
  !form.production_date ||
  !form.shift_id ||
  !form.station_id ||
  !form.part_id ||
  isQtyInvalid.value ||
  isNgDetailInvalid.value
)

watch(() => props.open, open => {
  if (!open) return

  Object.assign(form, {
    production_wo_id: undefined,
    production_date: undefined,
    shift_id: undefined,
    station_id: undefined,
    part_id: undefined,
    planning_qty: 0,
    actual_qty: 0,
    total_ok: 0,
    total_ng: 0,
    remarks: '',
    ng_materials: []
  })
})

watch(() => form.production_wo_id, id => {
  const found = props.productionWos.find(item => item.wo_id === id)
  if (!found) return

  form.production_date = found.production_date
    ? new Date(found.production_date)
    : undefined

  form.shift_id = found.shift_id
  form.part_id = found.part_id
  form.planning_qty = Number(found.planning_qty || 0)
  form.actual_qty = Number(found.actual_quantity || 0)
  form.station_id = found.stations?.[0]?.station_id
  form.ng_materials = []

})

watch(() => form.station_id, stationId => {
  if (!form.production_wo_id || !stationId) return

  form.ng_materials = []
  emit('selectProductionWo', form.production_wo_id, stationId)
})

watch(() => props.materialLabels, labels => {
  form.ng_materials = labels.map(item => ({
    wo_item_label_id: item.wo_item_label_id,
    label_id: item.label_id,
    material_part_id: item.material_part_id,
    checked: false,
    qty_ng: 0,
    remarks: ''
  }))
}, { deep: true })

watch(() => form.total_ng, totalNg => {
  if (Number(totalNg || 0) <= 0) {
    form.ng_materials.forEach(item => {
      item.checked = false
      item.qty_ng = 0
      item.remarks = ''
    })
  }
})

function getNgMaterial(woItemLabelId: number) {
  return form.ng_materials.find(item => item.wo_item_label_id === woItemLabelId)
}

function formatDate(date?: Date) {
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function close() {
  emit('update:open', false)
}

function handleSave() {
  if (isFormInvalid.value) return

  emit('save', {
    production_wo_id: form.production_wo_id,
    production_date: formatDate(form.production_date),
    shift_id: form.shift_id,
    station_id: form.station_id,
    part_id: form.part_id,
    planning_qty: Number(form.planning_qty || 0),
    actual_qty: Number(form.actual_qty || 0),
    total_ok: Number(form.total_ok || 0),
    total_ng: Number(form.total_ng || 0),
    remarks: form.remarks || null,
    ng_materials: form.ng_materials
      .filter(item => item.checked && Number(item.qty_ng || 0) > 0)
      .map(item => ({
        wo_item_label_id: item.wo_item_label_id,
        label_id: item.label_id,
        material_part_id: item.material_part_id,
        qty_ng: Number(item.qty_ng),
        remarks: item.remarks || null
      }))
  })
}
</script>

<template>
  <UModal :open="open" title="Add Production Result"
    description="Record production result based on production WO and material label traceability."
    @update:open="emit('update:open', $event)">
    <template #body>
      <form class="space-y-5" @submit.prevent="handleSave">
        <UFormField label="Production WO" required>
          <USelectMenu v-model="form.production_wo_id" :items="productionWoItems" value-key="value" label-key="label"
            placeholder="Select production WO" searchable clear class="w-full" />
        </UFormField>

        <div v-if="selectedProductionWo" class="rounded-lg border border-default p-3 text-sm">
          <p class="font-medium">
            WO Information
          </p>

          <p class="text-muted mt-1">
            {{ selectedProductionWo.wo_number }} -
            {{ selectedProductionWo.part_number }} -
            {{ selectedProductionWo.part_name }}
          </p>

          <p class="text-muted mt-1">
            Shift: {{ selectedProductionWo.shift_name || '-' }}
          </p>

          <p class="text-muted mt-1">
            Stations:
            {{
              selectedProductionWo.stations?.length
                ? selectedProductionWo.stations.map(item => item.station_name).join(', ')
                : '-'
            }}
          </p>

          <p class="text-muted mt-1">
            Planned Qty: {{ selectedProductionWo.planning_qty }} PCS
          </p>

          <p class="text-muted mt-1">
            Actual Qty: {{ selectedProductionWo.actual_quantity || 0 }} PCS
          </p>
        </div>


        <UFormField label="Production Date" required>
          <DatePicker v-model="form.production_date" placeholder="Auto from WO" disabled />
        </UFormField>

        <UFormField label="Shift" required>
          <USelectMenu v-model="selectedShift" :items="shiftItems" value-key="value" label-key="label"
            placeholder="Auto from WO" searchable clear disabled class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UFormField label="Station" required>
            <USelectMenu v-model="form.station_id" :items="woStationItems" value-key="value" label-key="label"
              placeholder="Select station from WO" searchable clear class="w-full" />
          </UFormField>

          <UFormField label="Product yang Dikerjakan" required>
            <USelectMenu v-model="selectedProduct" :items="productItems" placeholder="Auto from WO" searchable clear
              disabled class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UFormField label="Planning">
            <UInput v-model.number="form.planning_qty" type="number" min="0" readonly disabled class="w-full" />
          </UFormField>

          <UFormField label="Actual">
            <UInput v-model.number="form.actual_qty" type="number" min="0" class="w-full" />
          </UFormField>

          <UFormField label="OK">
            <UInput v-model.number="form.total_ok" type="number" min="0" class="w-full" />
          </UFormField>

          <UFormField label="NG">
            <UInput v-model.number="form.total_ng" type="number" min="0" class="w-full" />
          </UFormField>
        </div>

        <UAlert v-if="isQtyInvalid" color="warning" variant="soft" icon="i-lucide-triangle-alert"
          title="Production quantity mismatch"
          :description="`Actual (${form.actual_qty}) must equal OK (${form.total_ok}) + NG (${form.total_ng}).`" />

        <div v-if="Number(form.total_ng || 0) > 0" class="space-y-3 rounded-lg border border-default p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-medium">
                NG Material Label Detail
              </p>
              <p class="text-xs text-muted">
                Select material label that caused NG and input NG quantity.
              </p>
            </div>

            <UBadge :color="isNgDetailInvalid ? 'warning' : 'success'" variant="soft">
              {{ totalNgMaterial }} / {{ form.total_ng }} PCS
            </UBadge>
          </div>

          <div v-if="materialLabelLoading" class="text-sm text-muted">
            Loading material labels...
          </div>

          <div v-else-if="!props.materialLabels.length" class="rounded-lg border border-default p-4 text-sm text-muted">
            No material label found for this production WO.
          </div>

          <div v-else class="space-y-2">
            <div v-for="item in props.materialLabels" :key="item.wo_item_label_id"
              class="grid grid-cols-1 md:grid-cols-[24px_1fr_110px] gap-3 items-center rounded-md border border-default p-3">
              <UCheckbox :model-value="getNgMaterial(item.wo_item_label_id)?.checked" @update:model-value="value => {
                const ng = getNgMaterial(item.wo_item_label_id)
                if (!ng) return

                ng.checked = Boolean(value)

                if (!value) {
                  ng.qty_ng = 0
                  ng.remarks = ''
                }
              }" />

              <div>
                <p class="text-sm font-medium">
                  {{ item.label_number }}
                </p>
                <p class="text-xs text-muted">
                  {{ item.part_number }} - {{ item.part_name }}
                </p>
              </div>

              <UInput :model-value="getNgMaterial(item.wo_item_label_id)?.qty_ng || 0" type="number" min="0"
                :max="form.total_ng" placeholder="Qty NG" class="w-full"
                :disabled="!getNgMaterial(item.wo_item_label_id)?.checked" @update:model-value="value => {
                  const ng = getNgMaterial(item.wo_item_label_id)
                  if (!ng) return

                  ng.qty_ng = Number(value || 0)
                }" />
            </div>
          </div>

          <UAlert v-if="isNgDetailInvalid" color="warning" variant="soft" icon="i-lucide-triangle-alert"
            title="NG material quantity mismatch"
            :description="`Total NG material (${totalNgMaterial}) must equal Total NG (${form.total_ng}).`" />
        </div>

        <UFormField label="Remarks">
          <UTextarea v-model="form.remarks" placeholder="Optional remarks" class="w-full" :rows="3" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />

        <UButton color="primary" label="Create" :loading="loading" :disabled="isFormInvalid" @click="handleSave" />
      </div>
    </template>
  </UModal>
</template>