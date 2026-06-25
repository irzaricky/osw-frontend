<script setup lang="ts">
import { reactive, watch, computed, ref, resolveComponent } from 'vue'
import * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { WorkOrderStoring, ProductionWODropdown, StationDropdown } from '../../../../types/warehouse/work-order-storing'
import type { PartDropdown } from '../../../../types/master-data/parts'
import type { MaterialReceivingDropdown } from '../../../../types/warehouse/material-receiving'

import WorkOrderStoringItemFormModal from './WorkOrderStoringItemFormModal.vue'
import { useWorkOrderStoringItemColumns } from '../composables/useWorkOrderStoringItemColumns'
import { useAppToast } from '../../../../composables/useAppToast'

import { usePartStore } from '../../../../stores/master-data/part.store'
import { useWarehouseAreaStore } from '../../../../stores/master-data/warehouse-area.store'
import { useWorkOrderStoringStore } from '../../../../stores/warehouse/work-order-storing.store'

const workOrderStore = useWorkOrderStoringStore()
const formRef = ref()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const submitType = ref<'draft' | 'submit'>('draft')

const partStore = usePartStore()
const partsRef = computed(() => partStore.dropdown)
const warehouseAreaStore = useWarehouseAreaStore()

const { toastError } = useAppToast()

const dateModel = computed({
  get() {
    if (!state.wo_date) return null

    const [y, m, d] = state.wo_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) {
      state.wo_date = ''
      return
    }

    const yyyy = val.year
    const mm = String(val.month).padStart(2, '0')
    const dd = String(val.day).padStart(2, '0')

    state.wo_date = `${yyyy}-${mm}-${dd}`
  }
})

// props
const props = defineProps<{
  mode: 'add' | 'edit'
  workOrder: Partial<WorkOrderStoring>
  types: { id: number; name: string }[]
  areas: {
    id: number
    area_code: string
    name: string
    warehouse: {
      name: string
    }
  }[]
  parts: PartDropdown[]
  refDocs: MaterialReceivingDropdown[]
  productionWos: ProductionWODropdown[]
  stations: StationDropdown[]
  loading: boolean
}>()

const emit = defineEmits<{
  save: [data: Partial<WorkOrderStoring>]
}>()

// schema
const schema = z.object({
  wo_category: z.enum(['Placement', 'Take Out'], { message: 'Work Order Category is required' }),
  wo_date: z
    .string()
    .min(1, 'Work Order Date is required')
    .refine((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selected = new Date(value)
      selected.setHours(0, 0, 0, 0)

      return selected >= today
    }, {
      message: 'Work Order date cannot be earlier than today'
    }),

  wo_type_id: z.number({ message: 'Work Order Type is required' }),
  warehouse_area_id: z.number({ message: 'Warehouse Area is required' }),

  take_out_purpose: z.enum(['production', 'buffer']).optional(),
  production_wo_id: z.number().optional(),
  station_id: z.number().optional(),

  ref_source: z.enum(['manual', 'delivery_order']).optional(),

  ref_doc_id: z.number().optional(),
  ref_doc_number: z.string().optional(),
  ref_doc_name: z.string().optional(),
  wo_description: z.string().optional(),

  items: z.array(
    z.object({
      part_id: z.number(),
      total_kanban: z.number().min(1)
    })
  ).min(1, 'At least one item is required')
}).superRefine((data, ctx) => {
  const isPlacementRaw = data.wo_category === 'Placement' && data.wo_type_id === 1

  if (isPlacementRaw && !data.ref_source) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ref_source'],
      message: 'Reference Source is required'
    })
  }

  if (data.ref_source === 'delivery_order' && !data.ref_doc_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ref_doc_id'],
      message: 'Delivery Order is required'
    })
  }

  const isTakeOutRaw = data.wo_category === 'Take Out' && data.wo_type_id === 1

  if (isTakeOutRaw && !data.take_out_purpose) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['take_out_purpose'],
      message: 'Take Out Purpose is required'
    })
  }

  if (isTakeOutRaw && data.take_out_purpose === 'production') {
    if (!data.production_wo_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['production_wo_id'],
        message: 'Production Work Order is required'
      })
    }

    if (!data.station_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['station_id'],
        message: 'Station is required'
      })
    }
  }

  if (isTakeOutRaw && data.take_out_purpose === 'buffer') {

    if (!data.station_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['station_id'],
        message: 'Station is required'
      })
    }
  }
})

