<script setup lang="ts">
import {
  reactive,
  watch,
  ref
} from 'vue'

import * as z from 'zod'

import type {
  FormSubmitEvent
} from '@nuxt/ui'

import type {
  QualityCheckingLabel
} from '../../../../types/warehouse/material-receiving'

const formRef = ref()

const props = defineProps<{
  open: boolean
  loading: boolean

  label:
    QualityCheckingLabel | null

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
    data: {
      defects: {
        defect_id: number
        image?: string | null
      }[]
    }
  ]
}>()

const state = reactive({
  defects: [
    {
      defect_id:
        undefined as
          | number
          | undefined,

      image:
        null as
          | string
          | null
    }
  ]
})

const schema = z.object({
  defects: z
    .array(
      z.object({
        defect_id: z.number().optional().refine(
          (value) => value !== undefined,
          {
            message:
              'Defect is required'
          }
        ),

        image: z
          .string()
          .nullable()
          .optional()
      })
    )

    .min(1, {
      message:
        'At least one defect is required'
    })
})

watch(
  () => props.open,

  (isOpen) => {
    if (isOpen) {
      state.defects = [
        {
          defect_id:
            undefined,

          image: null
        }
      ]
    }
  }
)

function addDefectRow() {
  state.defects.push({
    defect_id:
      undefined,

    image: null
  })
}

function removeDefectRow(
  index: number
) {
  if (
    state.defects.length <= 1
  ) {
    return
  }

  state.defects.splice(
    index,
    1
  )
}

function handleFileUpload(
  event: Event,
  index: number
) {
  const target =
    event.target as HTMLInputElement

  const file =
    target.files?.[0]

  if (!file) {
    return
  }

  // temporary local preview
  state.defects[index].image =
    URL.createObjectURL(file)
}

function submitForm() {
  formRef.value?.submit()
}

function onSubmit(
  event: FormSubmitEvent<any>
) {
  emit(
    'save',
    event.data
  )

  emit(
    'update:open',
    false
  )
}

function close() {
  emit(
    'update:open',
    false
  )
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Mark Quality Defect"
    description="Add quality defects for this scanned label"
    @update:open="
      emit(
        'update:open',
        $event
      )
    "
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Label Number"
        >
          <UInput
            :model-value="
              props.label
                ?.label_number ||
                '-'
            "

            disabled

            class="w-full"
          />
        </UFormField>

        <div class="space-y-4">
          <div
            class="flex items-center justify-between"
          >
            <div
              class="text-sm font-medium"
            >
              Defects
            </div>

            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              label="Add Defect"
              @click="
                addDefectRow
              "
            />
          </div>

          <div
            v-for="(
              defect,
              index
            ) in state.defects"

            :key="index"

            class="border rounded-xl p-4 space-y-4"
          >
            <div
              class="flex items-start gap-3"
            >
              <div class="flex-1">
                <UFormField
                  :name="`defects.${index}.defect_id`"
                  label="Defect"
                  required
                >
                  <USelectMenu
                    v-model="
                      defect.defect_id
                    "

                    value-key="id"

                    label-key="name"

                    :items="
                      props.defects
                    "

                    placeholder="Select Defect"

                    class="w-full"
                  />
                </UFormField>
              </div>

              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"

                :disabled="
                  state.defects
                    .length <= 1
                "

                @click="
                  removeDefectRow(
                    index
                  )
                "
              />
            </div>

            <UFormField
              label="Defect Image"
            >
              <div
                class="space-y-3"
              >
                <input
                  type="file"
                  accept="image/*"

                  @change="
                    handleFileUpload(
                      $event,
                      index
                    )
                  "
                >

                <img
                  v-if="
                    defect.image
                  "

                  :src="
                    defect.image
                  "

                  alt="Defect Preview"

                  class="w-32 h-32 object-cover rounded-lg border"
                >
              </div>
            </UFormField>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div
        class="flex justify-end gap-2 w-full"
      >
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

          :loading="
            props.loading
          "

          @click="
            submitForm
          "
        />
      </div>
    </template>
  </UModal>
</template>