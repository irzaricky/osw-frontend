<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import DatePicker from '../../../../../components/home/DatePicker.vue'

type DropdownOption = {
  id: number
  name: string
}

type BomMaterial = {
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
  bomMaterials: BomMaterial[]
  bomLoading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  selectProduct: [partId: number]
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
    material_part_id: number
    checked: boolean
    qty_ng: number
    remarks: string
  }[]
})

const shiftItems = computed(() => props.shifts.map(item => item.name))
const stationItems = computed(() => props.stations.map(item => item.name))
const productItems = computed(() => props.products.map(item => item.name))

const selectedShift = computed<string | undefined>({
  get: () => props.shifts.find(item => item.id === form.shift_id)?.name,
  set: value => {
    form.shift_id = props.shifts.find(item => item.name === value)?.id
  }
})

const selectedStation = computed<string | undefined>({
  get: () => props.stations.find(item => item.id === form.station_id)?.name,
  set: value => {
    form.station_id = props.stations.find(item => item.name === value)?.id
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
    production_wo_id: undefined as number | undefined,
    production_date: new Date(),
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

watch(() => form.part_id, id => {
  form.ng_materials = []

  if (id) {
    emit('selectProduct', id)
  }
})

watch(() => props.bomMaterials, materials => {
  form.ng_materials = materials.map(item => ({
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

function getNgMaterial(materialPartId: number) {
  return form.ng_materials.find(item => item.material_part_id === materialPartId)
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
    production_wo_id: form.production_wo_id || null,
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
        material_part_id: item.material_part_id,
        qty_ng: Number(item.qty_ng),
        remarks: item.remarks || null
      }))
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Add Production Result"
    description="Record production planning, actual output, OK, and NG quantity."
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form class="space-y-5" @submit.prevent="handleSave">
        <UFormField label="Production Date" required>
          <DatePicker
            v-model="form.production_date"
            placeholder="Select production date"
          />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UFormField label="Shift" required>
            <USelectMenu
              v-model="selectedShift"
              :items="shiftItems"
              placeholder="Select shift"
              searchable
              clear
              class="w-full"
            />
          </UFormField>

          <UFormField label="Station" required>
            <USelectMenu
              v-model="selectedStation"
              :items="stationItems"
              placeholder="Select station"
              searchable
              clear
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Part yang Dikerjakan" required>
          <USelectMenu
            v-model="selectedProduct"
            :items="productItems"
            placeholder="Select product part"
            searchable
            clear
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UFormField label="Planning">
            <UInput
              v-model.number="form.planning_qty"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Actual">
            <UInput
              v-model.number="form.actual_qty"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>

          <UFormField label="OK">
            <UInput
              v-model.number="form.total_ok"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>

          <UFormField label="NG">
            <UInput
              v-model.number="form.total_ng"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="isQtyInvalid"
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="Production quantity mismatch"
          :description="`Actual (${form.actual_qty}) must equal OK (${form.total_ok}) + NG (${form.total_ng}).`"
        />

        <div
          v-if="Number(form.total_ng || 0) > 0"
          class="space-y-3 rounded-lg border border-default p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-medium">
                NG Material Detail
              </p>
              <p class="text-xs text-muted">
                Select material that caused NG and input NG quantity.
              </p>
            </div>

            <UBadge
              :color="isNgDetailInvalid ? 'warning' : 'success'"
              variant="soft"
            >
              {{ totalNgMaterial }} / {{ form.total_ng }} PCS
            </UBadge>
          </div>

          <div
            v-if="bomLoading"
            class="text-sm text-muted"
          >
            Loading BOM material...
          </div>

          <div
            v-else-if="!props.bomMaterials.length"
            class="text-sm text-muted"
          >
            No BOM material found for this product.
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="item in props.bomMaterials"
              :key="item.material_part_id"
              class="grid grid-cols-1 md:grid-cols-[24px_1fr_110px] gap-3 items-center rounded-md border border-default p-3"
            >
              <UCheckbox
                :model-value="getNgMaterial(item.material_part_id)?.checked"
                @update:model-value="value => {
                  const ng = getNgMaterial(item.material_part_id)
                  if (!ng) return

                  ng.checked = Boolean(value)

                  if (!value) {
                    ng.qty_ng = 0
                    ng.remarks = ''
                  }
                }"
              />

              <div>
                <p class="text-sm font-medium">
                  {{ item.part_number }}
                </p>
                <p class="text-xs text-muted">
                  {{ item.part_name }}
                </p>
              </div>

              <UInput
                :model-value="getNgMaterial(item.material_part_id)?.qty_ng || 0"
                type="number"
                min="0"
                :max="form.total_ng"
                placeholder="Qty NG"
                class="w-full"
                :disabled="!getNgMaterial(item.material_part_id)?.checked"
                @update:model-value="value => {
                  const ng = getNgMaterial(item.material_part_id)
                  if (!ng) return

                  ng.qty_ng = Number(value || 0)
                }"
              />
            </div>
          </div>

          <UAlert
            v-if="isNgDetailInvalid"
            color="warning"
            variant="soft"
            icon="i-lucide-triangle-alert"
            title="NG material quantity mismatch"
            :description="`Total NG material (${totalNgMaterial}) must equal Total NG (${form.total_ng}).`"
          />
        </div>

        <UFormField label="Remarks">
          <UTextarea
            v-model="form.remarks"
            placeholder="Optional remarks"
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />

        <UButton
          color="primary"
          label="Create"
          :loading="loading"
          :disabled="isFormInvalid"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>