// state
const state = reactive({
  wo_category: 'Placement' as 'Placement' | 'Take Out',
  wo_date: '',
  wo_type_id: undefined as number | undefined,
  warehouse_area_id: undefined as number | undefined,

  take_out_purpose: 'production' as 'production' | 'buffer',
  production_wo_id: undefined as number | undefined,
  station_id: undefined as number | undefined,

  ref_source: 'manual' as 'manual' | 'delivery_order',

  ref_doc_id: undefined as number | undefined,
  ref_doc_number: '',
  ref_doc_name: '',
  wo_description: '',

  items: [] as { part_id: number; total_kanban: number }[]
})

// sync edit
watch(
  () => props.workOrder,
  (val) => {
    if (!val || props.mode !== 'edit') return

    state.wo_category = val.wo_category ?? 'Placement'
    state.wo_date = val.wo_date ?? ''
    state.wo_type_id = val.type?.id ?? undefined
    state.warehouse_area_id = val.area?.id ?? undefined

    state.take_out_purpose = val.take_out_purpose ?? 'production'
    state.production_wo_id = val.production_wo_id ?? undefined
    state.station_id = val.station_id ?? undefined

    state.ref_source = val.ref_doc_id ? 'delivery_order' : 'manual'
    state.ref_doc_id = val.ref_doc_id ?? undefined
    state.ref_doc_number = val.ref_doc_number ?? ''
    state.ref_doc_name = val.ref_doc_name ?? ''
    state.wo_description = val.wo_description ?? ''

    state.items = val.items?.map(item => ({
      part_id: item.part_id,
      total_kanban: item.total_kanban,
      part: item.part
    })) || []
  },
  { immediate: true }
)

const isEditable = computed(() => {
  if (props.mode === 'add') return true

  const statusId = props.workOrder?.wo_status_id ?? props.workOrder?.status?.id
  return statusId === 1
})

const woStatusId = computed(() =>
  props.workOrder?.wo_status_id || props.workOrder?.status?.id
)

const woCategory = computed(() =>
  state.wo_category
)

const refDocId = computed(() =>
  state.ref_doc_id
)

const showReferenceSource = computed(() => 
  state.wo_category === 'Placement' && state.wo_type_id === 1
)

const showTakeOutPurpose = computed(() =>
  state.wo_category === 'Take Out' && state.wo_type_id === 1
)

const displayRefDocNumber = computed(() => {
  if (isEditable.value) return state.ref_doc_number
  return state.ref_doc_number || '-'
})

const displayRefDocName = computed(() => {
  if (isEditable.value) return state.ref_doc_name
  return state.ref_doc_name || '-'
})

const displayDescription = computed(() => {
  if (isEditable.value) return state.wo_description
  return state.wo_description || '-'
})

const stationInfo = computed(() => {
  if (!selectedStation.value) {
    return null
  }

  return selectedStation.value
})

//watch type
function mapTypeToPartCode(typeId: number) {
  const map: Record<number, string> = {
    1: 'RAW',
    2: 'WIP',
    3: 'PRODUCT'
  }
  return map[typeId]
}

watch(
  () => state.wo_type_id,
  async (typeId) => {
    if (!typeId) return

    if (typeId !== 1) {
      state.ref_source = 'manual'
      state.ref_doc_id = undefined
      state.ref_doc_number = ''
      state.ref_doc_name = ''

      state.take_out_purpose = 'production'
      state.production_wo_id = undefined
      state.station_id = undefined
    }

    if (typeId === 1 && state.ref_source === 'delivery_order' && state.ref_doc_id) return

    const isTakeOut = state.wo_category === 'Take Out'

    await warehouseAreaStore.fetchDropdown({
      category_id: typeId,
      ...(isTakeOut && { wo_category: 'take_out' })
    })

    await partStore.fetchDropdown({
      part_type_code: mapTypeToPartCode(typeId),
      ...(isTakeOut && {
        wo_category: 'take_out',
        area_id: state.warehouse_area_id
      })
    })

    state.items = []
  }
)

