import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useBomStore } from "../../../../stores/production-plan/bom.store";
import { usePartStore } from "../../../../stores/master-data/part.store";
import { useUomStore } from "../../../../stores/master-data/uom.store";
import { useAppToast } from "../../../../composables/useAppToast";
import type { PartDropdown } from "../../../../types/master-data/parts";
import type {
  BomDetail,
  BomDetailItem,
  CreateBomPayload,
  UpdateBomPayload,
} from "../../../../types/production-plan/bom";

// ─── Local detail type ────────────────────────────────────────────────────────
export interface LocalDetail extends BomDetailItem {
  temp_id: string;
  _part?: { id: number; part_number: string; part_name: string };
  _uom?: { id: number; code: string; name: string };
  _child_bom?: { id: number; bom_number: string; bom_version: number };
}

export function useBomForm() {
  const router = useRouter();
  const route = useRoute();

  const bomStore = useBomStore();
  const partStore = usePartStore();
  const uomStore = useUomStore();

  const {
    currentBom,
    loading,
    saving,
    dropdown: bomDropdown,
  } = storeToRefs(bomStore);
  const { dropdown: partDropdown } = storeToRefs(partStore);
  const { dropdown: uomDropdown } = storeToRefs(uomStore);
  const { toastSuccess, toastError } = useAppToast();

  // ─── Route helpers ──────────────────────────────────────────────────────────
  const isCreate = computed(() => route.name === "bom-create");
  const bomId = computed(() => route.params.id as string | undefined);

  // ─── Doc status ─────────────────────────────────────────────────────────────
  function docStatusColor(
    code?: string
  ): "neutral" | "warning" | "success" | "error" {
    switch (code) {
      case "APPROVED":
        return "success";
      case "PENDING_APPROVAL":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "neutral";
    }
  }

  const isEditable = computed(
    () =>
      isCreate.value ||
      currentBom.value?.doc_status === "Draft" ||
      currentBom.value?.doc_status === "Rejected"
  );

  function fmtDate(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ─── Header form ────────────────────────────────────────────────────────────
  const headerForm = reactive({
    description: "",
    uom_id: undefined as number | undefined,
    notes: "",
  });

  const partSearch = ref("");
  const selectedParentPart = ref<PartDropdown | null>(null);

  const filteredParentParts = computed(() => {
    if (!partSearch.value) return partDropdown.value;
    const q = partSearch.value.toLowerCase();
    return partDropdown.value.filter(
      (p) =>
        p.part_number.toLowerCase().includes(q) ||
        p.part_name.toLowerCase().includes(q)
    );
  });

  const uomItems = computed(() =>
    uomDropdown.value.map((u) => ({
      label: `${u.code} — ${u.name}`,
      value: u.id,
    }))
  );

  const selectedUomId = computed({
    get: () => headerForm.uom_id ?? undefined,
    set: (v: number | null) => {
      headerForm.uom_id = v ?? undefined;
    },
  });

  // ─── Can add component? (create mode requires a parent part first) ─────────
  // Edit mode always has a parent part already (from currentBom), so it's
  // never gated here — only the create flow needs this check.
  const canAddDetail = computed(() =>
    isCreate.value ? !!selectedParentPart.value : true
  );

  // ─── Local details ──────────────────────────────────────────────────────────
  const localDetails = ref<LocalDetail[]>([]);
  const savedSnapshot = ref("");

  function makeSnapshot() {
    return JSON.stringify({
      description: headerForm.description,
      uom_id: headerForm.uom_id,
      notes: headerForm.notes,
      details: localDetails.value.map((d) => ({
        part_id: d.part_id,
        qty_required: d.qty_required,
        scrap_percentage: d.scrap_percentage,
        level: d.level,
        sequence: d.sequence,
        type: d.type,
        notes: d.notes,
        uom_id: d.uom_id,
        child_bom_id: d.child_bom_id,
      })),
    });
  }

  // NOTE: previously this also checked `createStep === 2` while creating.
  // Now that the wizard step is gone, "dirty" for create mode simply means
  // "the user has typed/added something" — i.e. there's a parent part
  // selected or at least one detail added.
  const isDirty = computed(() => {
    if (isCreate.value) {
      return !!selectedParentPart.value || localDetails.value.length > 0;
    }
    return makeSnapshot() !== savedSnapshot.value;
  });

  function syncDetailsFromBom() {
    if (!currentBom.value?.details) {
      localDetails.value = [];
      return;
    }
    localDetails.value = currentBom.value.details.map((d) => {
      const partEntry = partDropdown.value.find((p) => p.id === d.part_id);
      const uomEntry = uomDropdown.value.find((u) => u.id === d.uom_id);
      const bomEntry = bomDropdown.value.find((b) => b.id === d.child_bom_id);
      return {
        temp_id: crypto.randomUUID(),
        part_id: d.part_id,
        qty_required: d.qty_required,
        scrap_percentage: d.scrap_percentage ?? 0,
        level: d.level ?? null,
        sequence: d.sequence ?? 0,
        type: d.type ?? null,
        notes: d.notes ?? null,
        uom_id: d.uom_id ?? null,
        child_bom_id: d.child_bom_id ?? null,
        _part: partEntry ?? (d.part as any),
        _uom: uomEntry ?? (d.uom as any),
        _child_bom: bomEntry ?? (d.child_bom as any),
      } satisfies LocalDetail;
    });
  }

  function discardChanges() {
    syncDetailsFromBom();
    savedSnapshot.value = makeSnapshot();
  }

  // ─── Detail modal ───────────────────────────────────────────────────────────
  const isDetailModalOpen = ref(false);
  const detailModalMode = ref<"add" | "edit">("add");
  const editingDetail = ref<LocalDetail | undefined>(undefined);

  const nextSequence = computed(() => {
    if (!localDetails.value.length) return 10;
    return Math.max(...localDetails.value.map((d) => d.sequence ?? 0)) + 10;
  });

  function openAddDetail() {
    if (!canAddDetail.value) {
      toastError("Please select a parent part first.");
      return;
    }
    detailModalMode.value = "add";
    editingDetail.value = undefined;
    isDetailModalOpen.value = true;
  }

  function openEditDetail(d: LocalDetail) {
    detailModalMode.value = "edit";
    editingDetail.value = { ...d };
    isDetailModalOpen.value = true;
  }

  function handleDetailSave(
    data: Partial<BomDetail> & {
      _part?: LocalDetail["_part"];
      _uom?: LocalDetail["_uom"];
      _child_bom?: LocalDetail["_child_bom"];
    }
  ) {
    if (detailModalMode.value === "add") {
      localDetails.value.push({
        temp_id: crypto.randomUUID(),
        part_id: data.part_id!,
        qty_required: data.qty_required!,
        scrap_percentage: data.scrap_percentage ?? 0,
        level: data.level ?? null,
        sequence: data.sequence ?? nextSequence.value,
        type: data.type ?? null,
        notes: data.notes ?? null,
        uom_id: data.uom_id ?? null,
        child_bom_id: data.child_bom_id ?? null,
        _part: data._part,
        _uom: data._uom,
        _child_bom: data._child_bom,
      });
    } else if (editingDetail.value) {
      const idx = localDetails.value.findIndex(
        (d) => d.temp_id === editingDetail.value!.temp_id
      );
      if (idx !== -1) {
        localDetails.value[idx] = {
          ...localDetails.value[idx],
          part_id: data.part_id!,
          qty_required: data.qty_required!,
          scrap_percentage: data.scrap_percentage ?? 0,
          level: data.level ?? null,
          sequence: data.sequence ?? localDetails.value[idx].sequence,
          type: data.type ?? null,
          notes: data.notes ?? null,
          uom_id: data.uom_id ?? null,
          child_bom_id: data.child_bom_id ?? null,
          _part: data._part,
          _uom: data._uom,
          _child_bom: data._child_bom,
        };
      }
    }
    isDetailModalOpen.value = false;
  }

  // ─── Delete detail ──────────────────────────────────────────────────────────
  const deleteConfirm = reactive({
    open: false,
    description: "",
    target: null as LocalDetail | null,
  });

  function confirmDeleteDetail(d: LocalDetail) {
    deleteConfirm.description = `Remove "${
      d._part?.part_name ?? `Part #${d.part_id}`
    }" from this BOM?`;
    deleteConfirm.target = d;
    deleteConfirm.open = true;
  }

  function executeDeleteDetail() {
    if (!deleteConfirm.target) return;
    localDetails.value = localDetails.value.filter(
      (d) => d.temp_id !== deleteConfirm.target!.temp_id
    );
    deleteConfirm.open = false;
    deleteConfirm.target = null;
  }

  // ─── Save ───────────────────────────────────────────────────────────────────
  async function handleSave(andSubmit = false) {
    if (isCreate.value && !selectedParentPart.value) {
      toastError("Please select a parent part.");
      return;
    }

    const detailsPayload: BomDetailItem[] = localDetails.value.map(
      ({ temp_id: _t, _part: _p, _uom: _u, _child_bom: _cb, ...rest }) => rest
    );

    try {
      let savedId: string | number;

      if (isCreate.value) {
        const payload: CreateBomPayload = {
          parent_part_id: selectedParentPart.value!.id,
          description: headerForm.description || null,
          uom_id: headerForm.uom_id ?? null,
          notes: headerForm.notes || null,
          details: detailsPayload,
        };
        const res = await bomStore.createBom(payload);
        toastSuccess(res.message || "BOM created");
        savedId = res.data.id;
        if (andSubmit) {
          await bomStore.submit(savedId);
          toastSuccess("BOM submitted for approval");
        }
        router.replace(`/production-plan/bom/${savedId}`);
      } else {
        const payload: UpdateBomPayload = {
          description: headerForm.description || null,
          uom_id: headerForm.uom_id ?? null,
          notes: headerForm.notes || null,
          details: detailsPayload,
        };
        const res = await bomStore.updateBom(bomId.value!, payload);
        toastSuccess(res.message || "BOM saved");
        savedId = bomId.value!;
        savedSnapshot.value = makeSnapshot();
        if (andSubmit) {
          await bomStore.submit(savedId);
          toastSuccess("BOM submitted for approval");
        }
      }
    } catch (e) {
      toastError(e);
    }
  }

  // ─── Workflow modal ─────────────────────────────────────────────────────────
  const wfModal = reactive({
    open: false,
    title: "",
    description: "",
    inputLabel: "",
    inputValue: "",
    inputRequired: false,
    actionLoading: false,
    action: null as (() => Promise<void>) | null,
  });

  function openApproveConfirm() {
    Object.assign(wfModal, {
      title: "Approve BOM",
      description: `Are you sure you want to approve BOM "${currentBom.value?.bom_number}"?`,
      inputLabel: "",
      inputRequired: false,
      inputValue: "",
    });
    wfModal.action = async () => {
      try {
        wfModal.actionLoading = true;
        const res = await bomStore.approve(bomId.value!);
        toastSuccess(res.message || "BOM approved");
        wfModal.open = false;
      } catch (e) {
        toastError(e);
      } finally {
        wfModal.actionLoading = false;
      }
    };
    wfModal.open = true;
  }

  function openRejectConfirm() {
    Object.assign(wfModal, {
      title: "Reject BOM",
      description: `Enter the reason for rejecting BOM "${currentBom.value?.bom_number}".`,
      inputLabel: "Rejection Reason",
      inputRequired: true,
      inputValue: "",
    });
    wfModal.action = async () => {
      if (!wfModal.inputValue.trim()) {
        toastError("Rejection reason is required.");
        return;
      }
      try {
        wfModal.actionLoading = true;
        const res = await bomStore.reject(bomId.value!, {
          reject_reason: wfModal.inputValue,
        });
        toastSuccess(res.message || "BOM rejected");
        wfModal.open = false;
      } catch (e) {
        toastError(e);
      } finally {
        wfModal.actionLoading = false;
      }
    };
    wfModal.open = true;
  }

  function openActivationConfirm() {
    const isActive = currentBom.value?.activation_status === "Active";
    Object.assign(wfModal, {
      title: isActive ? "Deactivate BOM" : "Activate BOM",
      description: isActive
        ? `BOM "${currentBom.value?.bom_number}" will be deactivated and cannot be used in production.`
        : `BOM "${currentBom.value?.bom_number}" will be activated for use in production.`,
      inputLabel: "",
      inputRequired: false,
    });
    wfModal.action = async () => {
      try {
        wfModal.actionLoading = true;
        const res = isActive
          ? await bomStore.deactivate(bomId.value!)
          : await bomStore.activate(bomId.value!);
        toastSuccess(
          res.message || (isActive ? "BOM deactivated" : "BOM activated")
        );
        wfModal.open = false;
      } catch (e) {
        toastError(e);
      } finally {
        wfModal.actionLoading = false;
      }
    };
    wfModal.open = true;
  }

  async function handleNewVersion() {
    try {
      const res = await bomStore.newVersion(bomId.value!);
      toastSuccess(res.message || "New version created");
      router.push(`/production-plan/bom/${res.data.id}`);
    } catch (e) {
      toastError(e);
    }
  }

  // ─── UOM resolver ───────────────────────────────────────────────────────────
  function resolveDetailUomCode(d: LocalDetail): string {
    if (d._uom?.code) return d._uom.code;
    return partDropdown.value.find((p) => p.id === d.part_id)?.uom?.code ?? "—";
  }

  // ─── Watchers ────────────────────────────────────────────────────────────────
  watch(selectedParentPart, (part) => {
    if (isCreate.value) headerForm.uom_id = part?.uom?.id ?? undefined;
  });

  watch(
    currentBom,
    (bom) => {
      if (!bom || isCreate.value) return;
      headerForm.description = bom.description ?? "";
      headerForm.notes = bom.notes ?? "";
      if (bom.uom) {
        headerForm.uom_id =
          uomDropdown.value.find((u) => u.id === bom.uom!.id)?.id ?? bom.uom.id;
      }
      syncDetailsFromBom();
      savedSnapshot.value = makeSnapshot();
    },
    { deep: true }
  );

  // ─── Init ────────────────────────────────────────────────────────────────────
  onMounted(async () => {
    await Promise.all([
      partStore.fetchDropdown(),
      uomStore.fetchDropdown(),
      bomStore.fetchDropdown(),
    ]);
  });

  watch(
    () => route.params.id,
    async (newId) => {
      if (isCreate.value) {
        bomStore.clearCurrentBom();
        localDetails.value = [];
        return;
      }
      if (!newId) return;
      bomStore.clearCurrentBom();
      await bomStore.fetchBom(Number(newId));
    },
    { immediate: true }
  );

  return {
    // route
    router,
    isCreate,
    bomId,
    // store refs
    currentBom,
    loading,
    saving,
    partDropdown,
    uomDropdown,
    bomDropdown,
    // status helpers
    docStatusColor,
    isEditable,
    fmtDate,
    // header form
    headerForm,
    partSearch,
    selectedParentPart,
    filteredParentParts,
    uomItems,
    selectedUomId,
    // details
    localDetails,
    isDirty,
    canAddDetail,
    nextSequence,
    syncDetailsFromBom,
    discardChanges,
    resolveDetailUomCode,
    // detail modal
    isDetailModalOpen,
    detailModalMode,
    editingDetail,
    openAddDetail,
    openEditDetail,
    handleDetailSave,
    // delete confirm
    deleteConfirm,
    confirmDeleteDetail,
    executeDeleteDetail,
    // actions
    handleSave,
    // workflow
    wfModal,
    openApproveConfirm,
    openRejectConfirm,
    openActivationConfirm,
    handleNewVersion,
  };
}