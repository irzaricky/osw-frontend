<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const open = ref(false)

const staticLinks = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Master Data',
  icon: 'i-lucide-database',
  // defaultOpen: true,
  children: [{
    label: 'Users',
    to: '/master-data/users',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Customers',
    to: '/master-data/customers',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Vehicles',
    to: '/master-data/vehicles',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Suppliers',
    to: '/master-data/suppliers',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Parts',
    to: '/master-data/parts',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Defects',
    to: '/master-data/defects',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Factories',
    to: '/master-data/factories',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Lines',
    to: '/master-data/lines',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Warehouses',
    to: '/master-data/warehouses',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Warehouse Areas',
    to: '/master-data/warehouse-areas',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Storage Bins',
    to: '/master-data/storage-bins',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Docks',
    to: '/master-data/docks',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Stations',
    to: '/master-data/stations',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Jobs',
    to: '/master-data/jobs',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Shifts',
    to: '/master-data/shifts',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Calendar Workdays',
    to: '/master-data/shift-calendars',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Calendar',
    to: '/master-data/calendar',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Audit Logs',
    to: '/master-data/audit-logs',
    onSelect: () => {
      open.value = false
    }
  },  
]
}, {
  label: 'Sales',
  icon: 'i-lucide-shopping-cart',
  defaultOpen: route.path.startsWith('/sales'),
  children: [
    {
      label: 'Forecast',
      icon: 'i-lucide-badge-dollar-sign',
      to: '/sales/forecast',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'SPR',
      icon: 'i-lucide-file-text',
      to: '/sales/spr',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'SPO',
      icon: 'i-lucide-file-plus',
      to: '/sales/spo',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Sales Delivery Plan',
      icon: 'i-lucide-calendar-days',
      to: '/sales/sdp',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Sales Delivery Order',
      icon: 'i-lucide-truck',
      to: '/sales/sdo',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Sales Analytics',
      icon: 'i-lucide-chart-column-big',
      to: '/sales/analytics',
      onSelect: () => {
        open.value = false
      }
    }
  ]
}, {
  label: 'Material',
  icon: 'i-lucide-shopping-bag',
  defaultOpen: route.path.startsWith('/sales'),
  children: [
    {
      label: 'MRP',
      icon: 'i-lucide-notebook-pen',
      to: '/material/mrp',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'MPR',
      icon: 'i-lucide-book-check',
      to: '/material/mpr',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'MPO',
      icon: 'i-lucide-book-check',
      to: '/material/mpo',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'MDO',
      icon: 'i-lucide-book-check',
      to: '/material/mdo',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Analytics',
      icon: 'i-lucide-book-check',
      to: '/material/analytics',
      onSelect: () => {
        open.value = false
      }
    },
  ]
},{
  label: 'Production Plan',
  icon: 'i-lucide-calendar',
  defaultOpen: route.path.startsWith('/production-plan'),
  children: [
    {
      label: 'Bill of Materials',
      icon: 'i-lucide-package',
      to: '/production-plan/bom',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Plan Capacity',
      icon: 'i-lucide-gantt-chart',
      to: '/production-plan/plan',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Order Scheduling',
      icon: 'i-lucide-calendar-clock',
      to: '/production-plan/order-schedule',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Work Orders',
      icon: 'i-lucide-clipboard-list',
      to: '/production-plan/work-order',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Work Order Monitoring',
      icon: 'i-lucide-monitor-check',
      to: '/production-plan/work-order-monitor',
      onSelect: () => {
        open.value = false
      }
    }
  ]
}, 
{
  label: 'Production Material Control',
  icon: 'i-lucide-factory',
  defaultOpen: route.path.startsWith('/production/production-material-control'),
  children: [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/production/production-material-control/dashboard',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Production Result',
      icon: 'i-lucide-clipboard-check',
      to: '/production/production-material-control/production-result',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Material Replacement',
      icon: 'i-lucide-refresh-cw',
      to: '/production/production-material-control/replacement',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Scrap / Crusher',
      icon: 'i-lucide-trash-2',
      to: '/production/production-material-control/scrap',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Buffer Status',
      icon: 'i-lucide-package-check',
      to: '/production/production-material-control/buffer-status',
      onSelect: () => {
        open.value = false
      }
    }
  ]
},

{
  label: 'Warehouse',
  icon: 'i-lucide-box',
  defaultOpen: route.path.startsWith('/warehouse'),
  children: [
    {
      label: 'Material Receiving',
      icon: 'i-lucide-inbox',
      to: '/warehouse/material-receiving',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Good Receipt',
      icon: 'i-lucide-clipboard-check',
      to: '/warehouse/good-receipt',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Warranty & Claim',
      icon: 'i-lucide-shield-alert',
      to: '/warehouse/warranty-and-claim',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Work Order Storing',
      icon: 'i-lucide-archive',
      to: '/warehouse/work-order-storing',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Placement',
      icon: 'i-lucide-package-check',
      to: '/warehouse/placement',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Take Out',
      icon: 'i-lucide-package-x',
      to: '/warehouse/take-out',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Transaction Activity',
      icon: 'i-lucide-history',
      to: '/warehouse/transaction-activity',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Stock Monitoring',
      icon: 'i-lucide-chart-no-axes-combined',
      to: '/warehouse/stock-monitoring',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Warehouse Layout',
      icon: 'i-lucide-warehouse',
      to: '/warehouse/warehouse-layout',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Critical Stock',
      icon: 'i-lucide-triangle-alert',
      to: '/warehouse/critical-stock',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Warehouse Analytics',
      icon: 'i-lucide-chart-column-big',
      to: '/warehouse/analytics',

      onSelect: () => {
        open.value = false
      }
    },
  ]
}], []] satisfies NavigationMenuItem[][]

const hasPermission = (to?: string) => {
  if (!to) return true
  const resolved = router.resolve(to)
  if (resolved && resolved.meta && resolved.meta.allowedRoles) {
    const roles = resolved.meta.allowedRoles as string[]
    const userRole = authStore.user?.role
    return roles.some(role => role.toLowerCase() === userRole?.toLowerCase())
  }
  return true
}

const filterLinks = (items: any[]): any[] => {
  return items
    .filter(item => {
      if (item.to && !hasPermission(item.to)) {
        return false
      }
      return true
    })
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: filterLinks(item.children)
        }
      }
      return item
    })
    .filter(item => {
      if (item.children && item.children.length === 0 && !item.to) {
        return false
      }
      return true
    })
}

const links = computed(() => {
  return staticLinks.map(group => filterLinks(group))
})

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-3" :class="collapsed ? 'justify-center p-2' : 'px-2 py-2'">
          <UAvatar
            src="https://github.com/vuejs.png"
            alt="Vue Logo"
            size="sm"
            class="shrink-0"
          />
          <span v-if="!collapsed" class="font-bold text-[15px] truncate text-gray-900 dark:text-white">OSW SYSTEM</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <main class="flex-1 min-w-0 w-full h-full overflow-auto">
      <slot />
    </main>
  </UDashboardGroup>
</template>