watch(
  () => state.wo_category,
  async (category) => {
    if (!state.wo_type_id) return
    const isTakeOut = category === 'Take Out'

    if (isTakeOut) {
      state.ref_source = 'manual'
      state.ref_doc_id = undefined
      state.ref_doc_number = ''
      state.ref_doc_name = ''
      state.warehouse_area_id = undefined
      state.production_wo_id = undefined
      state.station_id = undefined
    } else if (state.ref_source === 'delivery_order' && state.ref_doc_id) {
      return
    }

    if (!isTakeOut) {
      state.take_out_purpose = 'production'
      
      state.production_wo_id = undefined
      state.station_id = undefined
      state.warehouse_area_id = undefined
    }

    await warehouseAreaStore.fetchDropdown({
      category_id: state.wo_type_id,
      ...(isTakeOut && { wo_category: 'take_out' })
    })

    await partStore.fetchDropdown({
      part_type_code: mapTypeToPartCode(state.wo_type_id),
      ...(isTakeOut && {
        wo_category: 'take_out',
        area_id: state.warehouse_area_id
      })
    })

    state.items = []
  }
)

watch(
  () => state.take_out_purpose,
  async (purpose) => {
    state.items = []

    state.station_id = undefined
    state.production_wo_id = undefined
    state.warehouse_area_id = undefined

    if (purpose === 'buffer') {
      await workOrderStore.fetchStationDropdown({
        take_out_purpose: 'buffer'
      })
    }
  }
)

watch(
  () => state.ref_source,
  async (source) => {
    state.items = []

    if (source === 'manual') {
      state.ref_doc_id = undefined

      state.ref_doc_number = ''
      state.ref_doc_name = ''

      if (state.wo_type_id) {
        await partStore.fetchDropdown({
          part_type_code: mapTypeToPartCode(
            state.wo_type_id
          )
        })
      }
    }
  }
)

watch(
  () => state.ref_doc_id,
  async (refDocId) => {
    state.items = []

    if (!refDocId) {
      if (state.ref_source !== 'delivery_order') return
      state.ref_doc_number = ''
      state.ref_doc_name = ''

      // default dropdown
      if (state.wo_type_id) {
        const isTakeOut = state.wo_category === 'Take Out'

        await partStore.fetchDropdown({
          part_type_code: mapTypeToPartCode(
            state.wo_type_id
          ),

          ...(isTakeOut && {
            wo_category: 'take_out',
            area_id: state.warehouse_area_id
          })
        })
      }

      return
    }

    const selectedDoc = props.refDocs.find(
      doc => doc.id === refDocId
    )

    if (!selectedDoc) return

    state.ref_doc_number = selectedDoc.number || ''
    state.ref_doc_name = 'Material Delivery Order'

    // fetch parts by ref doc only
    await partStore.fetchDropdown({
      ref_doc_id: refDocId
    })
  }
)

watch(
  () => state.production_wo_id,
  async (productionWoId) => {
    state.items = []
    state.station_id = undefined
    state.warehouse_area_id = undefined

    if (!productionWoId) {
      state.ref_doc_number = ''
      state.ref_doc_name = ''
      return
    }

    const selectedWO = props.productionWos.find(
      wo => wo.id === productionWoId
    )

    if (!selectedWO) return

    state.ref_doc_number = selectedWO.wo_number
    state.ref_doc_name = 'Production Work Order'

    await workOrderStore.fetchStationDropdown({
      take_out_purpose: 'production',
      production_wo_id: productionWoId
    })
  }
)

watch(
  () => state.station_id,
  async (stationId) => {
    if (!stationId) return

    state.items = []
    state.warehouse_area_id = undefined

    await warehouseAreaStore.fetchDropdown({
      category_id: 1,
      wo_category: 'take_out',
      production_wo_id: state.take_out_purpose === 'production' ? state.production_wo_id : undefined,
      station_id: stationId,
    })
  }
)

