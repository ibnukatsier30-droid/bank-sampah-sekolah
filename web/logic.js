// Logika inti Aplikasi Bank Sampah Sekolah.
// Fungsi murni: tidak mengubah state lama, mengembalikan { ok, state } atau { ok:false, error }.
// Aturan mengikuti Dokumen Kebutuhan dan wireframe.

const SATUAN = ['kg', 'liter'];

function pembulatanKeBawah50(n) {
  return Math.floor(n / 50) * 50;
}

// Saran poin per satuan = persen dari batas bawah harga pengepul, dibulatkan ke bawah kelipatan 50.
function sarankanPoin(hargaMin, persen) {
  return pembulatanKeBawah50((hargaMin * persen) / 100);
}

function defaultState() {
  return {
    sekolah: { nama: 'SD Negeri 1 Contoh', bank: 'Bank Sampah Lestari', kode: 'BSL-001' },
    pengaturan: { persenPoin: 80, faktorJelantah: 0.9, kelas: [3, 4, 5, 6] },
    jenis: [
      { id: 'kardus', nama: 'Kardus/Box', satuan: 'kg', hargaMin: 1250, hargaMax: 1500, poin: 1000, aktif: true },
      { id: 'botol', nama: 'Botol plastik', satuan: 'kg', hargaMin: 3000, hargaMax: 3500, poin: 2400, aktif: true },
      { id: 'kertas', nama: 'Kertas HVS', satuan: 'kg', hargaMin: 2000, hargaMax: 2500, poin: 1600, aktif: true },
      { id: 'jelantah', nama: 'Minyak jelantah', satuan: 'liter', hargaMin: 3000, hargaMax: 4000, poin: 2400, aktif: true },
    ],
    setoran: [],
    penjualan: [],
    penarikan: [],
    target: {}, // { [kelas]: kg }
    hargaRiwayat: [],
    seq: 0,
  };
}

function nextId(state, awalan) {
  const seq = state.seq + 1;
  return { id: awalan + seq, seq };
}

function cariJenis(state, id) {
  return state.jenis.find((j) => j.id === id);
}

function aktif(list) {
  return list.filter((x) => !x.batal);
}

function saldoKelas(state, kelas) {
  const masuk = aktif(state.setoran).filter((s) => s.kelas === kelas).reduce((a, s) => a + s.poin, 0);
  const keluar = aktif(state.penarikan).filter((p) => p.kelas === kelas).reduce((a, p) => a + p.poin, 0);
  return masuk - keluar;
}

function poinBeredar(state) {
  return state.pengaturan.kelas.reduce((a, k) => a + saldoKelas(state, k), 0);
}

function saldoKas(state) {
  const masuk = aktif(state.penjualan).reduce((a, p) => a + p.uang, 0);
  const keluar = aktif(state.penarikan).reduce((a, p) => a + p.poin, 0);
  return masuk - keluar;
}

function stokJenis(state, jenisId) {
  const masuk = aktif(state.setoran).filter((s) => s.jenisId === jenisId).reduce((a, s) => a + s.qty, 0);
  const keluar = aktif(state.penjualan).filter((p) => p.jenisId === jenisId).reduce((a, p) => a + p.qty, 0);
  return masuk - keluar;
}

// Nilai stok dihitung konservatif memakai batas bawah harga pengepul.
function nilaiStok(state) {
  return state.jenis.reduce((a, j) => a + Math.max(0, stokJenis(state, j.id)) * j.hargaMin, 0);
}

// Cadangan program = saldo kas + nilai stok - poin beredar.
function cadanganProgram(state) {
  return saldoKas(state) + nilaiStok(state) - poinBeredar(state);
}

function tambahSetoran(state, { tgl, kelas, jenisId, qty, petugas, perwakilan }) {
  const jenis = cariJenis(state, jenisId);
  if (!jenis || !jenis.aktif) return { ok: false, error: 'Jenis sampah tidak tersedia.' };
  if (!state.pengaturan.kelas.includes(kelas)) return { ok: false, error: 'Kelas tidak ikut program.' };
  if (!(qty > 0)) return { ok: false, error: 'Jumlah harus lebih dari 0.' };
  if (!petugas || !String(petugas).trim()) return { ok: false, error: 'Nama petugas wajib diisi.' };
  const { id, seq } = nextId(state, 's');
  const entri = {
    id, tgl, kelas, jenisId, qty,
    poin: Math.round(qty * jenis.poin),
    petugas: String(petugas).trim(),
    perwakilan: perwakilan ? String(perwakilan).trim() : '',
    batal: null,
  };
  return { ok: true, state: { ...state, seq, setoran: [...state.setoran, entri] }, entri };
}

