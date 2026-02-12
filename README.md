# OSW Frontend

Project frontend untuk sistem OWS, dibangun menggunakan Vue 3, Vite, dan TypeScript.

## Prasyarat

- [Node.js](https://nodejs.org/) (versi LTS direkomendasikan)
- [pnpm](https://pnpm.io/) (package manager)

## Instalasi

1. Clone repository ini:
   ```bash
   git clone https://github.com/USERNAME/osw-frontend.git
   cd osw-frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Konfigurasi Environment

Project ini memerlukan konfigurasi environment variable untuk terhubung ke backend.

1. Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   # atau di Windows (Command Prompt):
   # copy .env.example .env
   ```

2. Buka file `.env` dan sesuaikan `VITE_API_BASE_URL` dengan URL backend Anda.
   ```properties
   VITE_API_BASE_URL=http://localhost:3000
   ```

> **Catatan:** File `.env` tidak akan di-upload ke GitHub karena berisi konfigurasi lokal/sensitif.

## Menjalankan Aplikasi

### Mode Development
Untuk menjalankan server development dengan Hot Module Replacement (HMR):

```bash
pnpm dev
```
Akses aplikasi di `http://localhost:5173`.

### Build untuk Production
Untuk mem-build aplikasi agar siap deploy:

```bash
pnpm build
```
File hasil build akan berada di folder `dist`.

### Preview Production Build
Untuk mencoba hasil build secara lokal:

```bash
pnpm preview
```

## Struktur Project

- `src/` - Source code aplikasi
- `public/` - Static assets
- `.env.example` - Template konfigurasi environment