watch(
  () => state.warehouse_area_id,
  async (areaId) => {
    if (state.items.length) {
      state.items = []
    }
    
    if (!areaId || !state.wo_type_id) return
    if (state.ref_source === 'delivery_order' && state.ref_doc_id) return

    // Take Out - Supply Production
    if (
      state.wo_category === 'Take Out' &&
      state.take_out_purpose === 'production' &&
      state.production_wo_id &&
      state.station_id
    ) {
      await partStore.fetchDropdown({
        part_type_code: mapTypeToPartCode(state.wo_type_id),
        wo_category: 'take_out',
        production_wo_id: state.production_wo_id,
        station_id: state.station_id,
        area_id: areaId
      })

      return
    }

    // Take Out - Supply Buffer
    if (
      state.wo_category === 'Take Out' &&
      state.take_out_purpose === 'buffer' &&
      state.station_id
    ) {
      await partStore.fetchDropdown({
        part_type_code: mapTypeToPartCode(state.wo_type_id),
        wo_category: 'take_out',
        station_id: state.station_id,
        area_id: areaId
      })

      return
    }

    // Take Out WIP & FG
    if (state.wo_category === 'Take Out') {
      await partStore.fetchDropdown({
        part_type_code: mapTypeToPartCode(state.wo_type_id),
        wo_category: 'take_out',
        area_id: areaId
      })
    }
  }
)

// dropdown
const categoryItems = ['Placement', 'Take Out']
const typeItems = computed(() => props.types.map(t => t.name))
const areaItems = computed(() =>
  props.areas.map(a => ({
    ...a,
    label: `${a.area_code} - ${a.name} - ${a.warehouse?.name ?? '-'}`
  }))
)

const refDocItems = computed(() =>
  props.refDocs.map(doc => ({
    ...doc,
    label: `${doc.number} - ${doc.supplier_name ?? '-'}`
  }))
)

const stationItems = computed(() =>
  props.stations.map(station => ({
    ...station,
    label: `${station.station_code} - ${station.name}`
  }))
)

const productionWOItems = computed(() =>
  props.productionWos.map(wo => ({
    ...wo,
    label: `${wo.wo_number} - ${wo.part_number}`
  }))
)

function mapNameToId(list: any[], value?: string) {
  return list.find(i => i.name === value)?.id ?? undefined
}

const selectedType = computed({
  get: () => props.types.find(t => t.id === state.wo_type_id)?.name,
  set: (val) => state.wo_type_id = mapNameToId(props.types, val)
})

const selectedArea = computed({
  get: () => areaItems.value.find(a => a.id === state.warehouse_area_id),
  set: (val) => state.warehouse_area_id = val?.id
})

const selectedRefDoc = computed({
  get: () => refDocItems.value.find(doc => doc.id === state.ref_doc_id),
  set: (val) => { state.ref_doc_id = val?.id }
})

const selectedStation = computed({
  get: () =>
    stationItems.value.find(
      station => station.id === state.station_id
    ),

  set: (val) => {
    state.station_id = val?.id
  }
})

const selectedProductionWO = computed({
  get() {
    if (!state.production_wo_id) {
      return undefined
    }

    return productionWOItems.value.find(
      wo => wo.id === state.production_wo_id
    )
  },

  set(val) {
    state.production_wo_id = val?.id
  }
})

// modal
const isItemModalOpen = ref(false)
const itemModalMode = ref<'add' | 'edit'>('add')
const selectedItemIndex = ref<number | null>(null)

function openItemModal() {
  itemModalMode.value = 'add'
  selectedItemIndex.value = null
  isItemModalOpen.value = true
}

function handleEditItem(index: number) {
  itemModalMode.value = 'edit'
  selectedItemIndex.value = index
  isItemModalOpen.value = true
}

function handleDeleteItem(index: number) {
  state.items.splice(index, 1)
}

async function handlePrintLabel(index: number) {
  try {
    const itemId = props.workOrder?.items?.[index]?.id
    if (!itemId) {
      toastError('Item ID not found')
      return
    }
    
    await workOrderStore.printLabel(itemId)
  } catch (err) {
    toastError(err)
  }
}

function handleAddItem(item: { part_id: number; total_kanban: number }) {
  const duplicateIndex = state.items.findIndex(
    (i, index) =>
      i.part_id === item.part_id &&
      index !== selectedItemIndex.value
  )

  if (duplicateIndex !== -1) {
    toastError('Part already exists in the item list.')
    return
  }

  if (
    itemModalMode.value === 'edit' &&
    selectedItemIndex.value !== null
  ) {
    state.items[selectedItemIndex.value] = item
  } else {
    state.items.push(item)
  }
}

