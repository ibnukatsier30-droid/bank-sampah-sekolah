const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/logic');

const TGL = '2026-11-21';
const batal = { alasan: 'Salah berat', catatan: 'Seharusnya 1,5 kg', tgl: TGL, oleh: 'Pengelola' };

function setor(state, o) {
  const r = L.tambahSetoran(state, { tgl: TGL, petugas: 'Pak Budi', ...o });
  assert.ok(r.ok, r.error);
  return r.state;
}

test('saran poin: 80% dari batas bawah, dibulatkan ke bawah kelipatan 50', () => {
  assert.equal(L.sarankanPoin(1250, 80), 1000);
  assert.equal(L.sarankanPoin(3000, 80), 2400);
  assert.equal(L.sarankanPoin(1330, 80), 1050);
});

test('setoran menambah saldo kelas sesuai poin jenis', () => {
  let s = L.defaultState();
  s = setor(s, { kelas: 5, jenisId: 'kardus', qty: 2.5 });
  assert.equal(L.saldoKelas(s, 5), 2500);
  assert.equal(L.saldoKelas(s, 3), 0);
});

test('setoran ditolak: petugas kosong, jumlah 0, kelas tidak ikut', () => {
  const s = L.defaultState();
  assert.equal(L.tambahSetoran(s, { tgl: TGL, kelas: 5, jenisId: 'kardus', qty: 1, petugas: '  ' }).ok, false);
  assert.equal(L.tambahSetoran(s, { tgl: TGL, kelas: 5, jenisId: 'kardus', qty: 0, petugas: 'A' }).ok, false);
  assert.equal(L.tambahSetoran(s, { tgl: TGL, kelas: 1, jenisId: 'kardus', qty: 1, petugas: 'A' }).ok, false);
});

test('perwakilan murid boleh kosong', () => {
  const s = setor(L.defaultState(), { kelas: 4, jenisId: 'botol', qty: 1 });
  assert.equal(s.setoran[0].perwakilan, '');
});

test('pembatalan setoran wajib alasan dan catatan, data tidak dihapus', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 2.5 });
  assert.equal(L.batalkanSetoran(s, 's1', { ...batal, catatan: '' }).ok, false);
  assert.equal(L.batalkanSetoran(s, 's1', { ...batal, alasan: '' }).ok, false);
  const r = L.batalkanSetoran(s, 's1', batal);
  assert.ok(r.ok);
  assert.equal(r.state.setoran.length, 1);
  assert.equal(r.state.setoran[0].batal.alasan, 'Salah berat');
  assert.equal(L.saldoKelas(r.state, 5), 0);
  assert.equal(L.batalkanSetoran(r.state, 's1', batal).ok, false);
});

test('harga berubah hanya berlaku untuk setoran berikutnya', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 1 });
  const r = L.ubahHarga(s, 'kardus', { hargaMin: 2000, hargaMax: 2200, poin: 1600, tgl: TGL });
  s = r.state;
  s = setor(s, { kelas: 5, jenisId: 'kardus', qty: 1 });
  assert.equal(L.saldoKelas(s, 5), 1000 + 1600);
  assert.equal(s.hargaRiwayat.length, 1);
});

test('penjualan butuh stok, menambah kas, dan bisa dibatalkan', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 20 });
  assert.equal(L.catatPenjualan(s, { tgl: TGL, jenisId: 'kardus', qty: 25, uang: 1 }).ok, false);
  const r = L.catatPenjualan(s, { tgl: TGL, jenisId: 'kardus', qty: 20, uang: 27000, pengepul: 'CV A' });
  assert.ok(r.ok);
  s = r.state;
  assert.equal(L.saldoKas(s), 27000);
  assert.equal(L.stokJenis(s, 'kardus'), 0);
  const b = L.batalkanPenjualan(s, 'j2', batal);
  assert.ok(b.ok);
  assert.equal(L.saldoKas(b.state), 0);
  assert.equal(L.stokJenis(b.state, 'kardus'), 20);
});

