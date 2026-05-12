<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  parts: any[]
  loading?: boolean
}>()

const page = ref(1)
const pageSize = ref(5)

const paginatedParts = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value

  return props.parts.slice(start, end)
})

watch(
  () => props.parts.length,
  () => {
    page.value = 1
  }
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold">
            Critical Parts Action List
          </h3>
          <p class="text-xs text-muted">
            Parts that need replenishment attention.
          </p>
        </div>

        <UBadge color="error" variant="soft">
          {{ parts.length }} Part(s)
        </UBadge>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default text-left">
            <th class="p-3">Part Number</th>
            <th class="p-3">Part Name</th>
            <th class="p-3">Category</th>
            <th class="p-3">Current</th>
            <th class="p-3">Safety</th>
            <th class="p-3">Coverage</th>
            <th class="p-3">Status</th>
            <th class="p-3">Area</th>
            <th class="p-3">Aging</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="part in paginatedParts"
            :key="part.part_id"
            class="border-b border-default"
          >
            <td class="p-3 font-medium">
              {{ part.part_number }}
            </td>
            <td class="p-3">
              {{ part.part_name }}
            </td>
            <td class="p-3">
              {{ part.part_category || '-' }}
            </td>
            <td class="p-3">
              {{ part.total_kanban }}
            </td>
            <td class="p-3">
              {{ part.safety_stock }}
            </td>
            <td class="p-3">
              {{ Number(part.stock_percentage || 0).toFixed(0) }}%
            </td>
            <td class="p-3">
              <UBadge
                :color="part.stock_status === 'Out of Stock' || part.stock_status === 'Critical' ? 'error' : 'warning'"
                variant="soft"
              >
                {{ part.stock_status }}
              </UBadge>
            </td>
            <td class="p-3">
              {{ part.warehouse_area || '-' }}
            </td>
            <td class="p-3">
              {{ part.aging_days != null ? `${part.aging_days} days` : '-' }}
            </td>
          </tr>

          <tr v-if="!paginatedParts.length">
            <td colspan="9" class="p-6 text-center text-muted">
              {{ loading ? 'Loading critical parts...' : 'No critical parts found.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-muted">
          Showing
          {{ parts.length ? ((page - 1) * pageSize) + 1 : 0 }}
          -
          {{ Math.min(page * pageSize, parts.length) }}
          of
          {{ parts.length }}
          parts
        </p>

        <UPagination
          v-model:page="page"
          :total="parts.length"
          :items-per-page="pageSize"
        />
      </div>
    </template>
  </UCard>
</template>