# Bank Sampah Sekolah

Aplikasi HP untuk bank sampah sekolah dasar (Expo / React Native). Dibangun dari wireframe 52 layar dan Dokumen Kebutuhan.

## Status

| Bagian | Keadaan |
| --- | --- |
| Logika inti (`src/logic.js`) | Selesai, 15 tes lulus |
| Layar aplikasi | Belum dibuat |
| Data online (Firebase) | Tahap kedua |
| Proyek Expo dan build APK | Menunggu proyek Expo dibuat |

## Menjalankan tes logika

```
node --test tests/logic.test.js
```

## Aturan yang sudah diterapkan di logika

- 1 poin = Rp 1. Poin per satuan disarankan 80% dari batas bawah harga pengepul, dibulatkan ke bawah kelipatan 50.
- Satuan hanya kg dan liter. Jelantah dalam liter, dikonversi ke kg hanya untuk target kelas memakai faktor kesepakatan sekolah (awal 0,9). Poin tidak terpengaruh.
- Setoran, penjualan, dan penarikan tidak dihapus. Hanya dibatalkan dengan alasan dan catatan wajib.
- Penarikan ditolak jika saldo kelas atau kas program tidak cukup. Pembatalan penjualan ditolak jika kas tidak cukup.
- Perubahan harga hanya berlaku untuk setoran berikutnya, dan riwayatnya tersimpan.
- Cadangan program = saldo kas + nilai stok - poin beredar.
- Target kelas dibandingkan dengan dirinya sendiri, tanpa peringkat antarkelas.
