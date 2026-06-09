<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.store' // Sesuaikan path jika perlu
import mrpService from '../../services/material/mrp.service'
import mprService from '../../services/material/mpr.service'
import mpoService from '../../services/material/mpo.service'

// ─── AUTH & ROLE ───────────────────────────────────────────────────────
const authStore = useAuthStore()

// Mengecek apakah user adalah admin (Sesuaikan nama role dengan di database)
const isAdmin = computed(() => {
  const role = authStore.user?.role?.toLowerCase() || ''
  return role === 'superadmin' || role === 'admin material' || role === 'admin'
})

// ─── STATE ─────────────────────────────────────────────────────────────
const loading = ref(true)

const metrics = reactive({
  lowSafetyStock: 0,
  pendingSpr: 0,
  pendingApprovals: 0,
  activeMpo: 0
})

const criticalParts = ref<any[]>([])
const recentActivities = ref<any[]>([])

// ─── QUICK LINKS ───────────────────────────────────────────────────────
// Daftar semua link, tambahkan adminOnly: true untuk menu khusus admin
const allQuickLinks = [
  { title: 'Create MRP', description: 'From Sales Plan', icon: 'i-lucide-file-plus-2', to: '/material/mrp' },
  { title: 'Emergency MPR', description: 'Manual Request', icon: 'i-lucide-alert-circle', to: '/material/mpr' },
  { title: 'Manage MPO', description: 'Purchase Orders', icon: 'i-lucide-shopping-cart', to: '/material/mpo' },
  { title: 'Delivery Order', description: 'Schedule Dock', icon: 'i-lucide-truck', to: '/material/mdo' },
  { title: 'Master Parts', description: 'View Inventory', icon: 'i-lucide-box', to: '/master-data/parts', adminOnly: true },
]

// Filter link yang akan ditampilkan berdasarkan hak akses
const quickLinks = computed(() => {
  return allQuickLinks.filter(link => !link.adminOnly || isAdmin.value)
})

// ─── HELPER: Status Color ──────────────────────────────────────────────
const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'Draft': 'neutral',
    'Submitted': 'warning',
    'Approved': 'success',
    'Rejected': 'error'
  }
  return map[status] || 'neutral'
}

