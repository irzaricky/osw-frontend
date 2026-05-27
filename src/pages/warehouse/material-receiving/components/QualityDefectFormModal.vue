<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { QualityCheckingLabel } from '../../../../types/warehouse/material-receiving'

const props = defineProps<{
  open: boolean
  loading: boolean
  label: QualityCheckingLabel | null
  defects: {
    id: number
    name: string
  }[]
}>()

const emit = defineEmits<{
  'update:open': [
    value: boolean
  ]
  save: [
    data: FormData
  ]
}>()

type DefectForm = {
  defect_id: number | undefined
  file: File | null
}

const state = reactive({
  defects: [
    {
      defect_id: undefined,
      file: null
    } as DefectForm
  ]
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      state.defects = [
        {
          defect_id: undefined,
          file: null
        }
      ]
    }
  }
)

function addDefectRow() {
  state.defects.push(
    {
      defect_id: undefined,
      file: null
    }
  )
}

function removeDefectRow(
  index: number
) {
  if (state.defects.length <= 1) {
    return
  }
  state.defects.splice(
    index, 1
  )
}

function setFile(
  value: File | File[] | null | undefined,
  index: number
) {
  const file = Array.isArray(value) ? value[0] : value
  state.defects[index].file = file || null
}



function onSubmit(event: Event) {
  event.preventDefault()
  const formData = new FormData()
  const defectsPayload = state.defects.map(defect => ({
    defect_id: defect.defect_id
  }))
  formData.append('defects', JSON.stringify(defectsPayload))
  state.defects.forEach((defect) => {
    if (defect.file) {
      formData.append('files[]', defect.file)
    }
  })
  emit('save', formData)
  emit('update:open', false)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Mark Quality Defect"
    description="Add quality defects for this scanned label"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Label Number">
          <UInput :model-value=" props.label?.label_number || '-'" disabled class="w-full" />
        </UFormField>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">
              Defects
            </div>

            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              label="Add Defect"
              @click="addDefectRow"
            />
          </div>

          <div v-for="(defect, index) in state.defects" :key="index" class="border rounded-xl p-4 space-y-4">
            <div class="flex items-start gap-3">
              <div class="flex-1">
                <UFormField :name="`defects.${index}.defect_id`" label="Defect" required>
                  <USelectMenu
                    v-model="defect.defect_id"
                    value-key="id"
                    label-key="name"
                    :items="props.defects"
                    placeholder="Select Defect"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :disabled="state.defects.length <= 1"
                @click="removeDefectRow(index)"
              />
            </div>

            <UFormField label="Defect Image">
              <div class="space-y-3">
                <UFileUpload
                  :model-value="defect.file"
                  @update:model-value="value => setFile(value, index)"
                  accept="image/*"
                  :multiple="false"
                  class="w-full"
                />
              </div>
            </UFormField>
          </div>
        </div>
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
          color="error"
          icon="i-lucide-shield-alert"
          label="Submit Defect"
          :loading="props.loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>