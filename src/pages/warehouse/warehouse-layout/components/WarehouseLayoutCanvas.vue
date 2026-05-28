<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { WarehouseLayoutDetail, AreaSpacing } from '../../../../types/warehouse/warehouse-layout'

const props = defineProps<{
  layout: WarehouseLayoutDetail

  previewArea?: {
    area_id: number
    area_code: string
    name: string
    total_rows: number
    total_cols: number
    start_row: number
    start_col: number
    area_spacings?: AreaSpacing[]
  } | null

  selectedAreaLayoutId?: number | null
}>()

const emit = defineEmits<{
  collisionChange: [value: boolean]
  selectArea: [id: number]
}>()

const router = useRouter()

/**
 * ZOOM
 */
const zoom = ref(1)

function zoomIn() {
  if (zoom.value >= 2) return
  zoom.value += 0.1
}

function zoomOut() {
  if (zoom.value <= 0.5) return
  zoom.value -= 0.1
}

function resetZoom() {
  zoom.value = 1
}

/**
 * GRID SIZE
 */
const BASE_CELL_WIDTH = 110
const BASE_CELL_HEIGHT = 62

const scaledCellWidth = computed(
  () => BASE_CELL_WIDTH * zoom.value
)

const scaledCellHeight = computed(
  () => BASE_CELL_HEIGHT * zoom.value
)

const BIN_GAP = computed(
  () => 6 * zoom.value
)

/**
 * GRID COLOR
 */
const gridColor = computed(() =>
  document.documentElement.classList.contains(
    'dark'
  )
    ? '#3f3f46'
    : '#d4d4d8'
)

/**
 * SPACING OFFSET
 */
function getSpacingOffset(
  col: number,
  spacings: AreaSpacing[] = []
) {
  let offset = 0

  for (const spacing of spacings) {
    if (!spacing.col_index) {
      continue
    }

    if (col > spacing.col_index) {
      offset += spacing.col_spacing
    }
  }

  return offset
}

/**
 * AREA WIDTH
 */
function getAreaWidth(
  totalCols: number,
  spacings: AreaSpacing[] = []
) {
  const totalSpacing =
    spacings.reduce(
      (acc, spacing) => {
        if (!spacing.col_index) {
          return acc
        }

        return (
          acc +
          spacing.col_spacing
        )
      },
      0
    )

  return (
    (
      totalCols +
      totalSpacing
    ) * scaledCellWidth.value
  )
}

/**
 * COLLISION
 */
const isPreviewColliding = computed(() => {
  if (!props.previewArea) {
    return false
  }

  const previewSpacing =
    props.previewArea.area_spacings || []

  const previewWidth =
    props.previewArea.total_cols +
    previewSpacing.reduce(
      (acc, spacing) =>
        spacing.col_index
          ? acc +
            spacing.col_spacing
          : acc,
      0
    )

  const previewLeft =
    props.previewArea.start_col

  const previewTop =
    props.previewArea.start_row

  const previewRight =
    previewLeft +
    previewWidth -
    1

  const previewBottom =
    previewTop +
    props.previewArea.total_rows -
    1

  return props.layout.area_layouts.some(
    (areaLayout) => {
      /**
       * IGNORE SELF
       */
      if (
        areaLayout.id ===
        props.selectedAreaLayoutId
      ) {
        return false
      }

      const spacingWidth =
        areaLayout.area_spacings?.reduce(
          (acc, spacing) =>
            spacing.col_index
              ? acc +
                spacing.col_spacing
              : acc,
          0
        ) || 0

      const areaWidth =
        areaLayout.area.total_cols +
        spacingWidth

      const areaLeft =
        areaLayout.start_col

      const areaTop =
        areaLayout.start_row

      const areaRight =
        areaLeft +
        areaWidth -
        1

      const areaBottom =
        areaTop +
        areaLayout.area.total_rows -
        1

      return !(
        previewRight < areaLeft ||
        previewLeft > areaRight ||
        previewBottom < areaTop ||
        previewTop > areaBottom
      )
    }
  )
})

watch(
  isPreviewColliding,
  (value) => {
    emit(
      'collisionChange',
      value
    )
  },
  {
    immediate: true,
  }
)

/**
 * BIN DETAIL
 */
function openBinDetail(layoutId: number, binId: number) {
  router.push(
    `/warehouse/warehouse-layout/${layoutId}/storage-bin/${binId}`
  )
}

/**
 * BIN COLOR
 */
