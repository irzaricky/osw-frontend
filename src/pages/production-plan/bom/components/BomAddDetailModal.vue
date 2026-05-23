<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type {
  BomDetail,
  BomDropdownItem,
} from "../../../../types/production-plan/bom";
import type { PartDropdown } from "../../../../types/master-data/parts";
import type { UomDropdownItem } from "../../../../types/master-data/uom";

// ─── Enrichment type — data relasi untuk tampilan tabel di parent ─────────────
export interface DetailSavePayload extends Partial<BomDetail> {
  _part?: { id: number; part_number: string; part_name: string };
  _uom?: { id: number; code: string; name: string };
  _child_bom?: { id: number; bom_number: string; bom_version: number };
}

const props = defineProps<{
  open: boolean;
  mode: "add" | "edit";
  detail?: Partial<BomDetail> & { _part?: any; _uom?: any; _child_bom?: any };
  partDropdown: PartDropdown[];
  uomDropdown: UomDropdownItem[];
  bomDropdown: BomDropdownItem[];
  nextSequence: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  save: [data: DetailSavePayload];
}>();

// ─── Type options ─────────────────────────────────────────────────────────────
const DETAIL_TYPE_OPTIONS = [
  { label: "Product", value: "PRODUCT" },
  { label: "WIP", value: "WIP" },
  { label: "Raw", value: "RAW" },
];

// ─── Form state ───────────────────────────────────────────────────────────────
const selectedPart = ref<PartDropdown | null>(null);
const qty_required = ref<number>(1);
const sequence = ref<number>(0);
const level = ref<number | undefined>(undefined);
const type = ref<string>("");
const scrap_percentage = ref<number>(0);
const uom_id = ref<number | undefined>(undefined);
const child_bom_id = ref<number | undefined>(undefined);
const notes = ref<string>("");
const partSearch = ref("");

// ─── Reset saat modal dibuka ──────────────────────────────────────────────────
watch(
  () => props.open,
  (val) => {
    if (!val) return;
    partSearch.value = "";

    if (props.mode === "edit" && props.detail) {
      const d = props.detail;
      // Restore selectedPart dari enrichment data atau cari di dropdown
      selectedPart.value = props.detail._part
        ? props.partDropdown.find((p) => p.id === d.part_id) ??
          ({
            id: d.part_id!,
            part_number: props.detail._part.part_number,
            part_name: props.detail._part.part_name,
            uom: null,
          } as any)
        : props.partDropdown.find((p) => p.id === d.part_id) ?? null;

      qty_required.value = d.qty_required ?? 1;
      sequence.value = d.sequence ?? props.nextSequence;
      level.value = d.level ?? undefined;
      type.value = d.type ?? "";
      scrap_percentage.value = d.scrap_percentage ?? 0;
      uom_id.value = d.uom_id ?? undefined;
      child_bom_id.value = d.child_bom_id ?? undefined;
      notes.value = d.notes ?? "";
    } else {
      selectedPart.value = null;
      qty_required.value = 1;
      sequence.value = props.nextSequence;
      level.value = undefined;
      type.value = "";
      scrap_percentage.value = 0;
      uom_id.value = undefined;
      child_bom_id.value = undefined;
      notes.value = "";
    }
  }
);

// ─── Part search & select ─────────────────────────────────────────────────────
const filteredParts = computed(() => {
  if (!partSearch.value) return props.partDropdown;
  const q = partSearch.value.toLowerCase();
  return props.partDropdown.filter(
    (p) =>
      p.part_number.toLowerCase().includes(q) ||
      p.part_name.toLowerCase().includes(q)
  );
});

function selectPart(part: PartDropdown) {
  selectedPart.value = part;
  uom_id.value = part.uom?.id ?? undefined;
  type.value = part.part_type_code ?? "";
  child_bom_id.value = undefined;
  partSearch.value = "";
}

function clearPart() {
  selectedPart.value = null;
  child_bom_id.value = undefined;
}

// ─── UOM select ───────────────────────────────────────────────────────────────
const uomItems = computed(() =>
  props.uomDropdown.map((u) => ({
    label: `${u.code} — ${u.name}`,
    value: u.id,
  }))
);
const selectedUomId = computed({
  get: () => uom_id.value ?? undefined,
  set: (v: number | null) => {
    uom_id.value = v ?? undefined;
  },
});

// ─── Child BOM — difilter sesuai part yang dipilih ───────────────────────────
// Backend memvalidasi: child_bom.parent_part_id === detail.part_id
// Jadi dropdown hanya tampilkan BOM milik part tersebut.
const filteredBomItems = computed(() => {
  if (!selectedPart.value) return [];
  return props.bomDropdown
    .filter((b) => b.parent_part?.id === selectedPart.value!.id)
    .map((b) => ({
      label: `${b.bom_number} v${b.bom_version}`,
      value: b.id,
    }));
});

const selectedChildBomId = computed({
  get: () => child_bom_id.value ?? undefined,
  set: (v: number | null) => {
    child_bom_id.value = v ?? undefined;
  },
});

// ─── Type select ──────────────────────────────────────────────────────────────
const selectedType = computed({
  get: () => type.value ?? undefined,
  set: (v: string | null) => {
    type.value = v ?? "";
  },
});