test('penarikan ditolak jika saldo kelas atau kas program tidak cukup', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 20 }); // 20.000 poin
  // kas masih 0
  assert.equal(L.ajukanPenarikan(s, { tgl: TGL, kelas: 5, poin: 1000, bendahara: 'Siti' }).ok, false);
  s = L.catatPenjualan(s, { tgl: TGL, jenisId: 'kardus', qty: 20, uang: 27000 }).state;
  assert.equal(L.ajukanPenarikan(s, { tgl: TGL, kelas: 5, poin: 25000, bendahara: 'Siti' }).ok, false); // saldo kelas 20.000
  assert.equal(L.ajukanPenarikan(s, { tgl: TGL, kelas: 5, poin: 1000, bendahara: '' }).ok, false);
  const r = L.ajukanPenarikan(s, { tgl: TGL, kelas: 5, poin: 15000, bendahara: 'Siti' });
  assert.ok(r.ok);
  assert.equal(L.saldoKelas(r.state, 5), 5000);
  assert.equal(L.saldoKas(r.state), 12000);
});

test('pembatalan penarikan mengembalikan poin dan kas', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 20 });
  s = L.catatPenjualan(s, { tgl: TGL, jenisId: 'kardus', qty: 20, uang: 27000 }).state;
  s = L.ajukanPenarikan(s, { tgl: TGL, kelas: 5, poin: 15000, bendahara: 'Siti' }).state;
  const b = L.batalkanPenarikan(s, 'p3', batal);
  assert.ok(b.ok);
  assert.equal(L.saldoKelas(b.state, 5), 20000);
  assert.equal(L.saldoKas(b.state), 27000);
});

test('pembatalan penjualan ditolak jika kas tidak cukup', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 20 });
  s = L.catatPenjualan(s, { tgl: TGL, jenisId: 'kardus', qty: 20, uang: 27000 }).state;
  s = L.ajukanPenarikan(s, { tgl: TGL, kelas: 5, poin: 20000, bendahara: 'Siti' }).state;
  assert.equal(L.batalkanPenjualan(s, 'j2', batal).ok, false);
});

test('cadangan program = kas + nilai stok - poin beredar', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'kardus', qty: 10 }); // poin 10.000, stok 10 kg x 1.250
  assert.equal(L.cadanganProgram(s), 0 + 12500 - 10000);
});

test('jelantah: poin per liter, target dihitung kg memakai faktor kesepakatan', () => {
  let s = setor(L.defaultState(), { kelas: 5, jenisId: 'jelantah', qty: 3 });
  assert.equal(L.saldoKelas(s, 5), 7200);
  assert.ok(Math.abs(L.kgBulan(s, 5, '2026-11') - 2.7) < 1e-9);
  s = L.ubahFaktorJelantah(s, 0.92).state;
  assert.ok(Math.abs(L.kgBulan(s, 5, '2026-11') - 2.76) < 1e-9);
  assert.equal(L.saldoKelas(s, 5), 7200); // poin tidak berubah
});

test('target kelas: progres, tonggak, dan batas 100%', () => {
  let s = L.defaultState();
  s = L.aturTarget(s, 5, 40).state;
  s = setor(s, { kelas: 5, jenisId: 'kardus', qty: 28 });
  let p = L.progresTarget(s, 5, '2026-11');
  assert.equal(p.persen, 70);
  assert.equal(p.tonggak, 2);
  s = setor(s, { kelas: 5, jenisId: 'kardus', qty: 30 });
  p = L.progresTarget(s, 5, '2026-11');
  assert.equal(p.persen, 100);
  assert.equal(p.tonggak, 4);
  assert.equal(L.progresTarget(s, 3, '2026-11').target, null);
  assert.equal(L.aturTarget(s, 5, 0).ok, false);
});

test('tambah jenis: satuan hanya kg atau liter, poin disarankan', () => {
  const s = L.defaultState();
  assert.equal(L.tambahJenis(s, { nama: 'Botol kaca', satuan: 'buah', hargaMin: 500, hargaMax: 700 }).ok, false);
  const r = L.tambahJenis(s, { nama: 'Aluminium', satuan: 'kg', hargaMin: 10000, hargaMax: 12000 });
  assert.ok(r.ok);
  assert.equal(r.jenis.poin, 8000);
});

test('format angka Indonesia', () => {
  assert.equal(L.formatRp(105000), 'Rp 105.000');
  assert.equal(L.formatRp(0), 'Rp 0');
  assert.equal(L.formatAngka(2.7), '2,7');
  assert.equal(L.formatAngka(86.5), '86,5');
});
