(function () {
  var L = window.Logic;
  var KUNCI = 'bank-sampah-state-v1';
  var C_HIJAU = '#1F6B4F';

  function akunAwal() {
    var w = [3, 4, 5, 6].map(function (k) { return { id: 'a' + k, peran: 'wali', kelas: k, nama: 'wali.kelas' + k, pin: '123456' }; });
    return [{ id: 'a0', peran: 'pengelola', nama: 'pengelola.bsl', pin: '123456' }].concat(w);
  }
  function stateAwal() { var s = L.defaultState(); s.akun = akunAwal(); return s; }
  var S;
  try { S = JSON.parse(localStorage.getItem(KUNCI)); } catch (e) { S = null; }
  if (!S || !S.akun) S = stateAwal();
  function simpan() { try { localStorage.setItem(KUNCI, JSON.stringify(S)); } catch (e) {} }
  function jalan(fn) { var r = fn(S); if (r.ok) { S = r.state; simpan(); } else { alert(r.error); } return r; }

  var sesi = null; // akun
  var tumpuk = [{ n: 'login', p: {} }];
  var F = {}; // nilai isian
  var tampil = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hariIni() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function tgl(t) { var p = String(t).split('-'); return +p[2] + ' ' + BLN[+p[1] - 1] + ' ' + p[0]; }
  function angka(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : NaN; }
  function bulan() { return hariIni().slice(0, 7); }
  function jenis(id) { return S.jenis.find(function (j) { return j.id === id; }) || { nama: id, satuan: 'kg' }; }
  function f(k, d) { return F[k] !== undefined ? F[k] : d; }

  // ---------- komponen ----------
  function hd(judul, sub, back) {
    return '<div class="hd">' + (back ? '<button class="back" data-a="kembali">‹ ' + esc(back) + '</button>' : '') +
      (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '<div class="t">' + esc(judul) + '</div></div>';
  }
  function isi(h) { return '<div class="bd">' + h + '</div>'; }
  function card(h, g) { return '<div class="card' + (g ? ' g' : '') + '">' + h + '</div>'; }
  function row(k, r, strike, warna) { return '<div class="row' + (strike ? ' strike' : '') + '"><span>' + esc(k) + '</span><span class="r"' + (warna ? ' style="color:' + warna + '"' : '') + '>' + esc(r) + '</span></div>'; }
  function chips(nama, opsi, nilai) {
    return '<div class="chips">' + opsi.map(function (o) {
      return '<button class="chip' + (String(o.k) === String(nilai) ? ' on' : '') + '" data-a="pilih" data-n="' + nama + '" data-v="' + esc(o.k) + '">' + esc(o.l) + '</button>';
    }).join('') + '</div>';
  }
  function fld(id, label, v, o) {
    o = o || {};
    return '<div class="fld"><label class="lb" for="' + id + '">' + esc(label) + '</label><input id="' + id + '" data-f="' + id + '" value="' + esc(v) + '"' +
      (o.angka ? ' inputmode="decimal"' : '') + (o.pin ? ' type="password" inputmode="numeric" maxlength="6"' : '') +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.pin ? '' : ' autocomplete="off"') + '></div>';
  }
  function btn(label, a, o, extra) { return '<button class="btn ' + (o || '') + '" data-a="' + a + '" ' + (extra || '') + '>' + esc(label) + '</button>'; }
  function note(h, ok) { return '<div class="note' + (ok ? ' ok' : '') + '">' + h + '</div>'; }
  function mut(h) { return '<div class="mut">' + h + '</div>'; }
  var kelasOpsi = function () { return S.pengaturan.kelas.map(function (k) { return { k: k, l: 'Kelas ' + k }; }); };
  var TITIK = '• • • • • •';

  // ---------- layar umum ----------
  var V = {};
  V.login = function () {
    return hd(S.sekolah.bank, 'Masuk') + isi(
      fld('kode', 'Kode sekolah', f('kode', ''), { ph: 'Contoh: BSL-001' }) +
      fld('nama', 'Nama pengguna', f('nama', ''), { ph: 'Contoh: wali.kelas3' }) +
      fld('pin', 'PIN (6 angka)', f('pin', ''), { pin: 1 }) +
      btn('Masuk', 'masuk') +
      card('<div class="lb">Versi uji coba</div>' + mut('Data tersimpan di peramban ini saja. Kode BSL-001, pengguna pengelola.bsl atau wali.kelas3 sampai wali.kelas6, PIN 123456.') +
        btn('Isi otomatis sebagai pengelola', 'isi', 't', 'data-v="pengelola.bsl"') + btn('Isi otomatis sebagai wali kelas 3', 'isi', 't', 'data-v="wali.kelas3"')) +
      note('Ganti PIN bawaan lewat Pengaturan, Kelola Akun, sebelum dipakai sungguhan.'));
  };

  // ---------- pengelola ----------
  V.beranda = function () {
    var b = bulan(), total = S.pengaturan.kelas.reduce(function (a, k) { return a + L.kgBulan(S, k, b); }, 0);
    var ks = S.pengaturan.kelas;
    return hd(S.sekolah.bank, S.sekolah.nama + ' · ' + sesi.nama) + isi(
      card('<div class="mut">Total sampah terkumpul bulan ini</div><div class="big">' + L.formatAngka(total) + ' kg</div>' + mut('dari ' + ks.length + ' kelas (kelas ' + ks[0] + ' sampai ' + ks[ks.length - 1] + ')')) +
      (S.setoran.length === 0 ? card('<div class="lb">Mulai dari sini</div>' + mut('1. Cek daftar harga. 2. Pastikan akun wali kelas ada di Pengaturan. 3. Catat setoran pertama.')) : '') +
      '<div class="sec">Capaian tiap kelas</div>' +
      card(ks.map(function (k) {
        var p = L.progresTarget(S, k, b);
        return row('Kelas ' + k, p.target ? L.formatAngka(p.kg) + ' dari ' + L.formatAngka(p.target, 0) + ' kg (' + p.persen + '%)' : L.formatAngka(p.kg) + ' kg · belum ada target');
      }).join('')) +
      btn('Catat Setoran', 'tab', '', 'data-v="setor"') + btn('Daftar Harga', 'ke', 'o', 'data-v="harga"') + btn('Pengaturan', 'ke', 'o', 'data-v="pengaturan"') + btn('Keluar', 'keluar', 't'));
  };

  V.setor = function () {
    var aktif = S.jenis.filter(function (j) { return j.aktif; });
    var kelas = f('s_kelas', S.pengaturan.kelas[0]), jid = f('s_jenis', aktif[0] && aktif[0].id), j = jenis(jid);
    var n = angka(f('s_qty', '')), poin = n > 0 ? Math.round(n * j.poin) : 0;
    return hd('Catat Setoran', 'Di titik setor') + isi(
      '<div class="lb">Kelas</div>' + chips('s_kelas', kelasOpsi(), kelas) +
      '<div class="lb">Jenis sampah</div>' + chips('s_jenis', aktif.map(function (x) { return { k: x.id, l: x.nama }; }), jid) +
      fld('s_qty', 'Jumlah (' + j.satuan + ')', f('s_qty', ''), { angka: 1, ph: 'Contoh: 2,5' }) +
      fld('s_petugas', 'Nama petugas penimbang', f('s_petugas', sesi.nama), { ph: 'Wajib diisi' }) +
      fld('s_wakil', 'Perwakilan kelas (opsional)', f('s_wakil', ''), { ph: 'Boleh dikosongkan' }) +
      note('Total untuk Kelas ' + kelas + ': <b>+' + poin + ' poin</b>' + (j.satuan === 'liter' && n > 0 ? '<br>Untuk target kelas dihitung ' + L.formatAngka(n * S.pengaturan.faktorJelantah) + ' kg (1 liter = ' + L.formatAngka(S.pengaturan.faktorJelantah, 2) + ' kg)' : ''), true) +
      btn('Simpan Setoran', 'simpanSetor'));
  };
  V.setorBerhasil = function (p) {
    var e = S.setoran.find(function (x) { return x.id === p.id; }); if (!e) return '';
    return hd('Setoran Tersimpan') + isi(note('Tunjukkan layar ini kepada perwakilan kelas untuk dicek bersama.', true) +
      card(row('Tanggal', tgl(e.tgl)) + row('Kelas', 'Kelas ' + e.kelas) + row('Jenis', jenis(e.jenisId).nama) + row('Jumlah', L.formatAngka(e.qty) + ' ' + jenis(e.jenisId).satuan) +
        row('Poin masuk', '+' + e.poin, 0, C_HIJAU) + row('Saldo kelas sekarang', L.saldoKelas(S, e.kelas) + ' poin') + row('Petugas', e.petugas)) +
      btn('Catat Setoran Lagi', 'tab', '', 'data-v="setor"') + btn('Lihat Riwayat', 'tab', 'o', 'data-v="riwayat"') +
      btn('Salah catat? Batalkan setoran', 'ke', 't', 'data-v="batal" data-tipe="setoran" data-id="' + e.id + '"'));
  };
  function batalInfo(x) { return x.batal ? mut('Dibatalkan: ' + esc(x.batal.alasan) + '. ' + esc(x.batal.catatan) + (x.batal.oleh ? ' (' + esc(x.batal.oleh) + ')' : '')) : ''; }
  V.riwayat = function () {
    var kf = f('r_kelas', 0);
    var d = S.setoran.slice().reverse().filter(function (x) { return !+kf || x.kelas === +kf; });
    return hd('Riwayat Setoran') + isi(chips('r_kelas', [{ k: 0, l: 'Semua' }].concat(kelasOpsi()), kf) +
      (d.length ? '' : mut('Belum ada setoran.')) +
      d.map(function (x) {
        return card(row(tgl(x.tgl) + ' · Kelas ' + x.kelas, jenis(x.jenisId).nama + ' ' + L.formatAngka(x.qty) + ' ' + jenis(x.jenisId).satuan + '  +' + x.poin, !!x.batal) + batalInfo(x) +
          (x.batal ? '' : btn('Batalkan', 'ke', 't', 'data-v="batal" data-tipe="setoran" data-id="' + x.id + '"')));
      }).join(''));
  };
  var ALASAN = { setoran: ['Salah berat', 'Salah jenis', 'Salah kelas', 'Lainnya'], penjualan: ['Salah berat', 'Salah harga', 'Salah jenis', 'Lainnya'], penarikan: ['Salah jumlah', 'Salah kelas', 'Uang tidak jadi diserahkan', 'Lainnya'] };
  V.batal = function (p) {
    var al = f('b_alasan', ALASAN[p.tipe][0]), jd = { setoran: 'Batalkan Setoran', penjualan: 'Batalkan Penjualan', penarikan: 'Batalkan Penarikan' }[p.tipe];
    return hd(jd, '', 'Kembali') + isi('<div class="lb">Alasan pembatalan</div>' + chips('b_alasan', ALASAN[p.tipe].map(function (a) { return { k: a, l: a }; }), al) +
      fld('b_catatan', 'Catatan (wajib diisi)', f('b_catatan', ''), { ph: 'Contoh: seharusnya 1,5 kg' }) +
      note('Data tidak dihapus. Catatan tetap tampil di riwayat dengan tanda dibatalkan, lengkap dengan alasan dan nama pembatalnya.') +
      btn(jd, 'simpanBatal', 'r') + btn('Kembali', 'kembali', 't'));
  };
  V.tarik = function () {
    var k = f('t_kelas', S.pengaturan.kelas[0]);
    return hd('Tarik Poin') + isi(chips('t_kelas', kelasOpsi(), k) +
      card(row('Saldo poin Kelas ' + k, L.saldoKelas(S, k) + ' poin') + row('Kas program', L.formatRp(L.saldoKas(S)))) +
      fld('t_poin', 'Jumlah poin yang ditarik', f('t_poin', ''), { angka: 1, ph: '1 poin = Rp 1' }) +
      fld('t_bend', 'Nama bendahara kelas', f('t_bend', ''), { ph: 'Wajib diisi' }) +
      btn('Ajukan Penarikan', 'simpanTarik') + '<div class="sec">Penarikan sebelumnya</div>' +
      (S.penarikan.length ? '' : mut('Belum ada penarikan.')) +
      S.penarikan.slice().reverse().map(function (x) {
        return card(row(tgl(x.tgl) + ' · Kelas ' + x.kelas, '-' + x.poin + ' poin', !!x.batal) + batalInfo(x) + (x.batal ? '' : btn('Batalkan', 'ke', 't', 'data-v="batal" data-tipe="penarikan" data-id="' + x.id + '"')));
      }).join(''));
  };
  V.tarikBerhasil = function (p) {
    var x = S.penarikan.find(function (y) { return y.id === p.id; }); if (!x) return '';
    return hd('Bukti Penarikan') + isi(note('Serahkan uang dan minta kedua tanda tangan.', true) +
      card(row('Tanggal', tgl(x.tgl)) + row('Kelas', 'Kelas ' + x.kelas) + row('Poin ditarik', x.poin + ' poin') + row('Uang diserahkan', L.formatRp(x.poin)) +
        row('Sisa saldo kelas', L.saldoKelas(S, x.kelas) + ' poin') + row('Saldo kas program', L.formatRp(L.saldoKas(S)))) +
      card('<div class="lb">Tanda terima</div><div class="sig"><div>Bendahara kelas: ' + esc(x.bendahara) + '</div><div>Disetujui pengelola</div></div>') +
      btn('Selesai', 'tab', '', 'data-v="tarik"') + btn('Salah catat? Batalkan penarikan', 'ke', 't', 'data-v="batal" data-tipe="penarikan" data-id="' + x.id + '"'));
  };
  V.kas = function () {
    var cad = L.cadanganProgram(S);
    return hd('Kas Program') + isi(
      card('<div class="mut">Saldo kas program</div><div class="big">' + L.formatRp(L.saldoKas(S)) + '</div>', 1) +
      card(row('Nilai stok (harga batas bawah)', L.formatRp(L.nilaiStok(S))) + row('Poin beredar', L.formatRp(L.poinBeredar(S))) + row('Cadangan program', L.formatRp(cad), 0, cad < 0 ? '#B3261E' : C_HIJAU)) +
      (cad < 0 ? note('Cadangan negatif: kas dan stok belum cukup untuk membayar semua poin kelas.') : '') +
      btn('Catat Penjualan ke Pengepul', 'ke', '', 'data-v="penjualan"') + btn('Rekap Bulan Ini', 'ke', 'o', 'data-v="rekap"') + btn('Cek Uang Tunai', 'ke', 'o', 'data-v="cekKas"') +
      '<div class="sec">Penjualan</div>' + (S.penjualan.length ? '' : mut('Belum ada penjualan.')) +
      S.penjualan.slice().reverse().map(function (x) {
        return card(row(tgl(x.tgl) + ' · ' + jenis(x.jenisId).nama + ' ' + L.formatAngka(x.qty) + ' ' + jenis(x.jenisId).satuan, '+' + L.formatRp(x.uang), !!x.batal) + batalInfo(x) +
          (x.batal ? '' : btn('Batalkan', 'ke', 't', 'data-v="batal" data-tipe="penjualan" data-id="' + x.id + '"')));
      }).join(''));
  };
  V.penjualan = function () {
    var jid = f('p_jenis', S.jenis[0].id), j = jenis(jid);
    return hd('Catat Penjualan', '', 'Kas Program') + isi(chips('p_jenis', S.jenis.map(function (x) { return { k: x.id, l: x.nama }; }), jid) +
      mut('Stok tersedia: ' + L.formatAngka(L.stokJenis(S, jid)) + ' ' + j.satuan) +
      fld('p_qty', 'Jumlah dijual (' + j.satuan + ')', f('p_qty', ''), { angka: 1 }) + fld('p_uang', 'Uang diterima (Rp)', f('p_uang', ''), { angka: 1 }) +
      fld('p_pengepul', 'Nama pengepul (opsional)', f('p_pengepul', '')) + btn('Simpan Penjualan', 'simpanJual'));
  };
  V.rekap = function () {
    var b = bulan(), total = S.pengaturan.kelas.reduce(function (a, k) { return a + L.kgBulan(S, k, b); }, 0);
    var lit = S.setoran.filter(function (x) { return !x.batal && x.tgl.slice(0, 7) === b && jenis(x.jenisId).satuan === 'liter'; }).reduce(function (a, x) { return a + x.qty; }, 0);
    return hd('Rekap ' + b, '', 'Kas Program') + isi(card('<div class="mut">Total sampah terkumpul</div><div class="big">' + L.formatAngka(total) + ' kg</div>', 1) +
      '<div class="sec">Per kelas</div>' + card(S.pengaturan.kelas.map(function (k) {
        var p = L.progresTarget(S, k, b); return row('Kelas ' + k, p.target ? L.formatAngka(p.kg) + ' dari ' + L.formatAngka(p.target, 0) + ' kg (' + p.persen + '%)' : L.formatAngka(p.kg) + ' kg · belum ada target');
      }).join('')) + (lit > 0 ? mut('Termasuk minyak jelantah ' + L.formatAngka(lit) + ' liter, dihitung ' + L.formatAngka(S.pengaturan.faktorJelantah, 2) + ' kg per liter.') : '') +
      card(row('Saldo kas program', L.formatRp(L.saldoKas(S))) + row('Poin beredar', L.formatRp(L.poinBeredar(S)))));
  };
  V.cekKas = function () {
    var cat = L.saldoKas(S), n = angka(f('c_uang', '')), sel = isFinite(n) ? n - cat : null;
    return hd('Cek Uang Tunai', '', 'Kas Program') + isi(mut('Cocokkan catatan aplikasi dengan uang yang benar-benar ada. Lakukan sebulan sekali dan hitung bersama satu orang lain.') +
      card(row('Catatan kas program', L.formatRp(cat))) + fld('c_uang', 'Uang tunai yang dihitung (Rp)', f('c_uang', ''), { angka: 1 }) +
      (sel !== null ? note(sel === 0 ? 'Selisih Rp 0 · cocok' : 'Selisih ' + L.formatRp(sel) + '. Catat alasannya.', sel === 0) : ''));
  };
  V.harga = function () {
    return hd('Daftar Harga', '', 'Kembali') + isi(mut('Poin kelas disarankan ' + S.pengaturan.persenPoin + '% dari batas bawah harga pengepul. Perubahan hanya berlaku untuk setoran berikutnya.') +
      S.jenis.map(function (j) {
        return card(row(j.nama + ' (per ' + j.satuan + ')', 'Pengepul ' + L.formatRp(j.hargaMin) + ' - ' + L.formatRp(j.hargaMax)) + row('Poin untuk kelas', j.poin + ' poin', 0, C_HIJAU) +
          btn('Ubah', 'ke', 't', 'data-v="ubahHarga" data-id="' + j.id + '"'));
      }).join('') + btn('Tambah Jenis Sampah', 'ke', '', 'data-v="tambahJenis"') + '<div class="sec">Riwayat perubahan</div>' +
      (S.hargaRiwayat.length ? '' : mut('Belum ada perubahan.')) +
      S.hargaRiwayat.slice(0, 10).map(function (h) { return card(mut(tgl(h.tgl) + ' · ' + esc(jenis(h.jenisId).nama) + ': poin ' + h.dari.poin + ' menjadi ' + h.ke.poin)); }).join(''));
  };
  V.ubahHarga = function (p) {
    var j = jenis(p.id), mn = f('h_min', j.hargaMin), mx = f('h_max', j.hargaMax), po = f('h_poin', j.poin), saran = L.sarankanPoin(angka(mn) || 0, S.pengaturan.persenPoin);
    return hd('Ubah ' + j.nama, '', 'Daftar Harga') + isi(fld('h_min', 'Harga pengepul terendah (Rp per ' + j.satuan + ')', mn, { angka: 1 }) + fld('h_max', 'Harga pengepul tertinggi (Rp per ' + j.satuan + ')', mx, { angka: 1 }) +
      fld('h_poin', 'Poin untuk kelas', po, { angka: 1 }) + btn('Pakai saran ' + saran + ' poin', 'saran', 'o', 'data-v="' + saran + '"') +
      note('Perubahan hanya berlaku untuk setoran berikutnya. Setoran lama tidak berubah.') + btn('Simpan', 'simpanHarga'));
  };
  V.tambahJenis = function () {
    return hd('Tambah Jenis Sampah', '', 'Daftar Harga') + isi(fld('j_nama', 'Nama jenis', f('j_nama', ''), { ph: 'Contoh: Aluminium' }) +
      '<div class="lb">Satuan</div>' + chips('j_sat', [{ k: 'kg', l: 'kg' }, { k: 'liter', l: 'liter' }], f('j_sat', 'kg')) +
      fld('j_min', 'Harga pengepul terendah (Rp)', f('j_min', ''), { angka: 1 }) + fld('j_max', 'Harga pengepul tertinggi (Rp)', f('j_max', ''), { angka: 1 }) +
      mut('Poin kelas disarankan otomatis dari persentase di Pengaturan, dan bisa diubah setelah disimpan.') + btn('Simpan Jenis', 'simpanJenis'));
  };
  V.pengaturan = function () {
    return hd('Pengaturan', '', 'Kembali') + isi(
      card(row('Sekolah', S.sekolah.nama) + row('Bank sampah', S.sekolah.bank) + row('Kode sekolah', S.sekolah.kode) + row('Kelas yang ikut', S.pengaturan.kelas.join(', '))) +
      fld('g_persen', 'Poin kelas dari harga pengepul (%)', f('g_persen', S.pengaturan.persenPoin), { angka: 1 }) +
      fld('g_faktor', '1 liter minyak jelantah dihitung (kg)', f('g_faktor', String(S.pengaturan.faktorJelantah).replace('.', ',')), { angka: 1 }) +
      mut('Angka kesepakatan sekolah untuk menghitung target kelas. Tidak memengaruhi poin.') + btn('Simpan Pengaturan', 'simpanPengaturan') +
      btn('Kelola Akun', 'ke', 'o', 'data-v="kelolaAkun"') + btn('Hapus Semua Data Uji Coba', 'reset', 't'));
  };
  V.kelolaAkun = function () {
    var peran = f('a_peran', 'wali'), rid = f('a_reset', null);
    return hd('Kelola Akun', '', 'Pengaturan') + isi(card(S.akun.map(function (a) {
      return row(a.nama, a.peran === 'wali' ? 'Wali kelas ' + a.kelas : 'Pengelola') +
        (rid === a.id ? fld('a_pinbaru', 'PIN baru (6 angka)', f('a_pinbaru', ''), { pin: 1 }) + btn('Simpan PIN Baru', 'simpanPin', '', 'data-id="' + a.id + '"') : btn('Atur ulang PIN', 'resetPin', 't', 'data-id="' + a.id + '"'));
    }).join('')) + '<div class="sec">Tambah akun</div>' + chips('a_peran', [{ k: 'wali', l: 'Wali kelas' }, { k: 'pengelola', l: 'Pengelola cadangan' }], peran) +
      (peran === 'wali' ? chips('a_kelas', kelasOpsi(), f('a_kelas', S.pengaturan.kelas[0])) : '') +
      fld('a_nama', 'Nama pengguna', f('a_nama', ''), { ph: 'Contoh: bu.rina' }) + fld('a_pin', 'PIN awal (6 angka)', f('a_pin', ''), { pin: 1 }) +
      mut('Berikan kode sekolah, nama pengguna, dan PIN ini kepada yang bersangkutan. Pengelola cadangan punya akses penuh seperti pengelola.') + btn('Simpan Akun', 'simpanAkun'));
  };

  // ---------- wali kelas ----------
  V.waliBeranda = function () {
    var k = sesi.kelas, p = L.progresTarget(S, k, bulan());
    var lit = S.setoran.filter(function (x) { return !x.batal && x.kelas === k && x.tgl.slice(0, 7) === bulan() && jenis(x.jenisId).satuan === 'liter'; }).reduce(function (a, x) { return a + x.qty; }, 0);
    return hd('Kelas ' + k, S.sekolah.bank) + isi(
      card('<div class="mut">Saldo poin kelas</div><div class="flex"><div class="big" style="font-size:30px">' + (tampil ? L.saldoKelas(S, k) + ' poin' : TITIK) + '</div><button class="eye" data-a="mata" aria-label="' + (tampil ? 'Sembunyikan poin' : 'Tampilkan poin') + '">' + (tampil ? 'Tutup' : 'Lihat') + '</button></div>' +
        (tampil ? '<div class="mut">Setara ' + L.formatRp(L.saldoKelas(S, k)) + '</div>' : ''), 1) +
      card('<div class="lb">Target bulan ini</div>' + (p.target ? '<div class="bar"><i style="width:' + p.persen + '%"></i></div>' + mut(L.formatAngka(p.kg) + ' dari ' + L.formatAngka(p.target, 0) + ' kg (' + p.persen + '%) · tonggak ' + p.tonggak + ' dari 4') : mut(L.formatAngka(p.kg) + ' kg terkumpul. Belum ada target.')) +
        (lit > 0 ? mut('Termasuk jelantah ' + L.formatAngka(lit) + ' liter, dihitung ' + L.formatAngka(S.pengaturan.faktorJelantah, 2) + ' kg per liter.') : '')) +
      btn('Atur Target', 'ke', 'o', 'data-v="waliTarget"') + btn('Papan Kelas', 'ke', 'o', 'data-v="papan"') + btn('Keluar', 'keluar', 't'));
  };
  V.waliRiwayat = function () {
    var d = S.setoran.slice().reverse().filter(function (x) { return x.kelas === sesi.kelas; });
    return hd('Riwayat Kelas') + isi((d.length ? '' : mut('Belum ada setoran.')) + d.map(function (x) {
      return card(row(tgl(x.tgl), jenis(x.jenisId).nama + ' ' + L.formatAngka(x.qty) + ' ' + jenis(x.jenisId).satuan, !!x.batal) + (x.batal ? mut('Dibatalkan: ' + esc(x.batal.alasan)) : ''));
    }).join(''));
  };
  V.waliHarga = function () {
    return hd('Daftar Harga') + isi(mut('Poin yang didapat kelas untuk setiap satuan sampah.') +
      S.jenis.filter(function (j) { return j.aktif; }).map(function (j) { return card(row(j.nama + ' (per ' + j.satuan + ')', j.poin + ' poin', 0, C_HIJAU)); }).join(''));
  };
  V.waliTarget = function () {
    return hd('Target Kelas', '', 'Kembali') + isi(fld('w_target', 'Target sampah per bulan (kg)', f('w_target', S.target[sesi.kelas] || ''), { angka: 1 }) +
      note('Tonggak dirayakan di 25%, 50%, 75%, dan 100%. Tidak ada peringkat antar kelas.', true) + btn('Simpan Target', 'simpanTarget'));
  };
  V.papan = function () {
    var b = bulan(), total = S.pengaturan.kelas.reduce(function (a, k) { return a + L.kgBulan(S, k, b); }, 0);
    return hd('Papan Kelas', '', 'Kembali') + isi(card('<div class="mut">Terkumpul bersama bulan ini</div><div class="big">' + L.formatAngka(total) + ' kg</div>', 1) +
      card(S.pengaturan.kelas.map(function (k) { var p = L.progresTarget(S, k, b); return row('Kelas ' + k, p.target ? 'Tonggak ' + p.tonggak + ' dari 4' : 'Belum ada target'); }).join('')) +
      mut('Papan ini menunjukkan kemajuan, bukan peringkat. Saldo poin kelas lain tidak ditampilkan.'));
  };

  var TAB_P = [['beranda', 'Beranda'], ['setor', 'Setor'], ['riwayat', 'Riwayat'], ['tarik', 'Tarik'], ['kas', 'Kas']];
  var TAB_W = [['waliBeranda', 'Beranda'], ['waliRiwayat', 'Riwayat'], ['waliHarga', 'Harga']];

  function render() {
    var t = tumpuk[tumpuk.length - 1], app = document.getElementById('app');
    if (t.n !== 'waliBeranda') tampil = false;
    var tabs = TAB_P.some(function (x) { return x[0] === t.n; }) ? TAB_P : TAB_W.some(function (x) { return x[0] === t.n; }) ? TAB_W : null;
    app.innerHTML = V[t.n](t.p) + (tabs ? '<div class="tabs">' + tabs.map(function (x) { return '<button class="' + (x[0] === t.n ? 'on' : '') + '" data-a="tab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' : '');
    window.scrollTo(0, 0);
  }
  function re() { var y = window.scrollY; var tp = tampil; render(); tampil = tp; window.scrollTo(0, y); }
  function pergi(n, p) { tumpuk.push({ n: n, p: p || {} }); F = {}; render(); }
  function reset(n, p) { tumpuk = [{ n: n, p: p || {} }]; F = {}; render(); }
  function ganti(n, p) { tumpuk[tumpuk.length - 1] = { n: n, p: p || {} }; F = {}; render(); }
  function kembali() { if (tumpuk.length > 1) { tumpuk.pop(); F = {}; render(); } }

  document.addEventListener('input', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-f'); if (k) F[k] = e.target.value; });
  window.addEventListener('popstate', function () { kembali(); history.pushState(null, ''); });
  history.pushState(null, '');

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el) return;
    var a = el.getAttribute('data-a'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id'), tipe = el.getAttribute('data-tipe'), p;
    var t = tumpuk[tumpuk.length - 1];
    if (a === 'pilih') { F[el.getAttribute('data-n')] = v; return re(); }
    if (a === 'tab') return reset(v);
    if (a === 'ke') return pergi(v, { id: id, tipe: tipe });
    if (a === 'kembali') return kembali();
    if (a === 'mata') { tampil = !tampil; return re(); }
    if (a === 'isi') { F.kode = S.sekolah.kode; F.nama = v; F.pin = '123456'; return re(); }
    if (a === 'keluar') { sesi = null; tampil = false; return reset('login'); }
    if (a === 'masuk') {
      var ak = S.akun.find(function (x) { return x.nama === String(f('nama', '')).trim() && x.pin === f('pin', ''); });
      if (String(f('kode', '')).trim().toUpperCase() !== S.sekolah.kode.toUpperCase() || !ak) return alert('Kode sekolah, nama pengguna, atau PIN salah.');
      sesi = ak; tampil = false; return reset(ak.peran === 'pengelola' ? 'beranda' : 'waliBeranda');
    }
    if (a === 'simpanSetor') {
      var aktif = S.jenis.filter(function (j) { return j.aktif; });
      p = { tgl: hariIni(), kelas: +f('s_kelas', S.pengaturan.kelas[0]), jenisId: f('s_jenis', aktif[0].id), qty: angka(f('s_qty', '')), petugas: f('s_petugas', sesi.nama), perwakilan: f('s_wakil', '') };
      var r = jalan(function (s) { return L.tambahSetoran(s, p); }); if (r.ok) ganti('setorBerhasil', { id: r.entri.id }); return;
    }
    if (a === 'simpanBatal') {
      var fn = { setoran: L.batalkanSetoran, penjualan: L.batalkanPenjualan, penarikan: L.batalkanPenarikan }[t.p.tipe];
      var rb = jalan(function (s) { return fn(s, t.p.id, { alasan: f('b_alasan', ALASAN[t.p.tipe][0]), catatan: f('b_catatan', ''), tgl: hariIni(), oleh: sesi.nama }); }); if (rb.ok) kembali(); return;
    }
    if (a === 'simpanTarik') {
      var rt = jalan(function (s) { return L.ajukanPenarikan(s, { tgl: hariIni(), kelas: +f('t_kelas', S.pengaturan.kelas[0]), poin: angka(f('t_poin', '')), bendahara: f('t_bend', '') }); });
      if (rt.ok) pergi('tarikBerhasil', { id: rt.entri.id }); return;
    }
    if (a === 'simpanJual') {
      var rj = jalan(function (s) { return L.catatPenjualan(s, { tgl: hariIni(), jenisId: f('p_jenis', s.jenis[0].id), qty: angka(f('p_qty', '')), uang: angka(f('p_uang', '')), pengepul: f('p_pengepul', '') }); });
      if (rj.ok) { alert('Penjualan tercatat. Uang masuk ke kas program.'); kembali(); } return;
    }
    if (a === 'saran') { F.h_poin = v; return re(); }
    if (a === 'simpanHarga') {
      var rh = jalan(function (s) { return L.ubahHarga(s, t.p.id, { hargaMin: angka(f('h_min', jenis(t.p.id).hargaMin)), hargaMax: angka(f('h_max', jenis(t.p.id).hargaMax)), poin: angka(f('h_poin', jenis(t.p.id).poin)), tgl: hariIni() }); }); if (rh.ok) kembali(); return;
    }
    if (a === 'simpanJenis') {
      var rn = jalan(function (s) { return L.tambahJenis(s, { nama: f('j_nama', ''), satuan: f('j_sat', 'kg'), hargaMin: angka(f('j_min', '')), hargaMax: angka(f('j_max', '')) }); }); if (rn.ok) kembali(); return;
    }
    if (a === 'simpanPengaturan') {
      var r1 = jalan(function (s) { return L.ubahPersenPoin(s, angka(f('g_persen', s.pengaturan.persenPoin))); }); if (!r1.ok) return;
      var r2 = jalan(function (s) { return L.ubahFaktorJelantah(s, angka(f('g_faktor', s.pengaturan.faktorJelantah))); }); if (r2.ok) { alert('Pengaturan tersimpan. Berlaku mulai setoran berikutnya.'); F = {}; re(); } return;
    }
    if (a === 'reset') { if (confirm('Hapus semua setoran, penjualan, dan penarikan di peramban ini?')) { S = stateAwal(); simpan(); F = {}; re(); } return; }
    if (a === 'resetPin') { F.a_reset = id; F.a_pinbaru = ''; return re(); }
    if (a === 'simpanPin') {
      var pn = f('a_pinbaru', ''); if (!/^\d{6}$/.test(pn)) return alert('PIN harus 6 angka.');
      S = Object.assign({}, S, { akun: S.akun.map(function (x) { return x.id === id ? Object.assign({}, x, { pin: pn }) : x; }) }); simpan(); F = {}; return re();
    }
    if (a === 'simpanAkun') {
      var nm = String(f('a_nama', '')).trim(), pi = f('a_pin', ''), pr = f('a_peran', 'wali'), kl = +f('a_kelas', S.pengaturan.kelas[0]);
      if (!nm) return alert('Nama pengguna wajib diisi.'); if (!/^\d{6}$/.test(pi)) return alert('PIN harus 6 angka.');
      if (S.akun.some(function (x) { return x.nama === nm; })) return alert('Nama pengguna sudah dipakai.');
      var seq = S.seq + 1, baru = pr === 'wali' ? { id: 'a' + seq, peran: 'wali', kelas: kl, nama: nm, pin: pi } : { id: 'a' + seq, peran: 'pengelola', nama: nm, pin: pi };
      S = Object.assign({}, S, { seq: seq, akun: S.akun.concat([baru]) }); simpan(); F = {}; return re();
    }
    if (a === 'simpanTarget') {
      var rg = jalan(function (s) { return L.aturTarget(s, sesi.kelas, angka(f('w_target', ''))); }); if (rg.ok) kembali(); return;
    }
  });
  render();
})();