function validasiBatal({ alasan, catatan }) {
  if (!alasan) return 'Pilih alasan pembatalan.';
  if (!catatan || !String(catatan).trim()) return 'Catatan wajib diisi.';
  return null;
}

function batalkanSetoran(state, id, { alasan, catatan, tgl, oleh }) {
  const galat = validasiBatal({ alasan, catatan });
  if (galat) return { ok: false, error: galat };
  const s = state.setoran.find((x) => x.id === id);
  if (!s) return { ok: false, error: 'Setoran tidak ditemukan.' };
  if (s.batal) return { ok: false, error: 'Setoran sudah dibatalkan.' };
  if (saldoKelas(state, s.kelas) - s.poin < 0) {
    return { ok: false, error: 'Saldo kelas tidak cukup untuk membatalkan setoran ini.' };
  }
  const batal = { alasan, catatan: String(catatan).trim(), tgl, oleh: oleh || '' };
  return { ok: true, state: { ...state, setoran: state.setoran.map((x) => (x.id === id ? { ...x, batal } : x)) } };
}

function catatPenjualan(state, { tgl, jenisId, qty, uang, pengepul }) {
  const jenis = cariJenis(state, jenisId);
  if (!jenis) return { ok: false, error: 'Jenis sampah tidak ditemukan.' };
  if (!(qty > 0) || !(uang >= 0)) return { ok: false, error: 'Jumlah dan uang tidak valid.' };
  if (qty > stokJenis(state, jenisId)) return { ok: false, error: 'Jumlah melebihi stok.' };
  const { id, seq } = nextId(state, 'j');
  const entri = { id, tgl, jenisId, qty, uang, pengepul: pengepul || '', batal: null };
  return { ok: true, state: { ...state, seq, penjualan: [...state.penjualan, entri] }, entri };
}

function batalkanPenjualan(state, id, { alasan, catatan, tgl, oleh }) {
  const galat = validasiBatal({ alasan, catatan });
  if (galat) return { ok: false, error: galat };
  const p = state.penjualan.find((x) => x.id === id);
  if (!p) return { ok: false, error: 'Penjualan tidak ditemukan.' };
  if (p.batal) return { ok: false, error: 'Penjualan sudah dibatalkan.' };
  if (saldoKas(state) - p.uang < 0) return { ok: false, error: 'Kas program tidak cukup untuk membatalkan penjualan ini.' };
  const batal = { alasan, catatan: String(catatan).trim(), tgl, oleh: oleh || '' };
  return { ok: true, state: { ...state, penjualan: state.penjualan.map((x) => (x.id === id ? { ...x, batal } : x)) } };
}

function ajukanPenarikan(state, { tgl, kelas, poin, bendahara }) {
  if (!(poin > 0)) return { ok: false, error: 'Jumlah poin harus lebih dari 0.' };
  if (!bendahara || !String(bendahara).trim()) return { ok: false, error: 'Nama bendahara kelas wajib diisi.' };
  if (poin > saldoKelas(state, kelas)) return { ok: false, error: 'Saldo poin kelas tidak cukup.' };
  if (poin > saldoKas(state)) return { ok: false, error: 'Saldo kas program tidak cukup.' };
  const { id, seq } = nextId(state, 'p');
  const entri = { id, tgl, kelas, poin, bendahara: String(bendahara).trim(), batal: null };
  return { ok: true, state: { ...state, seq, penarikan: [...state.penarikan, entri] }, entri };
}

function batalkanPenarikan(state, id, { alasan, catatan, tgl, oleh }) {
  const galat = validasiBatal({ alasan, catatan });
  if (galat) return { ok: false, error: galat };
  const p = state.penarikan.find((x) => x.id === id);
  if (!p) return { ok: false, error: 'Penarikan tidak ditemukan.' };
  if (p.batal) return { ok: false, error: 'Penarikan sudah dibatalkan.' };
  const batal = { alasan, catatan: String(catatan).trim(), tgl, oleh: oleh || '' };
  return { ok: true, state: { ...state, penarikan: state.penarikan.map((x) => (x.id === id ? { ...x, batal } : x)) } };
}