// ─── FETCH REAL DATA (Aggregator Pattern) ──────────────────────────────
const fetchDashboardData = async () => {
  loading.value = true
  try {
    // 1. Ambil jumlah SPR yang siap di-MRP-kan
    const sprRes = await mrpService.ddSalesPlans()
    metrics.pendingSpr = sprRes.data?.data?.length || 0

    // 2. Fetch paralel untuk Metrik, Recent Activities, dan Critical Parts
    const [
      mrpSubRes, mprSubRes, mpoSubRes, 
      mpoActRes,                       
      mrpRecRes, mprRecRes, mpoRecRes,
      criticalRes
    ] = await Promise.allSettled([
      mrpService.getMrps({ status: 'Submitted', limit: 1 }), 
      mprService.getMprs({ status: 'Submitted', limit: 1 }),
      mpoService.getMpos({ status: 'Submitted', limit: 1 }),
      mpoService.getMpos({ status: 'Approved', limit: 1 }), 
      mrpService.getMrps({ limit: 5 }), 
      mprService.getMprs({ limit: 5 }),
      mpoService.getMpos({ limit: 5 }),
      mrpService.getDashboardCriticalParts()
    ])

    // Hitung Total Pending Approvals
    let totalPending = 0
    if (mrpSubRes.status === 'fulfilled') totalPending += mrpSubRes.value.data?.data?.total || 0
    if (mprSubRes.status === 'fulfilled') totalPending += mprSubRes.value.data?.data?.total || 0
    if (mpoSubRes.status === 'fulfilled') totalPending += mpoSubRes.value.data?.data?.total || 0
    metrics.pendingApprovals = totalPending

    // Hitung Active MPO
    if (mpoActRes.status === 'fulfilled') {
      metrics.activeMpo = mpoActRes.value.data?.data?.total || 0
    }

    // Gabungkan data untuk Recent Activities
    let combinedRecent: any[] = []
    
    if (mrpRecRes.status === 'fulfilled') {
      const mrps = mrpRecRes.value.data?.data?.rows || []
      combinedRecent.push(...mrps.map((i: any) => ({
        id: `mrp-${i.id}`,
        doc_number: i.mrp_number,
        type: 'MRP',
        status: i.status,
        date: i.created_at || i.updated_at
      })))
    }
    
    if (mprRecRes.status === 'fulfilled') {
      const mprs = mprRecRes.value.data?.data?.rows || []
      combinedRecent.push(...mprs.map((i: any) => ({
        id: `mpr-${i.id}`,
        doc_number: i.mpr_number,
        type: 'MPR',
        status: i.status,
        date: i.created_at || i.updated_at
      })))
    }

    if (mpoRecRes.status === 'fulfilled') {
      const mpos = mpoRecRes.value.data?.data?.rows || []
      combinedRecent.push(...mpos.map((i: any) => ({
        id: `mpo-${i.id}`,
        doc_number: i.mpo_number,
        type: 'MPO',
        status: i.status,
        date: i.created_at || i.updated_at
      })))
    }

    // Urutkan dari yang paling baru dan ambil 5 teratas
    combinedRecent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    recentActivities.value = combinedRecent.slice(0, 5)

    // 3. Masukkan Data Critical Parts
    if (criticalRes.status === 'fulfilled' && criticalRes.value.data?.status) {
      const payload = criticalRes.value.data.data
      metrics.lowSafetyStock = payload.total || 0
      
      criticalParts.value = payload.parts.map((p: any) => ({
        id: p.id,
        part_number: p.part_number,
        name: p.part_name,
        stock: p.safety_stock, // Menampilkan data fisik aktual
      }))
    }

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="space-y-6 relative">
    
    <div v-if="loading" class="absolute inset-0 z-10 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-xl">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-default">Material Operations Dashboard</h1>
        <p class="text-sm text-muted">Monitor inventory alerts and procurement documents.</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" :loading="loading" @click="fetchDashboardData">Refresh</UButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="bg-elevated border border-error/20 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-muted">Low Safety Stock</p>
            <h3 class="text-3xl font-bold text-error mt-1">{{ metrics.lowSafetyStock }}</h3>
          </div>
          <div class="p-2 bg-error/10 rounded-lg">
            <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-error" />
          </div>
        </div>
        <p class="text-xs text-muted mt-4">Parts critical (<= 10)</p>
      </UCard>

      <UCard class="bg-elevated border border-primary/20">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-muted">Pending SPR</p>
            <h3 class="text-3xl font-bold text-primary mt-1">{{ metrics.pendingSpr }}</h3>
          </div>
          <div class="p-2 bg-primary/10 rounded-lg">
            <UIcon name="i-lucide-clipboard-list" class="w-6 h-6 text-primary" />
          </div>
        </div>
        <p class="text-xs text-muted mt-4">Approved sales plan ready for MRP</p>
      </UCard>

      <UCard class="bg-elevated border border-warning/20">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-muted">Pending Approvals</p>
            <h3 class="text-3xl font-bold text-warning mt-1">{{ metrics.pendingApprovals }}</h3>
          </div>
          <div class="p-2 bg-warning/10 rounded-lg">
            <UIcon name="i-lucide-clock" class="w-6 h-6 text-warning" />
          </div>
        </div>
        <p class="text-xs text-muted mt-4">Documents awaiting supervisor review</p>
      </UCard>

      <UCard class="bg-elevated border border-success/20">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-muted">Active MPO</p>
            <h3 class="text-3xl font-bold text-success mt-1">{{ metrics.activeMpo }}</h3>
          </div>
          <div class="p-2 bg-success/10 rounded-lg">
            <UIcon name="i-lucide-shopping-bag" class="w-6 h-6 text-success" />
          </div>
        </div>
        <p class="text-xs text-muted mt-4">Purchase orders in progress</p>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <UCard class="bg-elevated flex flex-col">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-default flex items-center gap-2">
              <UIcon name="i-lucide-siren" class="w-5 h-5 text-error" />
              Critical Parts Stock
            </h3>
            <UButton 
              v-if="isAdmin"
              variant="ghost" 
              color="primary" 
              size="sm" 
              to="/master-data/parts"
            >
              View All
            </UButton>
          </div>
        </template>
        <div class="divide-y divide-gray-200 dark:divide-gray-800">
          
          <div v-if="criticalParts.length === 0 && !loading" class="py-8 text-center text-muted">
            <UIcon name="i-lucide-check-circle-2" class="w-8 h-8 text-success mx-auto mb-2 opacity-50" />
            <p class="text-sm">All parts inventory are safe.</p>
          </div>

          <div v-for="part in criticalParts" :key="part.id" class="py-3 flex justify-between items-center">
            <div>
              <p class="text-sm font-semibold text-default">{{ part.part_number }}</p>
              <p class="text-xs text-muted">{{ part.name }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-error">{{ part.stock }} <span class="text-xs font-normal text-muted">in stock</span></p>
              <UBadge color="error" variant="soft" size="xs" class="mt-1">Critical</UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="bg-elevated flex flex-col">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-default flex items-center gap-2">
              <UIcon name="i-lucide-activity" class="w-5 h-5 text-primary" />
              Recent Documents
            </h3>
          </div>
        </template>
        <div class="divide-y divide-gray-200 dark:divide-gray-800">
          <div v-if="recentActivities.length === 0 && !loading" class="py-8 text-center text-muted">
            <p class="text-sm">No recent activity found.</p>
          </div>
          
          <div v-for="act in recentActivities" :key="act.id" class="py-3 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-sm font-semibold text-default">{{ act.doc_number }}</p>
                <p class="text-xs text-muted">
                  {{ new Date(act.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }) }}
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[10px] font-bold text-muted uppercase tracking-wider">{{ act.type }}</span>
              <UBadge :color="getStatusColor(act.status)" variant="subtle" size="xs">
                {{ act.status }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="space-y-4">
      <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
        <UIcon name="i-lucide-zap" class="w-4 h-4 text-warning" />
        Quick Actions
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.title"
          :to="link.to"
        >
          <div class="bg-elevated border border-default hover:border-primary/50 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group h-full">
            <UIcon
              :name="link.icon"
              class="w-6 h-6 text-muted-foreground group-hover:text-primary mb-3 transition-colors"
            />
            <h3 class="font-bold text-default group-hover:text-primary transition-colors">
              {{ link.title }}
            </h3>
            <p class="text-xs text-muted mt-1">
              {{ link.description }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>

  </div>
</template>