function getBinColorClass(
  filledPercentage: number
) {
  if (
    filledPercentage >= 100
  ) {
    return `
      border-red-500
      bg-red-500
      text-white
    `
  }

  if (
    filledPercentage >= 70
  ) {
    return `
      border-orange-500
      bg-orange-500
      text-white
    `
  }

  if (
    filledPercentage >= 30
  ) {
    return `
      border-yellow-500
      bg-yellow-500
      text-black
    `
  }

  return `
    border-green-500
    bg-green-500
    text-white
  `
}

const AREA_COLORS = [
  {
    border: 'border-blue-500',
    soft: `
      border-blue-200
      bg-blue-50/90
      text-blue-700

      dark:border-blue-700
      dark:bg-blue-900/70
      dark:text-blue-200
    `,
  },

  {
    border: 'border-sky-500',
    soft: `
      border-sky-200
      bg-sky-50/90
      text-sky-700

      dark:border-sky-700
      dark:bg-sky-900/70
      dark:text-sky-200
    `,
  },

  {
    border: 'border-cyan-500',
    soft: `
      border-cyan-200
      bg-cyan-50/90
      text-cyan-700

      dark:border-cyan-700
      dark:bg-cyan-900/70
      dark:text-cyan-200
    `,
  },

  {
    border: 'border-indigo-500',
    soft: `
      border-indigo-200
      bg-indigo-50/90
      text-indigo-700

      dark:border-indigo-700
      dark:bg-indigo-900/70
      dark:text-indigo-200
    `,
  },
]

function getAreaColor(areaId: number) {
  return AREA_COLORS[areaId % AREA_COLORS.length]
}
</script>