// item table
const { columns } = useWorkOrderStoringItemColumns(
  {
    onEdit: handleEditItem,
    onDelete: handleDeleteItem,
    onPrintLabel: handlePrintLabel
  },
  {
    UButton,
    UDropdownMenu
  },
  partsRef,
  props.mode,
  isEditable,
  woStatusId,
  woCategory,
  refDocId
)

// submit
function onError(err: any) {
  const errors = err?.errors || []

  const hasItemError = errors.some(
    (e: any) => e.name === 'items'
  )

  if (hasItemError) {
    toastError('Please add at least one item before submitting.')
  } else {
    toastError(errors[0]?.message || 'Please check the form.')
  }
}

function submitForm() {
  formRef.value?.submit()
}

function handleSubmit(type: 'draft' | 'submit') {
  submitType.value = type
  submitForm()
}

function onSubmit(event: FormSubmitEvent<any>) {
  if (!state.items.length) {
    toastError('Please add at least one item before submitting.')
    return
  }

  const { take_out_purpose, ref_source, production_wo_id, ref_doc_id, ref_doc_number, ref_doc_name, station_id, ...formData } = event.data
  const isDeliveryOrder = ref_source === 'delivery_order'
  const isProductionWo = state.take_out_purpose === 'production' && !!production_wo_id
  const isBuffer = state.take_out_purpose === 'buffer' && !!station_id

  const payload = {
    ...formData,

    // Placement Delivery Order
    ...(isDeliveryOrder ? { ref_doc_id } : {}),

    // Take Out Production
    ...(isProductionWo ? { take_out_purpose, production_wo_id, station_id } : {}),

    // Take Out Buffer
    ...(isBuffer ? { take_out_purpose, station_id } : {}),

    ...(!isDeliveryOrder && !isProductionWo && !isBuffer ? { ref_doc_number, ref_doc_name } : {}),
    wo_status_id: submitType.value === 'draft' ? 1 : 2
  }

  emit('save', payload)
}
</script>

