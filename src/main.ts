import './assets/css/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import { useAuthStore } from './stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const router = createRouter({
  routes: [
    { 
      path: '/login', 
      component: () => import('./pages/login.vue'),
      meta: { layout: 'auth' }
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
    }
  ],
  history: createWebHistory()
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

app.use(router)
app.use(ui)

app.mount('#app')

