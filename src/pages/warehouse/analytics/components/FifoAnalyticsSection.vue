<script setup lang="ts">
import dayjs from 'dayjs'
import { defineAsyncComponent } from 'vue'
const apexchart = defineAsyncComponent(() => import('vue3-apexcharts'))

defineProps<{
  fifoCompliance: {
    fifo_compliant: number
    fifo_override: number
    total_takeout: number
    fifo_compliance_rate: number
  }
  fifoViolationDetails: any[]
  fifoViolationMeta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  agingChartOptions: any
  agingChartSeries: number[]
}>()

const emit = defineEmits([
  'update:fifo-violation-page'
])

const formatDate = (date?: string) => {
  if (!date) return '-'
  return dayjs(date).format('DD MMM YYYY HH:mm:ss')
}

const violationColumns = [
  {
    accessorKey: 'transaction_date',
    header: 'Date',
    cell: ({ row }: any) => formatDate(row.original.transaction_date)
  },
  {
    accessorKey: 'wo_number',
    header: 'WO Number'
  },
  {
    accessorKey: 'part_number',
    header: 'Part'
  },
  {
    accessorKey: 'selected_label',
    header: 'Selected Label'
  },
  {
    accessorKey: 'recommended_label_number',
    header: 'Recommended Label',
    cell: ({ row }: any) => row.original.recommended_label_number || '-'
  }
]


</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <UCard>
  <p class="text-sm text-muted">
    FIFO Compliance
  </p>

  <p class="text-3xl font-bold mt-2 text-success">
    {{ fifoCompliance.fifo_compliance_rate }}%
  </p>

  <UProgress
    :model-value="fifoCompliance.fifo_compliance_rate"
    color="success"
    class="mt-4"
  />

  <div class="mt-3 space-y-1 text-xs">
    <div class="flex items-center justify-between">
      <span class="text-muted">Follow FIFO</span>
      <span class="font-semibold text-success">
        {{ fifoCompliance.fifo_compliant }}
        /
        {{ fifoCompliance.total_takeout }}
      </span>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-muted">Violation</span>
      <span class="font-semibold text-error">
        {{ fifoCompliance.fifo_override }}
        /
        {{ fifoCompliance.total_takeout }}
      </span>
    </div>

    <p class="text-muted pt-3">
      {{ fifoCompliance.fifo_compliant }} dari
      {{ fifoCompliance.total_takeout }} transaksi take out mengikuti rekomendasi FIFO.
    </p>
  </div>
</UCard>

<UCard>
  <p class="text-sm text-muted">
    FIFO Violations
  </p>

  <p class="text-3xl font-bold mt-2 text-error">
    {{ fifoCompliance.fifo_override }}
  </p>

  <div class="mt-4 space-y-1 text-s">

    <p class="text-muted pt-2">
      Transaksi Take Out yang tidak mengikuti rekomendasi FIFO.
    </p>
  </div>
</UCard>

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold">
            Aging Distribution
          </h3>

          <p class="text-xs text-muted">
            Active stock aging composition.
          </p>
        </div>
      </template>

      <apexchart
        height="250"
        type="donut"
        :options="agingChartOptions"
        :series="agingChartSeries"
      />
    </UCard>
  </div>
  <UCard>
    <template #header>
      <div class="font-semibold">
        Recent FIFO Violations
      </div>
    </template>

    <div v-if="!fifoViolationDetails.length" class="py-6 text-center text-muted">
      No FIFO violations found.
    </div>

    <div v-else class="space-y-4">
      <UTable :data="fifoViolationDetails" :columns="violationColumns" />

      <div class="flex items-center justify-between">
        <p class="text-sm text-muted">
          Showing
          {{
            ((fifoViolationMeta.page - 1) * fifoViolationMeta.limit) + 1
          }}
          -
          {{
            Math.min(
              fifoViolationMeta.page * fifoViolationMeta.limit,
              fifoViolationMeta.total
            )
          }}
          of {{ fifoViolationMeta.total }} violations
        </p>

        <UPagination
          :page="fifoViolationMeta.page"
          :items-per-page="fifoViolationMeta.limit"
          :total="fifoViolationMeta.total"
          @update:page="emit('update:fifo-violation-page', $event)"
        />
      </div>
    </div>
  </UCard>
</template>