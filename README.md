# Merchant Orchestrator — Frontend

Dashboard web untuk mengelola merchant, memantau transaksi, dan mengoperasikan integrasi pembayaran melalui **Cashin Reverse Integration Middleware**.

---

## Daftar Isi

- [Arsitektur](#arsitektur)
- [Fitur Utama](#fitur-utama)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Menjalankan dengan Docker](#menjalankan-dengan-docker)
- [Autentikasi & Role](#autentikasi--role)

---

## Arsitektur

```
Browser (Next.js App)
        │
        │  HTTP / REST
        ▼
Cashin Reverse Integration Middleware  (NEXT_PUBLIC_API_URL, default: http://localhost:8080)
        │
        ├── Merchant Registry
        ├── Transaction Engine
        └── DLQ / Retry Queue
```

State management menggunakan **Zustand** dengan service layer terpisah (`services/`) yang bertugas melakukan pemanggilan API dan memetakan respons ke tipe internal aplikasi.

Autentikasi berbasis **JWT token** yang disimpan di cookie (`mo_token`) dan diproteksi melalui Next.js middleware.

---

## Fitur Utama

| Fitur | Keterangan |
|---|---|
| **Dashboard Overview** | Metrik ringkasan transaksi, chart, dan status sistem |
| **Manajemen Merchant** | CRUD merchant beserta konfigurasi adapter REST API / Pull |
| **Monitoring Transaksi** | Daftar transaksi dengan filter, pencarian, dan detail lifecycle |
| **Dead Letter Queue** | Kelola transaksi gagal dan antrian retry |
| **Gateway Actions** | Retry, force complete, force fail, kirim ke manual review |
| **Simulator** | Simulasi alur pembayaran end-to-end |
| **Portal Merchant** | Antarmuka terpisah untuk akun bertipe merchant |

---

## Struktur Proyek

```
merchant-orchestrator-fe/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Halaman login
│   ├── login-form.tsx          # Komponen form login
│   ├── dashboard/              # Rute admin (protected)
│   │   ├── page.tsx            # Overview & metrik
│   │   ├── transactions/       # Daftar & detail transaksi
│   │   ├── merchants/          # Manajemen merchant
│   │   ├── merchant-registry/  # Registry konfigurasi merchant
│   │   ├── monitoring/         # Monitoring real-time
│   │   ├── dlq/                # Dead Letter Queue
│   │   ├── simulator/          # Simulator pembayaran
│   │   └── settings/           # Pengaturan aplikasi
│   ├── merchant/               # Rute portal merchant (protected)
│   │   ├── page.tsx            # Dashboard merchant
│   │   ├── transactions/       # Riwayat transaksi merchant
│   │   └── dlq/                # DLQ merchant
│   └── pay/                    # Halaman pembayaran publik
├── services/                   # Layer pemanggilan API
│   ├── merchantApi.ts          # API calls merchant
│   ├── merchantService.ts      # Business logic merchant (Zustand)
│   ├── transactionApi.ts       # API calls transaksi
│   └── transactionService.ts   # Business logic transaksi (Zustand)
├── store/
│   └── index.ts                # Zustand global store
├── components/                 # Komponen UI reusable
├── lib/                        # Utilitas: mapper, permissions, dll
├── types/                      # TypeScript type definitions
├── middleware.ts               # Auth guard & route protection
├── next.config.ts              # Konfigurasi Next.js (standalone)
├── Dockerfile                  # Multi-stage Docker build
└── .env.local.example          # Contoh variabel lingkungan
```

---

## Prasyarat

| Kebutuhan | Versi minimum |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Docker *(opsional)* | 24.x |
| Backend Middleware | Harus berjalan di URL yang dikonfigurasi |

---

## Variabel Lingkungan

Salin file contoh lalu sesuaikan nilainya:

```bash
cp .env.local.example .env.local
```

| Variabel | Default | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Base URL backend Cashin Reverse Integration Middleware |

> **Catatan:** Prefix `NEXT_PUBLIC_` berarti variabel ini di-*embed* ke dalam bundle JavaScript saat **build time**. Mengubah nilai variabel ini mengharuskan rebuild aplikasi.

---

## Menjalankan Secara Lokal

### 1. Install dependensi

```bash
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.local.example .env.local
# Edit .env.local dan sesuaikan NEXT_PUBLIC_API_URL
```

### 3. Jalankan development server

```bash
npm run dev
```

Aplikasi akan berjalan di **[http://localhost:3000](http://localhost:3000)**.

### 4. Build production (opsional)

```bash
npm run build
npm start
```

---

## Menjalankan dengan Docker

### Build image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -t merchant-orchestrator-fe \
  .
```

Ganti nilai `NEXT_PUBLIC_API_URL` dengan URL backend yang sesuai dengan environment target.

### Jalankan container

```bash
docker run -p 3000:3000 merchant-orchestrator-fe
```

Aplikasi dapat diakses di **[http://localhost:3000](http://localhost:3000)**.

### Menggunakan Docker Compose (contoh)

Buat file `docker-compose.yml`:

```yaml
services:
  frontend:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: http://middleware:8080
    ports:
      - "3000:3000"
    depends_on:
      - middleware

  middleware:
    image: cashin-reverse-integration-mw:latest
    ports:
      - "8080:8080"
```

Lalu jalankan:

```bash
docker compose up --build
```

> **Catatan penting:** Karena `NEXT_PUBLIC_API_URL` di-*bake* saat build, nilai ini harus diberikan melalui `--build-arg` (atau field `args` pada docker-compose), **bukan** melalui `-e` saat runtime.

---

## Autentikasi & Role

Aplikasi mendukung dua jenis akun:

| Role | Rute | Akses |
|---|---|---|
| `admin` | `/dashboard/*` | Full access: merchant, transaksi, DLQ, monitoring, gateway actions |
| `merchant` | `/merchant/*` | Terbatas: lihat transaksi & DLQ milik sendiri |

Login menggunakan token JWT yang disimpan di cookie `mo_token`. Next.js middleware secara otomatis memproteksi rute dan melakukan redirect berdasarkan role.

---