import './assets/css/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'

import { addCollection } from '@iconify/vue'
import lucideIcons from '@iconify-json/lucide/icons.json'

import App from './App.vue'
import { useAuthStore } from './stores/auth.store'

addCollection(lucideIcons)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

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
      path: '/production-plan', 
      component: () => import('./pages/production-plan.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/warehouse', 
      component: () => import('./pages/warehouse.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },

    // master data
    { 
      path: '/master-data/users', 
      component: () => import('./pages/master-data/users/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/vehicles', 
      component: () => import('./pages/master-data/vehicles/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/warehouses', 
      component: () => import('./pages/master-data/warehouses/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/warehouse-areas', 
      component: () => import('./pages/master-data/warehouse-areas/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/storage-bins', 
      component: () => import('./pages/master-data/storage-bins/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/docks', 
      component: () => import('./pages/master-data/docks/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/audit-logs', 
      component: () => import('./pages/master-data/audit-logs/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/customers', 
      component: () => import('./pages/master-data/customers/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/factories', 
      component: () => import('./pages/master-data/factories/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/lines', 
      component: () => import('./pages/master-data/lines/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    { 
      path: '/master-data/calendar', 
      component: () => import('./pages/master-data/calendar/index.vue'),
      meta: { layout: 'default', requiresAuth: true }
    },
    
    // error
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

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated && !to.meta.isPublic) {
    next('/login')
  } else if (authStore.isAuthenticated && to.path === '/login') {
    next('/')
  } else {
    next()
  }
})

app.use(router)
app.use(ui)

app.mount('#app')