// ─── Submit ───────────────────────────────────────────────────────────────────
function handleSave() {
  const uomEntry = props.uomDropdown.find((u) => u.id === uom_id.value);
  const childBomEntry = props.bomDropdown.find(
    (b) => b.id === child_bom_id.value
  );

  emit("save", {
    part_id: selectedPart.value?.id,
    qty_required: qty_required.value,
    sequence: sequence.value,
    level: level.value ?? null,
    type: type.value ?? null,
    scrap_percentage: scrap_percentage.value,
    uom_id: uom_id.value ?? null,
    child_bom_id: child_bom_id.value ?? null,
    notes: notes.value || null,
    // enrichment untuk tampilan tabel (tidak dikirim ke BE)
    _part: selectedPart.value
      ? {
          id: selectedPart.value.id,
          part_number: selectedPart.value.part_number,
          part_name: selectedPart.value.part_name,
        }
      : undefined,
    _uom: uomEntry
      ? { id: uomEntry.id, code: uomEntry.code, name: uomEntry.name }
      : undefined,
    _child_bom: childBomEntry
      ? {
          id: childBomEntry.id,
          bom_number: childBomEntry.bom_number,
          bom_version: childBomEntry.bom_version,
        }
      : undefined,
  });
}
</script>

<template>
  <UModal
    :open="open"
    :title="mode === 'add' ? 'Add Component' : 'Edit Component'"
    :ui="{ content: 'sm:max-w-xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="detail-form" class="space-y-4" @submit.prevent="handleSave">
        <!-- Part selector -->
        <UFormField label="Component Part" required>
          <div class="space-y-2">
            <!-- Selected pill -->
            <div
              v-if="selectedPart"
              class="flex items-center justify-between gap-2 rounded-lg border border-default bg-elevated px-3 py-2.5"
            >
              <div class="text-sm">
                <span class="font-mono font-semibold text-xs">{{
                  selectedPart.part_number
                }}</span>
                <span class="mx-2 text-muted">·</span>
                <span>{{ selectedPart.part_name }}</span>
                <span
                  v-if="selectedPart.uom"
                  class="ml-2 text-xs text-muted"
                >({{ selectedPart.uom.code }})</span>
              </div>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                type="button"
                :disabled="loading"
                @click="clearPart"
              />
            </div>
            <!-- Search -->
            <template v-if="!selectedPart">
              <UInput
                v-model="partSearch"
                icon="i-lucide-search"
                placeholder="Search part number or name..."
                class="w-full"
                :disabled="loading"
              />
              <div
                v-if="filteredParts.length > 0"
                class="max-h-44 overflow-y-auto rounded-lg border border-default divide-y divide-default"
              >
                <button
                  v-for="part in filteredParts.slice(0, 30)"
                  :key="part.id"
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-elevated transition-colors"
                  @click="selectPart(part)"
                >
                  <span class="font-mono font-semibold text-xs">{{
                    part.part_number
                  }}</span>
                  <span class="mx-2 text-muted">·</span>
                  <span class="text-sm">{{ part.part_name }}</span>
                  <span
                    v-if="part.uom"
                    class="ml-2 text-xs text-muted"
                  >({{ part.uom.code }})</span>
                </button>
              </div>
              <p v-else-if="partSearch" class="text-xs text-muted px-1">
                No parts found.
              </p>
            </template>
          </div>
        </UFormField>

        <!-- Qty + Scrap -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Qty Required" required>
            <UInput
              v-model.number="qty_required"
              type="number"
              min="0.0001"
              step="any"
              placeholder="1"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
          <UFormField label="Scrap %">
            <UInput
              v-model.number="scrap_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- Sequence + Level -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Sequence">
            <UInput
              v-model.number="sequence"
              type="number"
              min="0"
              placeholder="0"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
          <UFormField label="Level (0–5)">
            <UInput
              v-model.number="level"
              type="number"
              min="0"
              max="5"
              placeholder="—"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <!-- UOM -->
        <UFormField label="UOM">
          <USelectMenu
            v-model="selectedUomId"
            :items="uomItems"
            value-key="value"
            label-key="label"
            placeholder="Select unit of measure"
            class="w-full"
            clear
            :disabled="true"
          />
        </UFormField>

        <!-- Type -->
        <UFormField label="Type">
          <USelectMenu
            v-model="selectedType"
            :items="DETAIL_TYPE_OPTIONS"
            value-key="value"
            label-key="label"
            placeholder="Select type..."
            class="w-full"
            clear
            :disabled="true"
          />
        </UFormField>

        <!-- Child BOM -->
        <UFormField label="Child BOM (optional)">
          <template v-if="!selectedPart">
            <p class="text-xs text-muted py-1.5">
              Select a component part first to see available child BOMs.
            </p>
          </template>
          <template v-else-if="filteredBomItems.length === 0">
            <p class="text-xs text-muted py-1.5">
              No BOM found for this part.
            </p>
          </template>
          <USelectMenu
            v-else
            v-model="selectedChildBomId"
            :items="filteredBomItems"
            value-key="value"
            label-key="label"
            placeholder="Link to sub-BOM..."
            class="w-full"
            clear
            :disabled="loading"
          />
        </UFormField>

        <!-- Notes -->
        <UFormField label="Notes">
          <UTextarea
            v-model="notes"
            placeholder="Optional notes for this component..."
            class="w-full"
            :rows="2"
            :disabled="loading"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="emit('update:open', false)"
        />
        <UButton
          type="submit"
          form="detail-form"
          label="Save"
          color="primary"
          :loading="loading"
          :disabled="!selectedPart || !qty_required"
        />
      </div>
    </template>
  </UModal>
</template>