// Ubah harga/poin hanya berlaku untuk setoran berikutnya (setoran lama menyimpan poinnya sendiri).
function ubahHarga(state, jenisId, { hargaMin, hargaMax, poin, tgl }) {
  const jenis = cariJenis(state, jenisId);
  if (!jenis) return { ok: false, error: 'Jenis sampah tidak ditemukan.' };
  if (!(hargaMin > 0) || !(hargaMax >= hargaMin)) return { ok: false, error: 'Rentang harga tidak valid.' };
  if (!(poin >= 0)) return { ok: false, error: 'Poin tidak valid.' };
  const riwayat = { tgl, jenisId, dari: { hargaMin: jenis.hargaMin, hargaMax: jenis.hargaMax, poin: jenis.poin }, ke: { hargaMin, hargaMax, poin } };
  return {
    ok: true,
    state: {
      ...state,
      jenis: state.jenis.map((j) => (j.id === jenisId ? { ...j, hargaMin, hargaMax, poin } : j)),
      hargaRiwayat: [riwayat, ...state.hargaRiwayat],
    },
  };
}

function tambahJenis(state, { nama, satuan, hargaMin, hargaMax }) {
  if (!nama || !String(nama).trim()) return { ok: false, error: 'Nama jenis wajib diisi.' };
  if (!SATUAN.includes(satuan)) return { ok: false, error: 'Satuan hanya kg atau liter.' };
  if (!(hargaMin > 0) || !(hargaMax >= hargaMin)) return { ok: false, error: 'Rentang harga tidak valid.' };
  const { id, seq } = nextId(state, 'k');
  const jenis = { id, nama: String(nama).trim(), satuan, hargaMin, hargaMax, poin: sarankanPoin(hargaMin, state.pengaturan.persenPoin), aktif: true };
  return { ok: true, state: { ...state, seq, jenis: [...state.jenis, jenis] }, jenis };
}

// Konversi untuk target kelas: kg tetap kg, liter jelantah dikali faktor kesepakatan sekolah.
function kgUntukTarget(state, setoran) {
  const jenis = cariJenis(state, setoran.jenisId);
  if (!jenis) return 0;
  return jenis.satuan === 'liter' ? setoran.qty * state.pengaturan.faktorJelantah : setoran.qty;
}

function bulanDari(tgl) {
  return String(tgl).slice(0, 7); // 'YYYY-MM'
}

function kgBulan(state, kelas, bulan) {
  return aktif(state.setoran)
    .filter((s) => s.kelas === kelas && bulanDari(s.tgl) === bulan)
    .reduce((a, s) => a + kgUntukTarget(state, s), 0);
}

function aturTarget(state, kelas, kg) {
  if (!state.pengaturan.kelas.includes(kelas)) return { ok: false, error: 'Kelas tidak ikut program.' };
  if (!(kg > 0)) return { ok: false, error: 'Target harus lebih dari 0.' };
  return { ok: true, state: { ...state, target: { ...state.target, [kelas]: kg } } };
}

function progresTarget(state, kelas, bulan) {
  const target = state.target[kelas];
  const kg = kgBulan(state, kelas, bulan);
  if (!target) return { kg, target: null, persen: null, tonggak: 0 };
  const persen = Math.min(100, Math.floor((kg / target) * 100));
  const tonggak = [25, 50, 75, 100].filter((t) => persen >= t).length;
  return { kg, target, persen, tonggak };
}

function ubahFaktorJelantah(state, faktor) {
  if (!(faktor > 0)) return { ok: false, error: 'Faktor harus lebih dari 0.' };
  return { ok: true, state: { ...state, pengaturan: { ...state.pengaturan, faktorJelantah: faktor } } };
}

function ubahPersenPoin(state, persen) {
  if (!(persen > 0 && persen <= 100)) return { ok: false, error: 'Persentase harus antara 1 dan 100.' };
  return { ok: true, state: { ...state, pengaturan: { ...state.pengaturan, persenPoin: persen } } };
}

function formatRp(n) {
  const neg = n < 0;
  const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-' : '') + 'Rp ' + s;
}

function formatAngka(n, desimal = 1) {
  return Number(n).toFixed(desimal).replace('.', ',');
}

module.exports = {
  SATUAN, sarankanPoin, defaultState, saldoKelas, poinBeredar, saldoKas, stokJenis, nilaiStok, cadanganProgram,
  tambahSetoran, batalkanSetoran, catatPenjualan, batalkanPenjualan, ajukanPenarikan, batalkanPenarikan,
  ubahHarga, tambahJenis, kgUntukTarget, kgBulan, aturTarget, progresTarget, ubahFaktorJelantah, ubahPersenPoin,
  formatRp, formatAngka,
};
