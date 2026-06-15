import './assets/css/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'

import { addCollection } from '@iconify/vue'
import lucideIcons from '@iconify-json/lucide/icons.json'

import App from './App.vue'
import { useAuthStore } from './stores/auth.store'

import VueApexCharts from 'vue3-apexcharts'

addCollection(lucideIcons)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(VueApexCharts)

const router = createRouter({
  routes: [
    //autentikasi
    {
      path: '/login',
      component: () => import('./pages/login.vue'),
      meta: { layout: 'auth', isPublic: true }
    },
    {
      path: '/logout',
      component: () => import('./pages/logout.vue'),
      meta: { layout: 'auth' }
    },
    {
      path: '/',
      component: () => import('./pages/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },

    //template (belum kepake)
    {
      path: '/users',
      component: () => import('./pages/users.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    {
      path: '/sales',
      component: () => import('./pages/sales.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    {
      path: '/sales/forecast',
      component: () => import('./pages/sales/forecast/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales', 'Staff Sales Forecast'] }
    },
    {
      path: '/sales/spr',
      component: () => import('./pages/sales/spr/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales', 'Staff Sales Order'] }
    },
    {
      path: '/sales/spo',
      component: () => import('./pages/sales/spo/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales', 'Staff Sales Order'] }
    },
    {
      path: '/sales/sdp',
      component: () => import('./pages/sales/sdp/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales', 'Staff Sales Delivery'] }
    },
    {
      path: '/sales/analytics',
      component: () => import('./pages/sales/analytics/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales'] }
    },
    {
      path: '/sales/sdo',
      component: () => import('./pages/sales/sdo/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales', 'Staff Sales Delivery'] }
    },
    {
      path: '/sales/sdo/mobile/:id',
      component: () => import('./pages/sales/sdo/mobile.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Driver', 'Admin sales', 'Supervisor Sales', 'Staff Sales Delivery'] }
    },
    {
      path: '/production-plan',
      component: () => import('./pages/production-plan.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/bom',
      name: 'bom-list',
      component: () => import('./pages/production-plan/bom/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/bom/create',
      name: 'bom-create',
      component: () => import('./pages/production-plan/bom/BomFormPage.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/bom/:id',
      name: 'bom-detail-edit',
      component: () => import('./pages/production-plan/bom/BomFormPage.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/plan',
      name: 'production-plan-list',
      component: () => import('./pages/production-plan/production-plan/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/plan/:id',
      name: 'production-plan-detail-edit',
      component: () => import('./pages/production-plan/production-plan/PlanFormPage.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/plan/create',
      name: 'production-plan-create',
      component: () => import('./pages/production-plan/production-plan/PlanFormPage.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/order-schedule',
      name: 'order-schedule-list',
      component: () => import('./pages/production-plan/order-schedule/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/order-schedule/:id',
      name: 'order-schedule-detail-edit',
      component: () => import('./pages/production-plan/order-schedule/detail.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/order-schedule/create',
      name: 'order-schedule-create',
      component: () => import('./pages/production-plan/order-schedule/create.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/work-order',
      name: 'work-order-list',
      component: () => import('./pages/production-plan/work-order/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    {
      path: '/production-plan/work-order/:id',
      name: 'work-order-detail-edit',
      component: () => import('./pages/production-plan/work-order/detail.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC', 'Staff PPIC'] }
    },
    // { 
    //   path: '/production-plan/work-order/create', 
    //   name: 'work-order-create',
    //   component: () => import('./pages/production-plan/work-order/create.vue'),
    //   meta: { layout: 'default', requiresAuth: true }
    // },

    //MATERIAL
    {
      path: '/material/mrp',
      component: () => import('./pages/material/mrp/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Material', 'Staff Material', 'Supervisor Material'] }
    },
    {
      path: '/material/mpr',
      component: () => import('./pages/material/mpr/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Material', 'Staff Material', 'Supervisor Material'] }
    },
    {
      path: '/material/mpo',
      component: () => import('./pages/material/mpo/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Material', 'Staff Material', 'Supervisor Material'] }
    },
    {
      path: '/material/mdo',
      component: () => import('./pages/material/mdo/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Material', 'Staff Material', 'Supervisor Material'] }
    },
    //WAREHOUSE
    {
      path: '/warehouse',
      component: () => import('./pages/warehouse.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    {
      path: '/warehouse/placement',
      component: () => import('./pages/warehouse/placement/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'warehouse staff'] }
    },
    {
      path: '/warehouse/placement/:id',
      component: () => import('./pages/warehouse/placement/detail.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'warehouse staff'] }
    },
    {
      path: '/warehouse/take-out',
      component: () => import('./pages/warehouse/take-out/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'warehouse staff'] }
    },
    {
      path: '/warehouse/take-out/:id',
      component: () => import('./pages/warehouse/take-out/detail.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'warehouse staff'] }
    },
    {
      path: '/warehouse/transaction-activity',
      component: () => import('./pages/warehouse/transaction-activity/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'warehouse staff'] }
    },
    {
      path: '/warehouse/stock-monitoring',
      component: () => import('./pages/warehouse/stock-monitoring/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin warehouse', 'warehouse staff', 'supervisor warehouse'] }
    },
    {
      path: '/warehouse/critical-stock',
      component: () => import('./pages/warehouse/critical-stock/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin warehouse', 'supervisor warehouse', 'staff material'] }
    },
    {
      path: '/warehouse/analytics',
      component: () => import('./pages/warehouse/analytics/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin warehouse', 'warehouse staff', 'supervisor warehouse'] }
    },
    {
      path: '/warehouse/station-buffer',
      component: () => import('./pages/warehouse/station-buffer/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin'] }
    },
    {
      path: '/production/production-material-control/production-result',
      component: () => import('./pages/production/production-material-control/production-result/index.vue'),
      meta: {
        layout: 'default',
        requiresAuth: true,
        allowedRoles: ['Superadmin', 'Admin production', 'Staff production', 'Supervisor production']
      }
    },
    {
      path: '/production/production-material-control/replacement',
      component: () => import('./pages/production/production-material-control/replacement/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    {
      path: '/production/production-material-control/scrap',
      component: () => import('./pages/production/production-material-control/scrap/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    {
      path: '/production/production-material-control/buffer-status',
      component: () => import('./pages/production/production-material-control/buffer-status/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    {
      path: '/production/production-material-control/dashboard',
      component: () => import('./pages/production/production-material-control/dashboard/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },

    // master data
    {
      path: '/master-data/users',
      component: () => import('./pages/master-data/users/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Admin Warehouse', 'Admin PPIC', 'Admin Material'] }
    },
    {
      path: '/master-data/vehicles',
      component: () => import('./pages/master-data/vehicles/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/master-data/defects',
      component: () => import('./pages/master-data/defects/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/warehouses',
      component: () => import('./pages/master-data/warehouses/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse'] }
    },
    {
      path: '/master-data/warehouse-areas',
      component: () => import('./pages/master-data/warehouse-areas/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse'] }
    },
    {
      path: '/master-data/storage-bins',
      component: () => import('./pages/master-data/storage-bins/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse'] }
    },
    {
      path: '/master-data/docks',
      component: () => import('./pages/master-data/docks/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse'] }
    },
    {
      path: '/master-data/audit-logs',
      component: () => import('./pages/master-data/audit-logs/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Admin Warehouse', 'Admin PPIC', 'Admin Material'] }
    },
    {
      path: '/master-data/customers',
      component: () => import('./pages/master-data/customers/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin sales', 'Supervisor Sales'] }
    },
    {
      path: '/master-data/factories',
      component: () => import('./pages/master-data/factories/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/lines',
      name: 'master-data-lines',
      component: () => import('./pages/master-data/lines/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/lines/:line_id/capacity',
      name: 'master-data-lines-capacity',
      component: () => import('./pages/master-data/lines/LineCapacityPage.vue'),
      meta: { title: 'Line Capacity', layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/parts',
      component: () => import('./pages/master-data/parts/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Material', 'Supervisor Material', 'Admin PPIC'] }
    },
    {
      path: '/master-data/suppliers',
      component: () => import('./pages/master-data/suppliers/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Material', 'Supervisor Material'] }
    },
    {
      path: '/master-data/calendar',
      component: () => import('./pages/master-data/calendar/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/stations',
      component: () => import('./pages/master-data/stations/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/stations/:id/jobs',
      component: () => import('./pages/master-data/stations/[id]/jobs/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/jobs',
      component: () => import('./pages/master-data/jobs/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/shifts',
      component: () => import('./pages/master-data/shifts/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },
    {
      path: '/master-data/shift-calendars',
      component: () => import('./pages/master-data/shift-calendars/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin PPIC', 'Supervisor PPIC'] }
    },

    // warehouse
    {
      path: '/warehouse/material-receiving',
      component: () => import('./pages/warehouse/material-receiving/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/material-receiving/set-arrived-process/:id',
      component: () => import('./pages/warehouse/material-receiving/set-arrived-process.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/material-receiving/view-progress/:id',
      component: () => import('./pages/warehouse/material-receiving/view-progress/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/material-receiving/view-progress/:id/quantity-checking/:mdo_detail_id',
      component: () => import('./pages/warehouse/material-receiving/view-progress/quantity-checking.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/material-receiving/view-progress/:id/quality-checking/:mdo_detail_id',
      component: () => import('./pages/warehouse/material-receiving/view-progress/quality-checking.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/good-receipt',
      component: () => import('./pages/warehouse/good-receipt/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse'] }
    },
    {
      path: '/warehouse/good-receipt/:id',
      component: () => import('./pages/warehouse/good-receipt/detail.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse'] }
    },
    {
      path: '/warehouse/warranty-and-claim',
      component: () => import('./pages/warehouse/warranty-and-claim/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/work-order-storing',
      component: () => import('./pages/warehouse/work-order-storing/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/work-order-storing/create',
      component: () => import('./pages/warehouse/work-order-storing/create.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/work-order-storing/edit/:id',
      component: () => import('./pages/warehouse/work-order-storing/edit.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/warehouse-layout',
      component: () => import('./pages/warehouse/warehouse-layout/index.vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/warehouse-layout/:id',
      component: () => import('./pages/warehouse/warehouse-layout/[id].vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse', 'Warehouse Staff'] }
    },
    {
      path: '/warehouse/warehouse-layout/:layoutId/storage-bin/:id',
      component: () => import('./pages/warehouse/warehouse-layout/storage-bin/[id].vue'),
      meta: { layout: 'default', requiresAuth: true, allowedRoles: ['Superadmin', 'Admin Warehouse', 'Supervisor Warehouse', 'Warehouse Staff'] }
    },

    // error
    {
      path: '/forbidden',
      component: () => import('./pages/error/Forbidden.vue'),
      meta: { layout: 'auth', isPublic: true }
    },
    {
      path: '/error',
      component: () => import('./pages/error/GenericError.vue'),
      meta: { layout: 'auth', isPublic: true }
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('./pages/error/NotFound.vue'),
      meta: { layout: 'auth', isPublic: true }
    }
  ],
  history: createWebHistory()
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // If token exists but user is not loaded, fetch it first
  if (authStore.token && !authStore.user) {
    await authStore.fetchProfile()
  }

  if (!authStore.isAuthenticated && !to.meta.isPublic) {
    next('/login')
  } else if (authStore.isAuthenticated && to.path === '/login') {
    next('/')
  } else {
    // Role Authorization Check
    const allowedRoles = to.meta.allowedRoles as string[] | undefined
    if (allowedRoles && Array.isArray(allowedRoles)) {
      const userRole = authStore.user?.role
      const hasAccess = allowedRoles.some(
        role => role.toLowerCase() === userRole?.toLowerCase()
      )
      if (!hasAccess) {
        next('/forbidden')
        return
      }
    }
    next()
  }
})

app.use(router)
app.use(ui)

app.mount('#app')
