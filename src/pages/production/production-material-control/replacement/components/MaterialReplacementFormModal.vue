<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

type ProductionResult = {
  id: number
  part_id: number
  station_id: number
  product_part_number: string
  station_name: string
}

type NgMaterial = {
  ng_detail_id?: number
  production_result_id: number
  station_id: number
  material_part_id: number
  part_number: string
  part_name: string
  qty_replacement: number
  replacement_reason?: string | null
  weight_per_pcs?: number
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  productionResults: ProductionResult[]
  bomMaterials: NgMaterial[]
  bomLoading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  selectProductionResult: [productionResultId: number]
  save: [data: any]
}>()

const form = reactive({
  production_result_id: undefined as number | undefined,
  station_id: undefined as number | undefined,
  material_part_id: undefined as number | undefined,
  qty_replacement: 1,
  replacement_reason: ''
})

const productionItems = computed(() =>
  props.productionResults.map(item => ({
    label: `${item.product_part_number} - ${item.station_name}`,
    value: item.id
  }))
)

const materialItems = computed(() =>
  props.bomMaterials.map(item => ({
    label: `${item.part_number} - ${item.part_name} (${item.qty_replacement} PCS NG)`,
    value: item.material_part_id
  }))
)

const selectedProduction = computed(() =>
  props.productionResults.find(item => item.id === form.production_result_id)
)

const selectedMaterial = computed(() =>
  props.bomMaterials.find(item => item.material_part_id === form.material_part_id)
)

const isFormInvalid = computed(() =>
  !form.production_result_id ||
  !form.station_id ||
  !form.material_part_id ||
  !form.qty_replacement ||
  Number(form.qty_replacement) <= 0
)

watch(() => props.open, open => {
  if (!open) return

  form.production_result_id = undefined
  form.station_id = undefined
  form.material_part_id = undefined
  form.qty_replacement = 1
  form.replacement_reason = ''
})

watch(() => form.production_result_id, id => {
  const found = props.productionResults.find(item => item.id === id)

  form.station_id = found?.station_id
  form.material_part_id = undefined
  form.qty_replacement = 1
  form.replacement_reason = ''

  if (id) {
    emit('selectProductionResult', id)
  }
})

watch(() => form.material_part_id, id => {
  const found = props.bomMaterials.find(item => item.material_part_id === id)

  if (!found) {
    form.qty_replacement = 1
    form.replacement_reason = ''
    return
  }

  form.qty_replacement = Number(found.qty_replacement || 1)
  form.replacement_reason = found.replacement_reason || ''
})

function close() {
  emit('update:open', false)
}

function handleSave() {
  if (isFormInvalid.value) return

  emit('save', {
    production_result_id: form.production_result_id,
    station_id: form.station_id,
    material_part_id: form.material_part_id,
    qty_replacement: Number(form.qty_replacement),
    replacement_reason: form.replacement_reason || null
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Add Material Replacement"
    description="Record replacement material taken from station buffer."
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form class="space-y-5" @submit.prevent="handleSave">
        <UFormField label="Production Result" required>
          <USelectMenu
            v-model="form.production_result_id"
            :items="productionItems"
            value-key="value"
            label-key="label"
            placeholder="Select production result"
            searchable
            clear
            class="w-full"
          />
        </UFormField>

        <UFormField label="Station">
          <UInput
            :model-value="selectedProduction?.station_name || '-'"
            readonly
            class="w-full"
          />
        </UFormField>

        <UFormField label="NG Material" required>
          <USelectMenu
            v-model="form.material_part_id"
            :items="materialItems"
            value-key="value"
            label-key="label"
            :loading="bomLoading"
            placeholder="Select NG material"
            searchable
            clear
            class="w-full"
            :disabled="!form.production_result_id"
          />
        </UFormField>

        <div
          v-if="selectedMaterial"
          class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"
        >
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-triangle-alert"
              class="mt-0.5 size-4 text-warning"
            />

            <div>
              <p class="font-medium text-warning">
                NG Material Detected
              </p>
              <p class="text-muted mt-1">
                {{ selectedMaterial.part_number }} - {{ selectedMaterial.part_name }}
              </p>
              <p class="text-muted mt-1">
                NG Qty:
                <b>{{ selectedMaterial.qty_replacement }}</b>
                PCS
              </p>
            </div>
          </div>
        </div>

        <UFormField label="Qty Replacement (PCS)" required>
          <UInput
            v-model.number="form.qty_replacement"
            type="number"
            min="1"
            :max="selectedMaterial?.qty_replacement || undefined"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Reason">
          <UTextarea
            v-model="form.replacement_reason"
            placeholder="e.g. Material rusak saat assembly"
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