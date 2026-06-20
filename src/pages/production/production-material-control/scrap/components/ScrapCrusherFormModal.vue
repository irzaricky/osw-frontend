<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import DatePicker from '../../../../../components/home/DatePicker.vue'

type ProductionResult = {
  id: number
  part_id: number
  product_part_number: string
  station_name: string
}

type ReplacementMaterial = {
  replacement_id: number

  material_part_id: number
  part_number: string
  part_name: string

  qty_replacement: number

  weight_per_pcs?: number

  ng_source_label_number?: string

  replacement_labels?: {
    id: number
    pcs_label_number: string
  }[]
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  productionResults: ProductionResult[]
  replacementMaterials: ReplacementMaterial[]
  replacementLoading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  selectProductionResult: [id: number]
  save: [data: any]
}>()

const form = reactive({
  production_result_id: undefined as number | undefined,
  replacement_id: undefined as number | undefined,
  scrap_date: undefined as Date | undefined,
  part_id: undefined as number | undefined,
  material_part_id: undefined as number | undefined,
  qty_scrap: 1,
  weight_per_pcs: 0,
  remarks: ''
})

const productionItems = computed(() =>
  props.productionResults.map(item => ({
    label: `${item.product_part_number} - ${item.station_name}`,
    value: item.id
  }))
)

const materialItems = computed(() =>
  props.replacementMaterials.map(item => ({
    label:
      `${item.part_number} - ${item.part_name} | ` +
      `NG ${item.ng_source_label_number || '-'} | ` +
      `${item.qty_replacement} PCS`,
    value: item.replacement_id
  }))
)

const selectedReplacement = computed(() =>
  props.replacementMaterials.find(
    item => item.replacement_id === form.replacement_id
  )
)

const maxScrapQty = computed(() =>
  Number(selectedReplacement.value?.qty_replacement || 0)
)

const totalWeight = computed(() =>
  Number(form.qty_scrap || 0) * Number(form.weight_per_pcs || 0)
)

const isQtyInvalid = computed(() =>
  !!form.material_part_id && Number(form.qty_scrap || 0) > maxScrapQty.value
)

const isFormInvalid = computed(() =>
  !form.production_result_id ||
  !form.scrap_date ||
  !form.part_id ||
  !form.material_part_id ||
  !form.qty_scrap ||
  isQtyInvalid.value
)

watch(() => props.open, open => {
  if (!open) return

  form.production_result_id = undefined
  form.scrap_date = new Date()
  form.part_id = undefined
  form.material_part_id = undefined
  form.qty_scrap = 1
  form.weight_per_pcs = 0
  form.remarks = ''
})

watch(() => form.production_result_id, id => {
  const found = props.productionResults.find(item => item.id === id)

  form.part_id = found?.part_id
  form.material_part_id = undefined
  form.weight_per_pcs = 0

  if (found) {
    emit('selectProductionResult', found.id)
  }
})


watch(() => form.replacement_id, id => {
  const found = props.replacementMaterials.find(
    item => item.replacement_id === id
  )

  if (!found) {
    form.material_part_id = undefined
    form.qty_scrap = 1
    form.weight_per_pcs = 0
    return
  }

  form.material_part_id = found.material_part_id
  form.qty_scrap = Number(found.qty_replacement || 0)
  form.weight_per_pcs = Number(found.weight_per_pcs || 0)
})

function close() {
  emit('update:open', false)
}

function formatDate(date?: Date) {
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function handleSave() {
  if (isFormInvalid.value) return

  emit('save', {
    production_result_id: form.production_result_id,
    replacement_id: form.replacement_id,
    scrap_date: formatDate(form.scrap_date),
    part_id: form.part_id,
    material_part_id: form.material_part_id,
    qty_scrap: Number(form.qty_scrap),
    remarks: form.remarks || null,
  })
}

</script>

<template>
  <UModal :open="open" title="Add Scrap / Crusher" description="Record damaged material and calculate crusher weight."
    @update:open="emit('update:open', $event)">
    <template #body>
      <form class="space-y-5" @submit.prevent="handleSave">
        <UFormField label="Production Result" required>
          <USelectMenu v-model="form.production_result_id" :items="productionItems" value-key="value" label-key="label"
            placeholder="Select production result" searchable clear class="w-full" />
        </UFormField>

        <UFormField label="Scrap Date" required>
          <DatePicker v-model="form.scrap_date" placeholder="Select scrap date" />
        </UFormField>

        <UFormField label="Replacement Material" required>
          <USelectMenu v-model="form.material_part_id" :items="materialItems" value-key="value" label-key="label"
            :loading="replacementLoading" placeholder="Select replacement material" searchable clear class="w-full"
            :disabled="!form.production_result_id" />
        </UFormField>

        <div v-if="selectedReplacement" class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          <p>
            <b>NG Label:</b>
            {{ selectedReplacement.ng_source_label_number || '-' }}
          </p>

          <p>
            <b>Replacement Qty:</b>
            {{ selectedReplacement.qty_replacement }} PCS
          </p>

          <div v-if="selectedReplacement.replacement_labels?.length" class="mt-2 flex flex-wrap gap-2">
            <UBadge v-for="label in selectedReplacement.replacement_labels" :key="label.id" color="primary"
              variant="soft">
              {{ label.pcs_label_number }}
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormField label="Qty Scrap (PCS)" required>
            <UInput :model-value="form.qty_scrap" type="number" readonly disabled class="w-full" />
          </UFormField>

          <UFormField label="Weight / PCS">
            <UInput :model-value="Number(form.weight_per_pcs || 0).toFixed(2)" type="number" readonly disabled
              class="w-full" />
          </UFormField>

          <UFormField label="Total Weight">
            <UInput :model-value="totalWeight.toFixed(2)" readonly disabled class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Remarks">
          <UTextarea v-model="form.remarks" placeholder="e.g. Material damaged and crushed" class="w-full" :rows="3" />
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