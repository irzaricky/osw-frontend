import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      // ✅ Aktifkan auto-import komponen @nuxt/ui (prefix 'U')
      components: true,
      ui: {
        colors: {
          primary: 'green',
          neutral: 'zinc'
        },
        error: {
          slots: {
            root: 'min-h-[calc(100vh-var(--ui-header-height))] flex flex-col items-center justify-center text-center',
            statusCode: 'text-base font-semibold text-primary',
            statusMessage: 'mt-2 text-4xl sm:text-5xl font-bold text-highlighted text-balance',
            message: 'mt-4 text-lg text-muted text-balance',
            links: 'mt-8 flex items-center justify-center gap-6'
          }
        }
      }
    })
  ]
})