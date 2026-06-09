// Path: src/views/production-plan/bom/composables/useBomColumns.ts
// Import path matches the uploaded reference file

import { h } from "vue";
import type { Bom } from "../../../../types/production-plan/bom";
import type { ColumnDef } from "@tanstack/table-core";

interface UIComponents {
  UCheckbox: any;
  UButton: any;
  UDropdownMenu: any;
  UBadge: any;
}

interface Actions {
  onReturnToDraft: (bom: Bom) => void;
  onSubmitForApproval: (bom: Bom) => void;
  onApprove: (bom: Bom) => void;
  onReject: (bom: Bom) => void;
  onActivate: (bom: Bom) => void;
  onDeactivate: (bom: Bom) => void;
  onView: (bom: Bom) => void;
  onDelete: (bom: Bom) => void;
}

function docStatusColor(
  code?: string
): "neutral" | "warning" | "success" | "error" {
  switch (code) {
    case "Approved":
      return "success";
    case "Pending_Approval":
      return "warning";
    case "Rejected":
      return "error";
    default:
      return "neutral";
  }
}

function activationColor(code?: string): "success" | "neutral" {
  return code === "Active" ? "success" : "neutral";
}

export function useBomColumns(actions: Actions, ui: UIComponents) {
  const columns: ColumnDef<Bom>[] = [
    // ── Checkbox ────────────────────────────────────────────────────────────
    {
      id: "select",
      header: ({ table }) =>
        h(ui.UCheckbox, {
          modelValue: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected(),
          "onUpdate:modelValue": (v: boolean) =>
            table.toggleAllPageRowsSelected(!!v),
          ariaLabel: "Select all",
        }),
      cell: ({ row }) =>
        h(ui.UCheckbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (v: boolean) => row.toggleSelected(!!v),
          ariaLabel: "Select row",
        }),
      enableSorting: false,
      enableHiding: false,
    },

    // ── No ──────────────────────────────────────────────────────────────────
    {
      header: "#",
      cell: ({ row }) =>
        h("span", { class: "text-muted text-xs" }, row.index + 1),
    },

    // ── BOM Number ──────────────────────────────────────────────────────────
    {
      accessorKey: "bom_number",
      header: "BOM Number",
      cell: ({ row }) =>
        h("div", { class: "space-y-0.5" }, [
          h(
            "button",
            {
              class:
                "font-semibold text-primary hover:underline font-mono text-sm text-left",
              onClick: () => actions.onView(row.original),
            },
            row.original.bom_number
          ),
          h(
            "span",
            { class: "text-xs text-muted" },
            ` v${row.original.bom_version}`
          ),
        ]),
    },

    // ── Parent part ──────────────────────────────────────────────────────────
    {
      id: "parent_part",
      header: "Parent Part",
      cell: ({ row }) => {
        const part = row.original.parent_part;
        if (!part) return h("span", { class: "text-muted" }, "—");
        return h("div", { class: "space-y-0.5" }, [
          h("div", { class: "font-medium text-sm" }, part.part_name),
          h("div", { class: "text-xs text-muted font-mono" }, part.part_number),
        ]);
      },
    },

    // ── Description ──────────────────────────────────────────────────────────
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-sm text-muted max-w-52 truncate" },
          row.original.description || "—"
        ),
    },

    // ── UOM ──────────────────────────────────────────────────────────────────
    {
      id: "uom",
      header: "UOM",
      cell: ({ row }) =>
        h(
          "span",
          { class: "text-sm font-mono uppercase" },
          row.original.uom?.code ?? "—"
        ),
    },

    // ── Total Components ──────────────────────────────────────────────────────
    {
      id: "component_count",
      header: "Components",
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center font-mono text-sm" },
          row.original.component_count ?? "—"
        ),
    },

    // ── Doc Status ───────────────────────────────────────────────────────────
    {
      id: "doc_status",
      header: "Doc Status",
      cell: ({ row }) => {
        const s = row.original.doc_status;
        if (!s) return h("span", { class: "text-muted" }, "—");
        return h(ui.UBadge, {
          label: s,
          color: docStatusColor(s),
          variant: "subtle",
        });
      },
    },

    // ── Activation Status ────────────────────────────────────────────────────
    {
      id: "activation_status",
      header: "Activation",
      cell: ({ row }) => {
        const s = row.original.activation_status;
        if (!s) return h("span", { class: "text-muted" }, "—");
        return h(ui.UBadge, {
          label: s,
          color: activationColor(s),
          variant: "soft",
        });
      },
    },

    // ── Actions ──────────────────────────────────────────────────────────────
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const status     = row.original.doc_status
        const activation = row.original.activation_status
    
        const isDraft     = status === "Draft"
        const isSubmitted = status === "Pending_Approval"
        const isApproved  = status === "Approved"
        const isActive    = activation === "Active"
    
        // Build groups, only push non-empty ones to avoid separator gaps
        const groups: any[][] = []
    
        // Group 1 — always visible
        groups.push([
          {
            label: "View Detail",
            icon: "i-lucide-eye",
            onSelect: () => actions.onView(row.original),
          },
        ])
    
        // Group 2 — draft workflow
        if (isDraft) {
          groups.push([
            {
              label: "Submit for Approval",
              icon: "i-lucide-send",
              color: "success" as const,
              onSelect: () => actions.onSubmitForApproval(row.original),
            },
          ])
        }
    
        // Group 3 — approval workflow
        if (isSubmitted) {
          groups.push([
            {
              label: "Approve",
              icon: "i-lucide-check",
              color: "success" as const,
              onSelect: () => actions.onApprove(row.original),
            },
            {
              label: "Reject",
              icon: "i-lucide-x",
              color: "error" as const,
              onSelect: () => actions.onReject(row.original),
            },
            {
              label: "Return to Draft",
              icon: "i-lucide-rotate-ccw",
              color: "warning" as const,
              onSelect: () => actions.onReturnToDraft(row.original),
            },
          ])
        }
    
        // Group 4 — activation toggle (only when approved)
        if (isApproved) {
          groups.push([
            isActive
              ? {
                  label: "Deactivate",
                  icon: "i-lucide-power-off",
                  color: "neutral" as const,
                  onSelect: () => actions.onDeactivate(row.original),
                }
              : {
                  label: "Activate",
                  icon: "i-lucide-power",
                  color: "success" as const,
                  onSelect: () => actions.onActivate(row.original),
                },
          ])
        }
    
        // Group 5 — danger zone (always visible, disabled when not draft)
        groups.push([
          {
            label: "Delete",
            icon: "i-lucide-trash-2",
            color: "error" as const,
            disabled: !isDraft,
            onSelect: () => actions.onDelete(row.original),
          },
        ])
    
        return h("div", { class: "flex justify-end" }, [
          h(
            ui.UDropdownMenu,
            {
              items: groups,
              content: { align: "end" },
            },
            () =>
              h(ui.UButton, {
                icon: "i-lucide-more-vertical",
                color: "neutral",
                variant: "ghost",
                class: "h-8 w-8 p-0",
              })
          ),
        ])
      },
    },
  ];

  return { columns };
}