<template>
  <div class="space-y-6">
    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      class="grid grid-cols-1 md:grid-cols-3 gap-4"
      @submit="onSubmit"
      @error="onError"
    >
      <UFormField
        label="Work Order Number"
        name="wo_number"
        class="md:col-span-3"
        help="Generated automatically by the system after saving"
      >
        <UInput :model-value="props.workOrder?.wo_number" disabled class="w-full" />
      </UFormField>

      <UFormField label="Work Order Category" name="wo_category" required>
        <URadioGroup
          v-model="state.wo_category"
          orientation="horizontal"
          variant="list"
          :disabled="props.mode === 'edit'"
          :items="categoryItems"
        />
      </UFormField>

      <UFormField label="Work Order Date" name="wo_date" required>
        <UInputDate v-model="dateModel" :disabled="!isEditable">
          <template #trailing>
            <UPopover>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-calendar"
                class="px-0"
                :disabled="!isEditable"
              />
              <template #content>
                <UCalendar
                  v-model="dateModel"
                  class="p-2"
                  :is-date-disabled="(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)

                    const current = new Date(
                      date.year,
                      date.month - 1,
                      date.day
                    )

                    current.setHours(0, 0, 0, 0)

                    return current < today
                  }"
                />
              </template>
            </UPopover>
          </template>
        </UInputDate>
      </UFormField>

      <UFormField label="Work Order Type" name="wo_type_id" required>
        <USelectMenu
          v-model="selectedType"
          :items="typeItems"
          placeholder="Select Work Order Type"
          class="w-full"
          :clear="isEditable"
          :disabled="props.mode === 'edit'"
        />
      </UFormField>

      <UFormField
        v-if="showReferenceSource"
        label="Reference Source"
        name="ref_source"
        required
        class="md:col-span-3"
      >
        <URadioGroup 
          v-model="state.ref_source" 
          orientation="horizontal" 
          variant="list"
          :disabled="props.mode === 'edit'"
          :items="[
            {
              label: 'Manual',
              value: 'manual'
            },
            {
              label: 'Delivery Order',
              value: 'delivery_order'
            }
          ]"
        />
      </UFormField>

      <UFormField
        v-if="showTakeOutPurpose"
        label="Take Out Purpose"
        name="take_out_purpose"
        required
        class="md:col-span-3"
      >
        <URadioGroup
          v-model="state.take_out_purpose"
          orientation="horizontal"
          variant="list"
          :disabled="props.mode === 'edit'"
          :items="[
            {
              label: 'Supply Production',
              value: 'production'
            },
            {
              label: 'Supply Buffer',
              value: 'buffer'
            }
          ]"
        />
      </UFormField>

      <div class="md:col-span-3 grid md:grid-cols-2 gap-4">
        <UFormField label="Delivery Order" :required="showReferenceSource && state.ref_source === 'delivery_order'">
          <USelectMenu
            v-if="isEditable"
            v-model="selectedRefDoc"
            :items="refDocItems"
            option-attribute="label"
            placeholder="Select Delivery Order"
            class="w-full"
            :clear="isEditable"
            :disabled="!isEditable || !showReferenceSource || state.ref_source !== 'delivery_order'"
          />

          <UInput
            v-else
            :model-value="selectedRefDoc?.label || '-'"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField label="Work Order Production" :required="showTakeOutPurpose && state.take_out_purpose === 'production'">
          <USelectMenu
            v-if="isEditable"
            v-model="selectedProductionWO"
            :items="productionWOItems"
            option-attribute="label"
            placeholder="Select Work Order Production"
            class="w-full"
            :clear="isEditable"
            :disabled="!isEditable || !showTakeOutPurpose || state.take_out_purpose !== 'production'"
          />

          <UInput
            v-else
            :model-value="selectedProductionWO?.label || '-'"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField label="Reff Doc Number">
          <UInput
            :model-value="displayRefDocNumber"
            placeholder="e.g. DO-2024-001"
            class="w-full"
            :disabled="!isEditable || (showReferenceSource && state.ref_source === 'delivery_order') || (showTakeOutPurpose && state.take_out_purpose === 'production')"
            @update:model-value="val => state.ref_doc_number = val"
          />
        </UFormField>

        <UFormField label="Reff Doc Name">
          <UInput
            :model-value="displayRefDocName"
            placeholder="e.g. Delivery Order"
            class="w-full"
            :disabled="!isEditable || (showReferenceSource && state.ref_source === 'delivery_order') || (showTakeOutPurpose && state.take_out_purpose === 'production')"
            @update:model-value="val => state.ref_doc_name = val"
          />
        </UFormField>
      </div>

      <UFormField
        label="Station"
        name="station_id"
        class="md:col-span-3"
        :required="showTakeOutPurpose"
      >
        <USelectMenu
          v-if="isEditable"
          v-model="selectedStation"
          :items="stationItems"
          option-attribute="label"
          placeholder="Select Station"
          class="w-full"
          :disabled="
            !isEditable || 
            (
              state.take_out_purpose === 'production'
              && !state.production_wo_id
            )
          "
          :clear="isEditable"
        />

        <UInput
          v-else
          :model-value="selectedStation?.label || '-'"
          disabled
          class="w-full"
        />
      </UFormField>

      <UCard v-if="isEditable && stationInfo" class="md:col-span-3">
        <template #header>
          <div class="font-semibold">
            Station Information
          </div>
        </template>

        <UTable
          v-if="state.take_out_purpose === 'production'"
          :data="stationInfo.materials"
          :columns="[
            { accessorKey: 'part_number', header: 'Part Number' },
            { accessorKey: 'part_name', header: 'Part Name' },
            {
              accessorKey: 'qty_per_kanban',
              header: 'Qty/Kanban',
              cell: ({ row }) => `${row.original.qty_per_kanban} ${row.original.uom?.code ?? ''}`
            },
            {
              accessorKey: 'required_qty',
              header: 'Required',
              cell: ({ row }) => `${row.original.required_qty} ${row.original.uom?.code ?? ''}`
            },
            {
              accessorKey: 'supplied_qty',
              header: 'Supplied',
              cell: ({ row }) => `${row.original.supplied_qty} ${row.original.uom?.code ?? ''}`
            },
            {
              accessorKey: 'remaining_qty',
              header: 'Remaining',
              cell: ({ row }) => `${row.original.remaining_qty} ${row.original.uom?.code ?? ''}`
            },
            {
              accessorKey: 'buffer_stock',
              header: 'Buffer Stock',
              cell: ({ row }) => `${row.original.buffer_stock} ${row.original.uom?.code ?? ''}`
            },
            {
              accessorKey: 'max_kanban',
              header: 'Recommended Kanban',
              cell: ({ row }) => `${row.original.max_kanban} Kanban`
            },
            {
              accessorKey: 'areas',
              header: 'Available Areas',
              cell: ({ row }) => row.original.areas
                ?.map(
                  area => `${area.area_code} (${area.available_stock})`
                )
                .join(', ') || '-'
            }
          ]"
        />

        <UTable
          v-else
          :data="stationInfo.materials"
          :columns="[
            { accessorKey: 'part_number', header: 'Part Number' },
            { accessorKey: 'part_name', header: 'Part Name' },
            { 
              accessorKey: 'current_buffer_stock', 
              header: 'Current Buffer',
              cell: ({ row }) => `${row.original.current_buffer_stock} ${row.original.uom?.code ?? ''}`
            },
            { 
              accessorKey: 'min_buffer_stock', 
              header: 'Min Buffer',
              cell: ({ row }) => `${row.original.min_buffer_stock} ${row.original.uom?.code ?? ''}`
            },
            { 
              accessorKey: 'refill_qty', 
              header: 'Refill Qty',
              cell: ({ row }) => `${row.original.refill_qty} ${row.original.uom?.code ?? ''}`
            },
            { 
              accessorKey: 'qty_per_kanban', 
              header: 'Qty/Kanban',
              cell: ({ row }) => `${row.original.qty_per_kanban} ${row.original.uom?.code ?? ''}`
            },
            {
              accessorKey: 'areas',
              header: 'Available Areas',
              cell: ({ row }) => row.original.areas
                ?.map(
                  area => `${area.area_code} (${area.available_stock})`
                )
                .join(', ') || '-'
            }
          ]"
        />
      </UCard>
      
      <UFormField
        label="Warehouse Area"
        name="warehouse_area_id"
        class="md:col-span-3"
        required
      >
        <USelectMenu
          v-model="selectedArea"
          :items="areaItems"
          option-attribute="label"
          placeholder="Select Warehouse Area"
          class="w-full"
          :disabled="
            !state.wo_type_id || 
            !isEditable ||
            (
              state.wo_category === 'Take Out' && state.wo_type_id === 1 &&
              (
                (state.take_out_purpose === 'production' && !state.station_id) ||
                (state.take_out_purpose === 'buffer' && !state.station_id)
              )
            )
          "
          :clear="isEditable"
        />
      </UFormField>

      <UFormField label="Description" class="md:col-span-3">
        <UInput
          :model-value="displayDescription"
          placeholder="Enter additional notes or description..."
          class="w-full"
          :disabled="!isEditable"
          @update:model-value="val => state.wo_description = val"
        />
      </UFormField>
    </UForm>

    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold">
          Items
        </h3>
        <UButton v-if="isEditable" label="Add Item" @click="openItemModal" />
      </div>

      <UTable
        :data="state.items"
        :columns="columns"
      />
    </div>

    <div v-if="isEditable" class="flex justify-end gap-2">
      <UButton
        color="neutral"
        variant="outline"
        :loading="loading"
        :disabled="!isEditable"
        @click="handleSubmit('draft')"
      >
        Save as Draft
      </UButton>

      <UButton
        color="primary"
        :loading="loading"
        :disabled="!isEditable"
        @click="handleSubmit('submit')"
      >
        Submit
      </UButton>
    </div>

    <WorkOrderStoringItemFormModal
      v-model:open="isItemModalOpen"
      :mode="itemModalMode"
      :parts="parts"
      :loading="loading"
      :part-disabled="!isEditable || !state.wo_type_id || (state.wo_category === 'Take Out' && !state.warehouse_area_id) || (state.ref_source === 'delivery_order' && !state.ref_doc_id)"
      :kanban-disabled="!isEditable"
      :show-max-kanban-field="state.wo_category === 'Take Out' && state.wo_type_id === 1 && state.take_out_purpose === 'production'"
      :show-stock-field="state.wo_category === 'Take Out' && state.ref_source !== 'delivery_order'"
      :show-remaining-qty-field="state.ref_source === 'delivery_order'"
      :item="selectedItemIndex !== null ? state.items[selectedItemIndex] : null"
      @save="handleAddItem"
    />
  </div>
</template>