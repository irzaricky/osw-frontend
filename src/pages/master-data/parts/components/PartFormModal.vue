<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { Parts } from '../../../../types/master-data/parts'
import type { SupplierDropdown } from '../../../../types/master-data/suppliers'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  part: Partial<Parts>
  suppliers: SupplierDropdown[]
  partTypes: { code: string; name: string }[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: Partial<Parts>): void
}>()

const localPart = reactive<Partial<Parts>>({
  part_number: '',
  part_name: '',
  part_type_code: '',
  part_category: '',
  supplier_id: undefined,
  price: 0,
  safety_stock: 0,
  lead_time_days: 0,
  model_name: '',
  model_code: '',
  generation: '',
  color: '',
  color_code: '',
  uom: '',
  package_name: '',
  package_code: ''
})

watch(
  () => props.part,
  (newVal) => {
    Object.assign(localPart, {
      part_number: newVal.part_number || '',
      part_name: newVal.part_name || '',
      part_type_code: newVal.part_type_code || '',
      part_category: newVal.part_category || '',
      supplier_id: newVal.supplier_id ?? undefined,
      price: newVal.price ?? 0,
      safety_stock: newVal.safety_stock ?? 0,
      lead_time_days: newVal.lead_time_days ?? 0,
      model_name: newVal.model_name || '',
      model_code: newVal.model_code || '',
      generation: newVal.generation || '',
      color: newVal.color || '',
      color_code: newVal.color_code || '',
      uom: newVal.uom || '',
      package_name: newVal.package_name || '',
      package_code: newVal.package_code || ''
    })
  },
  { deep: true, immediate: true }
)

// Supplier select
const supplierItems = computed(() => [
  props.suppliers.map(s => s.name)
])

const selectedSupplier = computed({
  get() {
    if (localPart.supplier_id == null) return undefined
    return props.suppliers.find(s => s.id === localPart.supplier_id)?.name
  },
  set(value: string | undefined) {
    if (!value) {
      localPart.supplier_id = undefined
      return
    }
    const found = props.suppliers.find(s => s.name === value)
    localPart.supplier_id = found?.id
  }
})

// Part type select
const partTypeItems = computed(() => [
  props.partTypes.map(t => t.name)
])

const selectedPartType = computed({
  get() {
    if (!localPart.part_type_code) return undefined
    return props.partTypes.find(t => t.code === localPart.part_type_code)?.name
  },
  set(value: string | undefined) {
    if (!value) {
      localPart.part_type_code = ''
      return
    }
    const found = props.partTypes.find(t => t.name === value)
    localPart.part_type_code = found?.code || ''
  }
})

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

        <!-- Row 2: Type & Category -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Part Type" required>
            <USelectMenu
              v-model="selectedPartType"
              :items="partTypeItems"
              placeholder="Select type"
              class="w-full"
              clear
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Category" required>
            <UInput
              v-model="localPart.part_category"
              placeholder="e.g. Mechanical"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Row 3: Supplier -->
        <UFormField label="Supplier" required>
          <USelectMenu
            v-model="selectedSupplier"
            :items="supplierItems"
            placeholder="Select supplier"
            class="w-full"
            clear
            :disabled="loading"
          />
        </UFormField>

        <!-- Row 4: Price, Safety Stock, Lead Time -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Price" required>
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

        <!-- Row 5: Model Name, Model Code, Generation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Model Name" required>
            <UInput
              v-model="localPart.model_name"
              placeholder="e.g. Avanza"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Model Code">
            <UInput
              v-model="localPart.model_code"
              placeholder="e.g. AVZ"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Generation" required>
            <UInput
              v-model="localPart.generation"
              placeholder="e.g. Gen 2"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Row 6: Color, Color Code -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Color" required>
            <UInput
              v-model="localPart.color"
              placeholder="e.g. White"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Color Code">
            <UInput
              v-model="localPart.color_code"
              placeholder="e.g. #FFFFFF"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Row 7: UOM, Package Name, Package Code -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="UOM" required>
            <UInput
              v-model="localPart.uom"
              placeholder="e.g. PCS"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Package Name" required>
            <UInput
              v-model="localPart.package_name"
              placeholder="e.g. Box"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField label="Package Code">
            <UInput
              v-model="localPart.package_code"
              placeholder="e.g. BX"
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