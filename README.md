# Daftar Tugas

Aplikasi daftar tugas tanpa dependensi runtime. Data disimpan di `localStorage` browser.

## Fitur
- Drag and drop untuk mengurutkan tugas
- Tenggat tanggal dan waktu dengan pengingat saat halaman terbuka
- Kategori dan prioritas
- Pencarian berdasarkan judul atau kategori
- Tema terang/gelap yang tersimpan di perangkat
- Progress penyelesaian, filter, hapus, dan reset
- Ekspor dan impor JSON, dengan pilihan mengganti atau menambahkan daftar

Pengingat menggunakan timer halaman. Browser dapat menunda timer saat halaman tidak aktif; pengingat tidak berjalan setelah tab atau browser ditutup.

## Struktur
- `index.html`
- `css/style.css`
- `js/storage.js` (localStorage dan JSON)
- `js/app.js` (state, render, urutan)
- `js/main.js` (interaksi, tema, pengingat)
- `assets/favicon.svg`

## Menjalankan
Buka `index.html` langsung di browser, atau jalankan server lokal:

```sh
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

Pemeriksaan sintaks JavaScript tersedia melalui `npm run check` (Node.js 18+; tanpa dependency tambahan).