<script setup lang="ts">
import { computed } from 'vue'
import type { BomDocStatus, BomActivationStatus } from '../../../../types/production-plan/bom'

interface Filters {
  doc_status: string | undefined
  activation_status: string | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  docStatuses: BomDocStatus[]
  activationStatuses: BomActivationStatus[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

// ── BUG FIX: Sebelumnya dibungkus double array [ [...] ] yang menyebabkan
//    USelectMenu tidak bisa membaca items. Sekarang flat array langsung. ──────
const docStatusItems = computed(() =>
  props.docStatuses
    .slice()
    .map(s => ({ label: s.name, value: s.code })),
)

const activationItems = computed(() =>
  props.activationStatuses
    .slice()
    .map(s => ({ label: s.name, value: s.code })),
)

// ── Gunakan pola value-key + modelValue sebagai primitive (id number),
//    konsisten dengan cara USelectMenu di Nuxt UI v3 bekerja. ─────────────────
const selectedDocStatusId = computed({
  get: () => props.filters.doc_status ?? undefined,
  set: (v: string | undefined) =>
    emit('update:filters', { ...props.filters, doc_status: v ?? undefined }),
})

const selectedActivationId = computed({
  get: () => props.filters.activation_status ?? undefined,
  set: (v: string | undefined) =>
    emit('update:filters', { ...props.filters, activation_status: v ?? undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Doc Status filter -->
    <USelectMenu
      v-model="selectedDocStatusId"
      :items="docStatusItems"
      value-key="value"
      label-key="label"
      placeholder="Doc Status"
      class="w-44"
      clear
    />

    <!-- Activation Status filter -->
    <USelectMenu
      v-model="selectedActivationId"
      :items="activationItems"
      value-key="value"
      label-key="label"
      placeholder="Activation"
      class="w-36"
      clear
    />

    <!-- Search input — ml-auto agar selalu di kanan -->
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search BOM number or part..."
      class="w-64 ml-auto"
      @update:model-value="emit('update:search', String($event))"
    />
  </div>
</template>