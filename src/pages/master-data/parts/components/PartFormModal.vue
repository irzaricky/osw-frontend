<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { Parts } from '../../../../types/master-data/parts'
import type { SupplierDropdown } from '../../../../types/master-data/suppliers'
import type { UomDropdownItem } from '../../../../types/master-data/uom'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  part: Partial<Parts>
  suppliers: SupplierDropdown[]
  partTypes: { code: string; name: string }[]
  // partCategories: { id: number; code: string; name: string }[]
  uoms: UomDropdownItem[]
  packages: { id: number; package_code: string; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: Partial<Parts>): void
}>()

// Local form state
const localPart = reactive<Partial<Parts>>({
  part_number:      '',
  part_name:        '',
  part_type_code:   '',
  part_category: '',
  supplier_id:      undefined,
  uom_id:           undefined,
  package_id:       undefined,
  price:            undefined,
  safety_stock:     0,
  lead_time_days:   0,
  model_name:       '',
  model_code:       '',
  generation:       '',
  color:            '',
  color_code:       '',
  min_qty_sell:     10,
})

watch(
  () => props.part,
  (newVal) => {
    Object.assign(localPart, {
      part_number:      newVal.part_number      || '',
      part_name:        newVal.part_name        || '',
      // Response API kadang kirim via relasi 'type', fallback ke part_type_code langsung
      part_type_code:   newVal.part_type_code   || (newVal as any).type?.code || '',
      part_category: newVal.part_category || '',
      supplier_id:      newVal.supplier_id      ?? undefined,
      uom_id:           newVal.uom_id           ?? undefined,
      package_id:       newVal.package_id       ?? undefined,
      price:            newVal.price            ?? undefined,
      safety_stock:     newVal.safety_stock     ?? 0,
      lead_time_days:   newVal.lead_time_days   ?? 0,
      model_name:       newVal.model_name       || '',
      model_code:       newVal.model_code       || '',
      generation:       newVal.generation       || '',
      color:            newVal.color            || '',
      color_code:       newVal.color_code       || '',
      min_qty_sell:     newVal.min_qty_sell     ?? 10,
    })
  },
  { deep: true, immediate: true }
)

// Computed: Part Type select
const partTypeItems = computed(() => props.partTypes.map(t => t.name))

const selectedPartType = computed({
  get() {
    return props.partTypes.find(t => t.code === localPart.part_type_code)?.name
  },
  set(value: string | undefined) {
    localPart.part_type_code = value
      ? (props.partTypes.find(t => t.name === value)?.code || '')
      : ''
  }
})

// Computed: Part Category select
// const partCategoryItems = computed(() => props.partCategories.map(c => c.name))

// const selectedPartCategory = computed({
//   get() {
//     return props.partCategories.find(c => c.id === localPart.part_category_id)?.name
//   },
//   set(value: string | undefined) {
//     localPart.part_category_id = value
//       ? props.partCategories.find(c => c.name === value)?.id
//       : undefined
//   }
// })

const supplierItems = computed(() => props.suppliers.map(s => s.name))

const selectedSupplier = computed({
  get() {
    return props.suppliers.find(s => s.id === localPart.supplier_id)?.name
  },
  set(value: string | undefined) {
    localPart.supplier_id = value
      ? props.suppliers.find(s => s.name === value)?.id
      : undefined
  }
})

const uomItems = computed(() => props.uoms.map(u => `${u.code} - ${u.name}`))

const selectedUom = computed({
  get() {
    const found = props.uoms.find(u => u.id === localPart.uom_id)
    return found ? `${found.code} - ${found.name}` : undefined
  },
  set(value: string | undefined) {
    if (!value) {
      localPart.uom_id = undefined
      return
    }
    const code = value.split(' - ')[0]
    localPart.uom_id = props.uoms.find(u => u.code === code)?.id
  }
})

const packageItems = computed(() => props.packages.map(p => `${p.package_code} - ${p.name}`))

const selectedPackage = computed({
  get() {
    const found = props.packages.find(p => p.id === localPart.package_id)
    return found ? `${found.package_code} - ${found.name}` : undefined
  },
  set(value: string | undefined) {
    if (!value) {
      localPart.package_id = undefined
      return
    }
    const code = value.split(' - ')[0]
    localPart.package_id = props.packages.find(p => p.package_code === code)?.id
  }
})

// Actions
function handleSubmit() {
  emit('save', { ...localPart })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Part' : 'Edit Part'"
    :description="mode === 'add' ? 'Add a new part to the system.' : 'Update part details.'"
    :ui="{ content: 'sm:max-w-[700px]' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="part-form" class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Row 1: Part Number & Part Name -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Part Number" required>
            <UInput
              v-model="localPart.part_number"
              placeholder="e.g. PN-001"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Part Name" required>
            <UInput
              v-model="localPart.part_name"
              placeholder="e.g. Brake Pad"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Row 2: Part Type & Category -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Part Type" required>
            <USelectMenu
              v-model="selectedPartType"
              :items="partTypeItems"
              placeholder="Select part type"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Category">
            <UInput
              v-model="localPart.part_category"
              placeholder="e.g. BIG, MEDIUM"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Row 3: Supplier (optional) -->
        <UFormField label="Supplier">
          <USelectMenu
            v-model="selectedSupplier"
            :items="supplierItems"
            placeholder="Select supplier (optional)"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <!-- Row 4: Price, Safety Stock, Lead Time -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Price">
            <UInput
              v-model.number="localPart.price"
              type="number"
              placeholder="0"
              class="w-full"
              :disabled="loading"
              :min="0"
            />
          </UFormField>

          <UFormField label="Safety Stock" required>
            <UInput
              v-model.number="localPart.safety_stock"
              type="number"
              placeholder="0"
              class="w-full"
              :disabled="loading"
              :min="0"
            />
          </UFormField>

          <UFormField label="Lead Time (Days)" required>
            <UInput
              v-model.number="localPart.lead_time_days"
              type="number"
              placeholder="0"
              class="w-full"
              :disabled="loading"
              :min="0"
            />
          </UFormField>
        </div>

        <!-- Row 5: UOM, Package & Min Qty Sell -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="UOM" required>
            <USelectMenu
              v-model="selectedUom"
              :items="uomItems"
              placeholder="Select UOM"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Package">
            <USelectMenu
              v-model="selectedPackage"
              :items="packageItems"
              placeholder="Select package (optional)"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Min Qty Sell" required>
            <UInput
              v-model.number="localPart.min_qty_sell"
              type="number"
              placeholder="10"
              class="w-full"
              :disabled="loading"
              :min="0"
            />
          </UFormField>
        </div>

        <!-- Row 6: Model Name, Model Code, Generation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Model Name">
            <UInput
              v-model="localPart.model_name"
              placeholder="e.g. VOLT"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Model Code">
            <UInput
              v-model="localPart.model_code"
              placeholder="e.g. VO"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Generation">
            <UInput
              v-model="localPart.generation"
              placeholder="e.g. 2025"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Row 7: Color & Color Code -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Color">
            <UInput
              v-model="localPart.color"
              placeholder="e.g. STALLION BLACK"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Color Code">
            <UInput
              v-model="localPart.color_code"
              placeholder="e.g. BKME"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="handleClose"
        />
        <UButton
          type="submit"
          form="part-form"
          label="Save"
          color="primary"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>