<template>
  <div class="space-y-4">
    <UCard class="h-full">
      <!-- HEADER -->
      <template #header>
        <div
          class="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <h3 class="font-semibold">
              Layout Canvas
            </h3>

            <p class="text-sm text-muted">
              Warehouse visual layout editor
            </p>
          </div>

          <!-- ZOOM -->
          <div
            class="
              flex
              items-center
              gap-2
            "
          >
            <UButton
              icon="i-lucide-zoom-out"
              color="neutral"
              variant="soft"
              @click="zoomOut"
            />

            <div
              class="
                min-w-[70px]
                rounded-lg
                border
                px-3
                py-1
                text-center
                text-sm
                font-semibold
              "
            >
              {{
                Math.round(
                  zoom * 100
                )
              }}%
            </div>

            <UButton
              icon="i-lucide-zoom-in"
              color="primary"
              variant="soft"
              @click="zoomIn"
            />

            <UButton
              label="Reset"
              color="neutral"
              variant="ghost"
              @click="resetZoom"
            />
          </div>
        </div>
      </template>

      <!-- CANVAS -->
      <div
        class="
          relative
          overflow-auto
          rounded-xl
          border
          bg-white
          dark:bg-neutral-900
        "
        style="height: 950px;"
      >
        <!-- GLOBAL GRID -->
        <div
          class="
            absolute
            top-0
            left-0
            opacity-40
          "
          :style="{
            width: `${40 * scaledCellWidth}px`,
            height: `${40 * scaledCellHeight}px`,
            backgroundImage: `
              linear-gradient(to right, ${gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
            `,
            backgroundSize: `${scaledCellWidth}px ${scaledCellHeight}px`
          }"
        />

        <!-- COL -->
        <div
          v-for="col in 40"
          :key="`col-${col}`"
          class="
            absolute
            text-xs
            font-semibold
            text-muted
          "
          :style="{
            left: `${col * scaledCellWidth + 12}px`,
            top: '8px'
          }"
        >
          {{ col }}
        </div>

        <!-- ROW -->
        <div
          v-for="row in 40"
          :key="`row-${row}`"
          class="
            absolute
            text-xs
            font-semibold
            text-muted
          "
          :style="{
            left: '10px',
            top: `${row * scaledCellHeight + 8}px`
          }"
        >
          {{ row }}
        </div>

        <!-- AREA -->
        <div
          v-for="areaLayout in layout.area_layouts"
          :key="areaLayout.id"
          class="group absolute"
          :style="{
            width: `${getAreaWidth(
              areaLayout.area.total_cols,
              areaLayout.area_spacings
            )}px`,
            height: `${areaLayout.area.total_rows * scaledCellHeight}px`,
            left: `${areaLayout.start_col * scaledCellWidth}px`,
            top: `${areaLayout.start_row * scaledCellHeight}px`
          }"
        >
          <!-- LABEL -->
          <UTooltip
            :delay-duration="0"
            :text="`Manage ${areaLayout.area.area_code}`"
            :content="{
              side: 'top',
              sideOffset: 10
            }"
          >
            <div
              class="
                absolute
                -top-11
                left-0
                z-20
                rounded-lg
                border
                px-4
                py-2
                text-sm
                font-bold
                shadow-sm
                backdrop-blur-sm

                transition-all
                duration-100
                hover:-translate-y-1
                hover:shadow-md
                flex
                cursor-pointer
                items-center
                gap-2
              "
              :class="
                getAreaColor(
                  areaLayout.id
                ).soft
              "
              @click="
                emit(
                  'selectArea',
                  areaLayout.id
                )
              "
            >
              {{
                areaLayout.area
                  .area_code
              }}
            </div>
          </UTooltip>

          <!-- BOX -->
          <div
            class="
              relative
              h-full
              w-full
              overflow-hidden
              rounded-2xl
              border-2
              shadow-sm
              bg-white/80
              transition
              dark:bg-neutral-900/80
            "
            :class="[
              areaLayout.id === selectedAreaLayoutId
                ? 'opacity-30'
                : '',

              getAreaColor(
                areaLayout.id
              ).border
            ]"
          >
            <!-- INTERNAL GRID -->
            <div
              class="
                absolute
                inset-0
                opacity-40
              "
              :style="{
                backgroundImage: `
                  linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                  linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                `,
                backgroundSize: `${scaledCellWidth}px ${scaledCellHeight}px`
              }"
            />

            <!-- CELLS -->
            <template
              v-for="row in areaLayout.area.total_rows"
              :key="`row-${row}`"
            >
              <template
                v-for="col in areaLayout.area.total_cols"
                :key="`col-${col}`"
              >
                <!-- BIN -->
                <template
                  v-if="
                    areaLayout.area.bins.find(
                      bin =>
                        bin.row_index === row &&
                        bin.col_index === col
                    )
                  "
                >
                  <UTooltip
                    v-for="bin in areaLayout.area.bins.filter(
                      b =>
                        b.row_index === row &&
                        b.col_index === col
                    )"
                    :key="bin.id"
                    :text="`Capacity: ${bin.stock_count}/${bin.capacity}`"
                    :content="{
                      side: 'top',
                      sideOffset: 8
                    }"
                    :delay-duration="0"
                  >
                    <div
                      class="
                        absolute
                        flex
                        items-center
                        justify-center
                        rounded-lg
                        border
                        cursor-pointer
                        px-2
                        text-center
                        shadow-sm
                        transition
                        duration-200
                        hover:scale-[1.02]
                        hover:shadow-md
                        hover:z-20
                      "
                      :class="
                        getBinColorClass(
                          bin.filled_percentage
                        )
                      "
                      :style="{
                        width: `${scaledCellWidth - BIN_GAP * 2}px`,

                        height: `${scaledCellHeight - BIN_GAP * 2}px`,

                        left: `${
                          (
                            (
                              col - 1 +
                              getSpacingOffset(
                                col,
                                areaLayout.area_spacings
                              )
                            ) * scaledCellWidth
                          ) + BIN_GAP
                        }px`,

                        top: `${(row - 1) * scaledCellHeight + BIN_GAP}px`
                      }"
                      @click.stop="openBinDetail(layout.id, bin.id)"
                    >
                      <p
                        class="
                          w-full
                          break-words
                          whitespace-normal
                          text-center
                          font-bold
                          leading-tight
                        "
                        :style="{
                          fontSize: `${Math.max(9, 14 * zoom)}px`
                        }"
                      >
                        {{
                          bin.bin_code
                        }}
                      </p>
                    </div>
                  </UTooltip>
                </template>

                <!-- EMPTY -->
                <div
                  v-else
                  class="
                    absolute
                    rounded-lg
                    border
                    border-dashed
                    border-zinc-400
                    bg-zinc-200
                    dark:border-zinc-700
                    dark:bg-neutral-800
                  "
                  :style="{
                    width: `${scaledCellWidth - BIN_GAP * 2}px`,

                    height: `${scaledCellHeight - BIN_GAP * 2}px`,

                    left: `${
                      (
                        (
                          col - 1 +
                          getSpacingOffset(
                            col,
                            areaLayout.area_spacings
                          )
                        ) * scaledCellWidth
                      ) + BIN_GAP
                    }px`,

                    top: `${(row - 1) * scaledCellHeight + BIN_GAP}px`
                  }"
                />
              </template>
            </template>
          </div>
        </div>

        <!-- PREVIEW -->
        <div
          v-if="previewArea"
          class="
            absolute
            pointer-events-none
          "
          :style="{
            width: `${getAreaWidth(
              previewArea.total_cols,
              previewArea.area_spacings
            )}px`,

            height: `${previewArea.total_rows * scaledCellHeight}px`,

            left: `${previewArea.start_col * scaledCellWidth}px`,

            top: `${previewArea.start_row * scaledCellHeight}px`
          }"
        >
          <!-- LABEL -->
          <div
            class="
              absolute
              -top-11
              left-0
              z-30
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-bold
              backdrop-blur-sm
            "
            :class="
              isPreviewColliding
                ? 'border-red-500 bg-red-500/15 text-red-500'
                : 'border-primary bg-primary/15 text-primary'
            "
          >
            {{
              previewArea.area_code
            }}
          </div>

          <!-- BOX -->
          <div
            class="
              relative
              h-full
              w-full
              overflow-hidden
              rounded-2xl
              border-2
              border-dashed
            "
            :class="
              isPreviewColliding
                ? 'border-red-500 bg-red-500/10'
                : 'border-primary bg-primary/10'
            "
          >
            <!-- GRID -->
            <div
              class="
                absolute
                inset-0
                opacity-50
              "
              :style="{
                backgroundImage: `
                  linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                  linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                `,
                backgroundSize: `${scaledCellWidth}px ${scaledCellHeight}px`
              }"
            />

            <!-- EMPTY CELLS -->
            <template
              v-for="row in previewArea.total_rows"
              :key="`preview-row-${row}`"
            >
              <template
                v-for="col in previewArea.total_cols"
                :key="`preview-col-${col}`"
              >
                <div
                  class="
                    absolute
                    rounded-lg
                    border
                    border-dashed
                  "
                  :class="
                    isPreviewColliding
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-primary/40 bg-primary/5'
                  "
                  :style="{
                    width: `${scaledCellWidth - BIN_GAP * 2}px`,

                    height: `${scaledCellHeight - BIN_GAP * 2}px`,

                    left: `${
                      (
                        (
                          col - 1 +
                          getSpacingOffset(
                            col,
                            previewArea.area_spacings
                          )
                        ) * scaledCellWidth
                      ) + BIN_GAP
                    }px`,

                    top: `${(row - 1) * scaledCellHeight + BIN_GAP}px`
                  }"
                />
              </template>
            </template>
          </div>
        </div>

        <!-- EMPTY -->
        <div
          v-if="
            !layout.area_layouts
              ?.length
          "
          class="
            absolute
            inset-0
            flex
            items-center
            justify-center
          "
        >
          <div class="text-center">
            <p class="font-medium">
              No Area Layout
            </p>

            <p class="text-sm text-muted">
              Start adding warehouse area
              into canvas
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <!-- LEGEND -->
    <UCard>
      <div
        class="
          flex
          flex-wrap
          items-center
          gap-5
        "
      >
        <div
          class="
            flex
            items-center
            gap-2
          "
        >
          <div
            class="
              h-4
              w-4
              rounded
              bg-green-500
            "
          />

          <p class="text-sm">
            0% - 29%
          </p>
        </div>

        <div
          class="
            flex
            items-center
            gap-2
          "
        >
          <div
            class="
              h-4
              w-4
              rounded
              bg-yellow-500
            "
          />

          <p class="text-sm">
            30% - 69%
          </p>
        </div>

        <div
          class="
            flex
            items-center
            gap-2
          "
        >
          <div
            class="
              h-4
              w-4
              rounded
              bg-orange-500
            "
          />

          <p class="text-sm">
            70% - 99%
          </p>
        </div>

        <div
          class="
            flex
            items-center
            gap-2
          "
        >
          <div
            class="
              h-4
              w-4
              rounded
              bg-red-500
            "
          />

          <p class="text-sm">
            100%
          </p>
        </div>

        <div
          class="
            flex
            items-center
            gap-2
          "
        >
          <div
            class="
              h-4
              w-4
              rounded
              border-2
              border-dashed
              border-primary
              bg-primary/20
            "
          />

          <p class="text-sm">
            Area Preview
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>