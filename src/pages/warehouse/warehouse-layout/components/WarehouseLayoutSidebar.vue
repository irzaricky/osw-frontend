<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { WarehouseLayoutDetail, AreaLayout, AreaSpacing } from '../../../../types/warehouse/warehouse-layout'
import type { WarehouseAreaDropdown } from '../../../../types/master-data/warehouse-area'

const props = defineProps<{
  layout: WarehouseLayoutDetail
  panelMode: 'info' | 'add-area' | 'edit-area'
  warehouseAreas: WarehouseAreaDropdown[]
  isColliding: boolean
  areaLayoutDetail?: AreaLayout | null
}>()

const emit = defineEmits<{
  cancelAddArea: []
  previewChange: [data: { area_id: number; start_row: number; start_col: number, area_spacings: AreaSpacing[] } | null]
  save: [data: Partial<AreaLayout>]
  delete: [id: number]
}>()

// State
const state = reactive({
  area_id: undefined as number | undefined,
  start_row: 1,
  start_col: 1,
  area_spacings: [] as AreaSpacing[]
})

// Area items
const areaItems = computed(() =>
  props.warehouseAreas.map(
    area => `${area.area_code} - ${area.name}`
  )
)

const selectedArea = computed({
  get() {
    if (!state.area_id) return undefined

    const found = props.warehouseAreas.find(
      area => area.id === state.area_id
    )

    return found
      ? `${found.area_code} - ${found.name}`
      : undefined
  },

  set(value: string | undefined) {
    if (!value) {
      state.area_id = undefined
      return
    }

    const found = props.warehouseAreas.find(
      area =>
        `${area.area_code} - ${area.name}` === value
    )

    state.area_id = found?.id
  },
})

const selectedAreaData = computed(() =>
  props.warehouseAreas.find(
    area => area.id === state.area_id
  )
)

// Reser add form
watch(
  () => [
    props.panelMode, 
    props.areaLayoutDetail
  ],
  ( values ) => {
    const mode = values[0]
    const detail = values[1] as AreaLayout | undefined | null

    if (mode === 'add-area') {
      state.area_id = undefined
      state.start_row = 1
      state.start_col = 1
      state.area_spacings = []

      emit('previewChange', null)
    } else if (mode === 'edit-area' && detail) {
      state.area_id = detail.area_id
      state.start_row = detail.start_row
      state.start_col = detail.start_col
      state.area_spacings =
        detail
          .area_spacings
          ? JSON.parse(
            JSON.stringify(
              detail
                .area_spacings
            )
          )
          : []
    }
  },
  {
    immediate: true,
    deep: true,
  }
)

// Preview area
watch(
  () => ({
    area_id: state.area_id,
    start_row: state.start_row,
    start_col: state.start_col,
    area_spacings: state.area_spacings,
  }),
  (value) => {
    if (!value.area_id) {
      emit('previewChange', null)
      return
    }

    emit('previewChange', {
      area_id: value.area_id,
      start_row: value.start_row,
      start_col: value.start_col,
      area_spacings: value.area_spacings,
    })
  },
  {
    deep: true,
    immediate: true,
  }
)

// Handle col index
function getAvailableColumns(
  currentIndex: number
) {
  const maxCol =
    Math.max(
      (
        selectedAreaData
          .value
          ?.total_cols || 1
      ) - 1,
      1
    )

  const usedColumns =
    state.area_spacings
      .filter(
        (_, index) =>
          index !== currentIndex
      )
      .map(
        spacing =>
          spacing.col_index
      )

  return Array.from(
    { length: maxCol },
    (_, i) => i + 1
  ).filter(
    col =>
      !usedColumns.includes(
        col
      )
  )
}

// Add spacing
function addSpacing() {
  state.area_spacings.push({
    id: Date.now(),
    area_layout_id: 0,
    col_index: undefined as any,
    col_spacing: 1,
  })
}

// Remove spacing
function removeSpacing(index: number) {
  state.area_spacings.splice(
    index,
    1
  )
}

// Save
function saveArea() {
  if (!state.area_id) return

  emit('save', {
    area_id: state.area_id,
    start_row: state.start_row,
    start_col: state.start_col,
    area_spacings: state.area_spacings,
  })
}

// Delete
function deleteArea() {
  if (props.panelMode !== 'edit-area' || !props.areaLayoutDetail) {
    return
  }

  emit(
    'delete',
    props.areaLayoutDetail.id
  )
}
</script>

<template>
  <!-- INFO MODE -->
  <UCard v-if="panelMode === 'info'">
    <template #header>
      <div>
        <h3 class="font-semibold">
          Layout Information
        </h3>

        <p class="text-sm text-muted">
          Warehouse information and layout overview
        </p>
      </div>
    </template>

    <div class="space-y-5">
      <!-- WAREHOUSE NAME -->
      <div>
        <p class="text-sm text-muted">
          Warehouse Name
        </p>

        <p class="font-semibold">
          {{ layout.warehouse?.name || '-' }}
        </p>
      </div>

      <!-- WAREHOUSE CODE -->
      <div>
        <p class="text-sm text-muted">
          Warehouse Code
        </p>

        <p class="font-semibold">
          {{ layout.warehouse?.warehouse_code || '-' }}
        </p>
      </div>

      <!-- CATEGORY -->
      <div>
        <p class="text-sm text-muted">
          Warehouse Category
        </p>

        <p class="font-semibold">
          {{
            layout.warehouse?.category?.name ||
            '-'
          }}
        </p>
      </div>

      <!-- TOTAL AREA PLACED -->
      <div>
        <p class="text-sm text-muted">
          Total Area Placed
        </p>

        <p class="font-semibold">
          {{
            layout.area_layouts?.length || 0
          }}
        </p>
      </div>
    </div>
  </UCard>

  <!-- FORM -->
  <UCard v-else>
    <template #header>
      <div
        class="
          flex
          items-center
          justify-between
        "
      >
        <div>
          <h3 class="font-semibold">
            {{ panelMode === 'edit-area' ? 'Edit Area Layout' : 'Add Area Layout' }}
          </h3>

          <p class="text-sm text-muted">
            {{ panelMode === 'edit-area' ? 'Update warehouse area placement' : 'Place warehouse area into canvas' }}
          </p>
        </div>

        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          @click="emit('cancelAddArea')"
        />
      </div>
    </template>

    <div class="space-y-5">
      <!-- AREA -->
      <UFormField
        label="Warehouse Area"
        required
      >
        <USelectMenu
          v-model="selectedArea"
          :items="areaItems"
          placeholder="Select Area"
          class="w-full"
          searchable
          clear
          :disabled="panelMode === 'edit-area'"
        />
      </UFormField>

      <!-- AREA SIZE INFO -->
      <UAlert
        v-if="selectedAreaData"
        color="neutral"
        variant="soft"
        icon="i-lucide-ruler"
        :title="selectedAreaData.area_code"
        :description="`
          ${selectedAreaData.total_rows} Row ×
          ${selectedAreaData.total_cols} Col
        `"
      />

      <!-- POSITION -->
      <div class="grid grid-cols-2 gap-4">
        <!-- START ROW -->
        <UFormField
          label="Start Row"
          required
        >
          <UInput
            v-model.number="state.start_row"
            type="number"
            min="1"
            placeholder="1"
          />
        </UFormField>

        <!-- START COLUMN -->
        <UFormField
          label="Start Column"
          required
        >
          <UInput
            v-model.number="state.start_col"
            type="number"
            min="1"
            placeholder="1"
          />
        </UFormField>
      </div>

      <div class="space-y-3">
        <div
          class="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <p class="font-medium">
              Column Spacing
            </p>

            <p
              class="
                text-sm
                text-muted
              "
            >
              Add aisle spacing
              between columns
            </p>
          </div>

          <UButton
            icon="i-lucide-plus"
            size="sm"
            variant="soft"
            label="Add"
            @click="addSpacing"
            :disabled="!state.area_id"
          />
        </div>

        <!-- EMPTY -->
        <div
          v-if="
            !state.area_spacings
              .length
          "
          class="
            rounded-xl
            border
            border-dashed
            p-4
            text-center
            text-sm
            text-muted
          "
        >
          No spacing added
        </div>

        <!-- SPACING LIST -->
        <div
          v-for="(
            spacing,
            index
          ) in state.area_spacings"
          :key="spacing.id"
          class="
            rounded-xl
            border
            p-3
            space-y-3
          "
        >
          <div
            class="
              flex
              items-center
              justify-between
            "
          >
            <p
              class="
                text-sm
                font-semibold
              "
            >
              Spacing
              #{{ index + 1 }}
            </p>

            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="
                removeSpacing(
                  index
                )
              "
            />
          </div>

          <div
            class="
              grid
              grid-cols-2
              gap-4
            "
          >
            <!-- COL INDEX -->
            <UFormField
              label="After Column"
            >
              <USelectMenu
                v-model="spacing.col_index"
                :items="getAvailableColumns(index)"
                class="w-full"
                placeholder="Select Column"
              />
            </UFormField>

            <!-- SPACING -->
            <UFormField
              label="Spacing Width"
            >
              <UInput
                v-model.number="
                  spacing.col_spacing
                "
                type="number"
                min="1"
                max="3"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- COLLISION -->
      <UAlert
        v-if="isColliding"
        color="error"
        variant="soft"
        icon="i-lucide-alert-triangle"
        title="Area Collision"
        description="
          Selected area overlaps
          with another area.
        "
      />

      <!-- LIVE PREVIEW INFO -->
      <UAlert
        color="primary"
        variant="soft"
        icon="i-lucide-layout-grid"
        title="Live Canvas Preview"
        description="
          Area preview will automatically
          appear on the layout canvas.
        "
      />

      <!-- FOOTER -->
      <div
        class="
          flex
          justify-between
          items-center
          gap-3
          pt-4
        "
      >
        <!-- DELETE -->
        <div>
          <UButton
            v-if="panelMode ==='edit-area'"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            label="Delete"
            @click="deleteArea"
          />
        </div>

        <UButton
          color="primary"
          icon="i-lucide-save"
          :label="panelMode === 'edit-area' ? 'Save Changes' : 'Add Area'"
          :disabled="!state.area_id || state.area_spacings.some(spacing => !spacing.col_index) || props.isColliding"
          @click="saveArea"
        />
      </div>
    </div>
  </UCard>
</template>