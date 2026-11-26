import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useStore, tambahAkun, aturPIN } from '../store';
import * as L from '../logic';
import { C, Layar, Kartu, Tombol, Pilihan, Isian, Baris, Catatan, Peringatan, Teks, angkaDari, hariIni, tanggal } from '../ui';

const bulanIni = () => hariIni().slice(0, 7);
const galat = (r) => Alert.alert('Belum bisa disimpan', r.error);
const namaJenis = (s, id) => (s.jenis.find((j) => j.id === id) || { nama: id }).nama;
const satuan = (s, id) => (s.jenis.find((j) => j.id === id) || { satuan: 'kg' }).satuan;
const kelasOpsi = (s) => s.pengaturan.kelas.map((k) => ({ k, l: 'Kelas ' + k }));

export function Beranda({ nav }) {
  const { state: s, akun, keluar } = useStore();
  const bln = bulanIni();
  const total = s.pengaturan.kelas.reduce((a, k) => a + L.kgBulan(s, k, bln), 0);
  const kosong = s.setoran.length === 0;
  return (
    <Layar judul={s.sekolah.bank} subjudul={s.sekolah.nama + ' · ' + (akun ? akun.nama : '')}>
      <Kartu>
        <Teks gaya={{ color: C.teks2 }} kecil>Total sampah terkumpul bulan ini</Teks>
        <Teks besar tebal gaya={{ fontSize: 32 }}>{L.formatAngka(total) + ' kg'}</Teks>
        <Catatan>{'dari ' + s.pengaturan.kelas.length + ' kelas (kelas ' + s.pengaturan.kelas[0] + ' sampai ' + s.pengaturan.kelas[s.pengaturan.kelas.length - 1] + ')'}</Catatan>
      </Kartu>
      {kosong ? (
        <Kartu>
          <Teks tebal>Mulai dari sini</Teks>
          <Catatan>1. Cek daftar harga di tab Kas lalu Harga. 2. Pastikan akun wali kelas ada di Pengaturan. 3. Catat setoran pertama.</Catatan>
        </Kartu>
      ) : null}
      <Teks tebal>Capaian tiap kelas</Teks>
      <Kartu>
        {s.pengaturan.kelas.map((k) => {
          const p = L.progresTarget(s, k, bln);
          return (
            <Baris
              key={k}
              kiri={'Kelas ' + k}
              kanan={p.target ? L.formatAngka(p.kg) + ' dari ' + L.formatAngka(p.target, 0) + ' kg (' + p.persen + '%)' : L.formatAngka(p.kg) + ' kg · belum ada target'}
            />
          );
        })}
      </Kartu>
      <Tombol label="Catat Setoran" onPress={() => nav.ganti('setor')} />
      <Tombol label="Daftar Harga" gaya="garis" onPress={() => nav.pergi('harga')} />
      <Tombol label="Pengaturan" gaya="garis" onPress={() => nav.pergi('pengaturan')} />
      <Tombol label="Keluar" gaya="teks" onPress={() => { keluar(); nav.reset('login'); }} />
    </Layar>
  );
}

export function Setor({ nav }) {
  const { state: s, jalankan, akun } = useStore();
  const aktifJ = s.jenis.filter((j) => j.aktif);
  const [kelas, setKelas] = useState(s.pengaturan.kelas[0]);
  const [jenisId, setJenisId] = useState(aktifJ[0] ? aktifJ[0].id : null);
  const [qty, setQty] = useState('');
  const [petugas, setPetugas] = useState(akun ? akun.nama : '');
  const [wakil, setWakil] = useState('');
  const jenis = s.jenis.find((j) => j.id === jenisId);
  const n = angkaDari(qty);
  const poin = jenis && n > 0 ? Math.round(n * jenis.poin) : 0;
  return (
    <Layar judul="Catat Setoran" subjudul="Di titik setor">
      <Teks tebal>Kelas</Teks>
      <Pilihan opsi={kelasOpsi(s)} nilai={kelas} onPilih={setKelas} />
      <Teks tebal>Jenis sampah</Teks>
      <Pilihan opsi={aktifJ.map((j) => ({ k: j.id, l: j.nama }))} nilai={jenisId} onPilih={setJenisId} />
      <Isian label={'Jumlah (' + (jenis ? jenis.satuan : 'kg') + ')'} nilai={qty} onUbah={setQty} angka placeholder="Contoh: 2,5" />
      <Isian label="Nama petugas penimbang" nilai={petugas} onUbah={setPetugas} placeholder="Wajib diisi" />
      <Isian label="Perwakilan kelas (opsional)" nilai={wakil} onUbah={setWakil} placeholder="Boleh dikosongkan" />
      <Peringatan hijau>
        {'Total untuk Kelas ' + kelas + ': +' + poin + ' poin' + (jenis && jenis.satuan === 'liter' && n > 0 ? '\nUntuk target kelas dihitung ' + L.formatAngka(n * s.pengaturan.faktorJelantah) + ' kg (1 liter = ' + L.formatAngka(s.pengaturan.faktorJelantah, 2) + ' kg)' : '')}
      </Peringatan>
      <Tombol
        label="Simpan Setoran"
        onPress={() => {
          const r = jalankan((st) => L.tambahSetoran(st, { tgl: hariIni(), kelas, jenisId, qty: n, petugas, perwakilan: wakil }));
          if (!r.ok) return galat(r);
          setQty(''); setWakil('');
          nav.pergi('setorBerhasil', { id: r.entri.id });
        }}
      />
    </Layar>
  );
}

export function SetorBerhasil({ nav, params }) {
  const { state: s } = useStore();
  const e = s.setoran.find((x) => x.id === params.id);
  if (!e) return null;
  return (
    <Layar judul="Setoran Tersimpan">
      <Peringatan hijau>Tunjukkan layar ini kepada perwakilan kelas untuk dicek bersama.</Peringatan>
      <Kartu>
        <Baris kiri="Tanggal" kanan={tanggal(e.tgl)} />
        <Baris kiri="Kelas" kanan={'Kelas ' + e.kelas} />
        <Baris kiri="Jenis" kanan={namaJenis(s, e.jenisId)} />
        <Baris kiri="Jumlah" kanan={L.formatAngka(e.qty) + ' ' + satuan(s, e.jenisId)} />
        <Baris kiri="Poin masuk" kanan={'+' + e.poin} warnaKanan={C.hijau} />
        <Baris kiri="Saldo kelas sekarang" kanan={String(L.saldoKelas(s, e.kelas)) + ' poin'} />
        <Baris kiri="Petugas" kanan={e.petugas} />
      </Kartu>
      <Tombol label="Catat Setoran Lagi" onPress={() => nav.ganti('setor')} />
      <Tombol label="Lihat Riwayat" gaya="garis" onPress={() => nav.ganti('riwayat')} />
      <Tombol label="Salah catat? Batalkan setoran" gaya="teks" onPress={() => nav.pergi('batal', { tipe: 'setoran', id: e.id })} />
    </Layar>
  );
}

export function Riwayat({ nav }) {
  const { state: s } = useStore();
  const [kelas, setKelas] = useState(0);
  const daftar = [...s.setoran].reverse().filter((x) => !kelas || x.kelas === kelas);
  return (
    <Layar judul="Riwayat Setoran">
      <Pilihan opsi={[{ k: 0, l: 'Semua' }, ...kelasOpsi(s)]} nilai={kelas} onPilih={setKelas} />
      {daftar.length === 0 ? <Catatan>Belum ada setoran.</Catatan> : null}
      {daftar.map((x) => (
        <Kartu key={x.id}>
          <Baris
            coret={!!x.batal}
            kiri={tanggal(x.tgl) + ' · Kelas ' + x.kelas}
            kanan={namaJenis(s, x.jenisId) + ' ' + L.formatAngka(x.qty) + ' ' + satuan(s, x.jenisId) + '  +' + x.poin}
          />
          {x.batal ? (
            <Catatan>{'Dibatalkan: ' + x.batal.alasan + '. ' + x.batal.catatan}</Catatan>
          ) : (
            <Tombol label="Batalkan" gaya="teks" onPress={() => nav.pergi('batal', { tipe: 'setoran', id: x.id })} />
          )}
        </Kartu>
      ))}
    </Layar>
  );
}

const ALASAN = {
  setoran: ['Salah berat', 'Salah jenis', 'Salah kelas', 'Lainnya'],
  penjualan: ['Salah berat', 'Salah harga', 'Salah jenis', 'Lainnya'],
  penarikan: ['Salah jumlah', 'Salah kelas', 'Uang tidak jadi diserahkan', 'Lainnya'],
};
const FUNGSI_BATAL = { setoran: L.batalkanSetoran, penjualan: L.batalkanPenjualan, penarikan: L.batalkanPenarikan };

export function Batal({ nav, params }) {
  const { state: s, jalankan, akun } = useStore();
  const [alasan, setAlasan] = useState(ALASAN[params.tipe][0]);
  const [catatan, setCatatan] = useState('');
  const judul = { setoran: 'Batalkan Setoran', penjualan: 'Batalkan Penjualan', penarikan: 'Batalkan Penarikan' }[params.tipe];
  return (
    <Layar judul={judul} onKembali={nav.kembali}>
      <Teks tebal>Alasan pembatalan</Teks>
      <Pilihan opsi={ALASAN[params.tipe].map((a) => ({ k: a, l: a }))} nilai={alasan} onPilih={setAlasan} />
      <Isian label="Catatan (wajib diisi)" nilai={catatan} onUbah={setCatatan} placeholder="Contoh: seharusnya 1,5 kg" />
      <Peringatan>Data tidak dihapus. Catatan tetap tampil di riwayat dengan tanda dibatalkan, lengkap dengan alasan dan nama pembatalnya.</Peringatan>
      <Tombol
        label={judul}
        gaya="merah"
        onPress={() => {
          const r = jalankan((st) => FUNGSI_BATAL[params.tipe](st, params.id, { alasan, catatan, tgl: hariIni(), oleh: akun ? akun.nama : '' }));
          if (!r.ok) return galat(r);
          nav.kembali();
        }}
      />
      <Tombol label="Kembali" gaya="teks" onPress={nav.kembali} />
    </Layar>
  );
}

export function Tarik({ nav }) {
  const { state: s, jalankan } = useStore();
  const [kelas, setKelas] = useState(s.pengaturan.kelas[0]);
  const [poin, setPoin] = useState('');
  const [bendahara, setBendahara] = useState('');
  return (
    <Layar judul="Tarik Poin">
      <Pilihan opsi={kelasOpsi(s)} nilai={kelas} onPilih={setKelas} />
      <Kartu>
        <Baris kiri="Saldo poin Kelas" kanan={L.saldoKelas(s, kelas) + ' poin'} />
        <Baris kiri="Kas program" kanan={L.formatRp(L.saldoKas(s))} />
      </Kartu>
      <Isian label="Jumlah poin yang ditarik" nilai={poin} onUbah={setPoin} angka placeholder="1 poin = Rp 1" />
      <Isian label="Nama bendahara kelas" nilai={bendahara} onUbah={setBendahara} placeholder="Wajib diisi" />
      <Tombol
        label="Ajukan Penarikan"
        onPress={() => {
          const r = jalankan((st) => L.ajukanPenarikan(st, { tgl: hariIni(), kelas, poin: angkaDari(poin), bendahara }));
          if (!r.ok) return galat(r);
          setPoin('');
          nav.pergi('penarikanBerhasil', { id: r.entri.id });
        }}
      />
      <Teks tebal>Penarikan sebelumnya</Teks>
      {s.penarikan.length === 0 ? <Catatan>Belum ada penarikan.</Catatan> : null}
      {[...s.penarikan].reverse().map((p) => (
        <Kartu key={p.id}>
          <Baris coret={!!p.batal} kiri={tanggal(p.tgl) + ' · Kelas ' + p.kelas} kanan={'-' + p.poin + ' poin'} />
          {p.batal ? <Catatan>{'Dibatalkan: ' + p.batal.alasan + '. ' + p.batal.catatan}</Catatan> : <Tombol label="Batalkan" gaya="teks" onPress={() => nav.pergi('batal', { tipe: 'penarikan', id: p.id })} />}
        </Kartu>
      ))}
    </Layar>
  );
}

export function PenarikanBerhasil({ nav, params }) {
  const { state: s } = useStore();
  const p = s.penarikan.find((x) => x.id === params.id);
  if (!p) return null;
  return (
    <Layar judul="Bukti Penarikan">
      <Peringatan hijau>Serahkan uang dan minta kedua tanda tangan.</Peringatan>
      <Kartu>
        <Baris kiri="Tanggal" kanan={tanggal(p.tgl)} />
        <Baris kiri="Kelas" kanan={'Kelas ' + p.kelas} />
        <Baris kiri="Poin ditarik" kanan={p.poin + ' poin'} />
        <Baris kiri="Uang diserahkan" kanan={L.formatRp(p.poin)} />
        <Baris kiri="Sisa saldo kelas" kanan={L.saldoKelas(s, p.kelas) + ' poin'} />
        <Baris kiri="Saldo kas program" kanan={L.formatRp(L.saldoKas(s))} />
      </Kartu>
      <Kartu>
        <Teks tebal>Tanda terima</Teks>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 28 }}>
          <View style={{ flex: 1, borderTopWidth: 1, borderColor: C.tua, paddingTop: 4 }}><Catatan>{'Bendahara kelas: ' + p.bendahara}</Catatan></View>
          <View style={{ flex: 1, borderTopWidth: 1, borderColor: C.tua, paddingTop: 4 }}><Catatan>Disetujui pengelola</Catatan></View>
        </View>
      </Kartu>
      <Tombol label="Selesai" onPress={() => nav.ganti('tarik')} />
      <Tombol label="Salah catat? Batalkan penarikan" gaya="teks" onPress={() => nav.pergi('batal', { tipe: 'penarikan', id: p.id })} />
    </Layar>
  );
}

export function Kas({ nav }) {
  const { state: s } = useStore();
  const cad = L.cadanganProgram(s);
  return (
    <Layar judul="Kas Program">
      <Kartu warna={C.hijau}>
        <Teks warna="#D6EBDD" kecil>Saldo kas program</Teks>
        <Teks besar tebal warna="#FFFFFF" gaya={{ fontSize: 32 }}>{L.formatRp(L.saldoKas(s))}</Teks>
      </Kartu>
      <Kartu>
        <Baris kiri="Nilai stok (harga batas bawah)" kanan={L.formatRp(L.nilaiStok(s))} />
        <Baris kiri="Poin beredar" kanan={L.formatRp(L.poinBeredar(s))} />
        <Baris kiri="Cadangan program" kanan={L.formatRp(cad)} warnaKanan={cad < 0 ? C.merah : C.hijau} />
      </Kartu>
      {cad < 0 ? <Peringatan>Cadangan negatif: kas dan stok belum cukup untuk membayar semua poin kelas.</Peringatan> : null}
      <Tombol label="Catat Penjualan ke Pengepul" onPress={() => nav.pergi('penjualan')} />
      <Tombol label="Rekap Bulan Ini" gaya="garis" onPress={() => nav.pergi('rekap')} />
      <Tombol label="Cek Uang Tunai" gaya="garis" onPress={() => nav.pergi('cekKas')} />
      <Teks tebal>Penjualan</Teks>
      {s.penjualan.length === 0 ? <Catatan>Belum ada penjualan.</Catatan> : null}
      {[...s.penjualan].reverse().map((p) => (
        <Kartu key={p.id}>
          <Baris coret={!!p.batal} kiri={tanggal(p.tgl) + ' · ' + namaJenis(s, p.jenisId) + ' ' + L.formatAngka(p.qty) + ' ' + satuan(s, p.jenisId)} kanan={'+' + L.formatRp(p.uang)} />
          {p.batal ? <Catatan>{'Dibatalkan: ' + p.batal.alasan + '. ' + p.batal.catatan}</Catatan> : <Tombol label="Batalkan" gaya="teks" onPress={() => nav.pergi('batal', { tipe: 'penjualan', id: p.id })} />}
        </Kartu>
      ))}
    </Layar>
  );
}

export function Penjualan({ nav }) {
  const { state: s, jalankan } = useStore();
  const [jenisId, setJenisId] = useState(s.jenis[0].id);
  const [qty, setQty] = useState('');
  const [uang, setUang] = useState('');
  const [pengepul, setPengepul] = useState('');
  return (
    <Layar judul="Catat Penjualan" onKembali={nav.kembali} kembaliLabel="Kas Program">
      <Pilihan opsi={s.jenis.map((j) => ({ k: j.id, l: j.nama }))} nilai={jenisId} onPilih={setJenisId} />
      <Catatan>{'Stok tersedia: ' + L.formatAngka(L.stokJenis(s, jenisId)) + ' ' + satuan(s, jenisId)}</Catatan>
      <Isian label={'Jumlah dijual (' + satuan(s, jenisId) + ')'} nilai={qty} onUbah={setQty} angka />
      <Isian label="Uang diterima (Rp)" nilai={uang} onUbah={setUang} angka />
      <Isian label="Nama pengepul (opsional)" nilai={pengepul} onUbah={setPengepul} />
      <Tombol
        label="Simpan Penjualan"
        onPress={() => {
          const r = jalankan((st) => L.catatPenjualan(st, { tgl: hariIni(), jenisId, qty: angkaDari(qty), uang: angkaDari(uang), pengepul }));
          if (!r.ok) return galat(r);
          Alert.alert('Penjualan tercatat', 'Uang masuk ke kas program.');
          nav.kembali();
        }}
      />
    </Layar>
  );
}

export function Rekap({ nav }) {
  const { state: s } = useStore();
  const bln = bulanIni();
  const total = s.pengaturan.kelas.reduce((a, k) => a + L.kgBulan(s, k, bln), 0);
  const jelantah = s.setoran.filter((x) => !x.batal && x.tgl.slice(0, 7) === bln && satuan(s, x.jenisId) === 'liter');
  const lit = jelantah.reduce((a, x) => a + x.qty, 0);
  return (
    <Layar judul={'Rekap ' + bln} onKembali={nav.kembali} kembaliLabel="Kas Program">
      <Kartu warna={C.hijau}>
        <Teks warna="#D6EBDD" kecil>Total sampah terkumpul</Teks>
        <Teks besar tebal warna="#FFFFFF" gaya={{ fontSize: 32 }}>{L.formatAngka(total) + ' kg'}</Teks>
      </Kartu>
      <Teks tebal>Per kelas</Teks>
      <Kartu>
        {s.pengaturan.kelas.map((k) => {
          const p = L.progresTarget(s, k, bln);
          return <Baris key={k} kiri={'Kelas ' + k} kanan={p.target ? L.formatAngka(p.kg) + ' dari ' + L.formatAngka(p.target, 0) + ' kg (' + p.persen + '%)' : L.formatAngka(p.kg) + ' kg · belum ada target'} />;
        })}
      </Kartu>
      {lit > 0 ? <Catatan>{'Termasuk minyak jelantah ' + L.formatAngka(lit) + ' liter, dihitung ' + L.formatAngka(s.pengaturan.faktorJelantah, 2) + ' kg per liter (' + L.formatAngka(lit * s.pengaturan.faktorJelantah) + ' kg).'}</Catatan> : null}
      <Kartu>
        <Baris kiri="Saldo kas program" kanan={L.formatRp(L.saldoKas(s))} />
        <Baris kiri="Poin beredar" kanan={L.formatRp(L.poinBeredar(s))} />
      </Kartu>
    </Layar>
  );
}

export function CekKas({ nav }) {
  const { state: s } = useStore();
  const [uang, setUang] = useState('');
  const catatan = L.saldoKas(s);
  const n = angkaDari(uang);
  const selisih = Number.isFinite(n) ? n - catatan : null;
  return (
    <Layar judul="Cek Uang Tunai" onKembali={nav.kembali} kembaliLabel="Kas Program">
      <Catatan>Cocokkan catatan aplikasi dengan uang yang benar-benar ada. Lakukan sebulan sekali dan hitung bersama satu orang lain.</Catatan>
      <Kartu><Baris kiri="Catatan kas program" kanan={L.formatRp(catatan)} /></Kartu>
      <Isian label="Uang tunai yang dihitung (Rp)" nilai={uang} onUbah={setUang} angka />
      {selisih !== null ? (
        <Peringatan hijau={selisih === 0}>{selisih === 0 ? 'Selisih Rp 0 · cocok' : 'Selisih ' + L.formatRp(selisih) + '. Catat alasannya sebelum menyimpan.'}</Peringatan>
      ) : null}
    </Layar>
  );
}

export function Harga({ nav }) {
  const { state: s } = useStore();
  return (
    <Layar judul="Daftar Harga" onKembali={nav.kembali}>
      <Catatan>{'Poin kelas disarankan ' + s.pengaturan.persenPoin + '% dari batas bawah harga pengepul. Perubahan hanya berlaku untuk setoran berikutnya.'}</Catatan>
      {s.jenis.map((j) => (
        <Kartu key={j.id}>
          <Baris kiri={j.nama + ' (per ' + j.satuan + ')'} kanan={'Pengepul ' + L.formatRp(j.hargaMin) + ' - ' + L.formatRp(j.hargaMax)} />
          <Baris kiri="Poin untuk kelas" kanan={j.poin + ' poin'} warnaKanan={C.hijau} />
          <Tombol label="Ubah" gaya="teks" onPress={() => nav.pergi('ubahHarga', { id: j.id })} />
        </Kartu>
      ))}
      <Tombol label="Tambah Jenis Sampah" onPress={() => nav.pergi('tambahJenis')} />
      <Teks tebal>Riwayat perubahan</Teks>
      {s.hargaRiwayat.length === 0 ? <Catatan>Belum ada perubahan.</Catatan> : null}
      {s.hargaRiwayat.slice(0, 10).map((h, i) => (
        <Kartu key={i}><Catatan>{tanggal(h.tgl) + ' · ' + namaJenis(s, h.jenisId) + ': poin ' + h.dari.poin + ' menjadi ' + h.ke.poin}</Catatan></Kartu>
      ))}
    </Layar>
  );
}

export function UbahHarga({ nav, params }) {
  const { state: s, jalankan } = useStore();
  const j = s.jenis.find((x) => x.id === params.id);
  const [min, setMin] = useState(String(j.hargaMin));
  const [max, setMax] = useState(String(j.hargaMax));
  const [poin, setPoin] = useState(String(j.poin));
  const saran = L.sarankanPoin(angkaDari(min) || 0, s.pengaturan.persenPoin);
  return (
    <Layar judul={'Ubah ' + j.nama} onKembali={nav.kembali} kembaliLabel="Daftar Harga">
      <Isian label={'Harga pengepul terendah (Rp per ' + j.satuan + ')'} nilai={min} onUbah={setMin} angka />
      <Isian label={'Harga pengepul tertinggi (Rp per ' + j.satuan + ')'} nilai={max} onUbah={setMax} angka />
      <Isian label="Poin untuk kelas" nilai={poin} onUbah={setPoin} angka />
      <Tombol label={'Pakai saran ' + saran + ' poin'} gaya="garis" onPress={() => setPoin(String(saran))} />
      <Peringatan>Perubahan hanya berlaku untuk setoran berikutnya. Setoran lama tidak berubah.</Peringatan>
      <Tombol
        label="Simpan"
        onPress={() => {
          const r = jalankan((st) => L.ubahHarga(st, j.id, { hargaMin: angkaDari(min), hargaMax: angkaDari(max), poin: angkaDari(poin), tgl: hariIni() }));
          if (!r.ok) return galat(r);
          nav.kembali();
        }}
      />
    </Layar>
  );
}

export function TambahJenis({ nav }) {
  const { jalankan } = useStore();
  const [nama, setNama] = useState('');
  const [sat, setSat] = useState('kg');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  return (
    <Layar judul="Tambah Jenis Sampah" onKembali={nav.kembali} kembaliLabel="Daftar Harga">
      <Isian label="Nama jenis" nilai={nama} onUbah={setNama} placeholder="Contoh: Aluminium" />
      <Teks tebal>Satuan</Teks>
      <Pilihan opsi={[{ k: 'kg', l: 'kg' }, { k: 'liter', l: 'liter' }]} nilai={sat} onPilih={setSat} />
      <Isian label="Harga pengepul terendah (Rp)" nilai={min} onUbah={setMin} angka />
      <Isian label="Harga pengepul tertinggi (Rp)" nilai={max} onUbah={setMax} angka />
      <Catatan>Poin kelas disarankan otomatis dari persentase di Pengaturan, dan bisa diubah setelah disimpan.</Catatan>
      <Tombol
        label="Simpan Jenis"
        onPress={() => {
          const r = jalankan((st) => L.tambahJenis(st, { nama, satuan: sat, hargaMin: angkaDari(min), hargaMax: angkaDari(max) }));
          if (!r.ok) return galat(r);
          nav.kembali();
        }}
      />
    </Layar>
  );
}

export function Pengaturan({ nav }) {
  const { state: s, jalankan, reset } = useStore();
  const [persen, setPersen] = useState(String(s.pengaturan.persenPoin));
  const [faktor, setFaktor] = useState(String(s.pengaturan.faktorJelantah).replace('.', ','));
  return (
    <Layar judul="Pengaturan" onKembali={nav.kembali}>
      <Kartu>
        <Baris kiri="Sekolah" kanan={s.sekolah.nama} />
        <Baris kiri="Bank sampah" kanan={s.sekolah.bank} />
        <Baris kiri="Kode sekolah" kanan={s.sekolah.kode} />
        <Baris kiri="Kelas yang ikut" kanan={s.pengaturan.kelas.join(', ')} />
      </Kartu>
      <Isian label="Poin kelas dari harga pengepul (%)" nilai={persen} onUbah={setPersen} angka />
      <Isian label="1 liter minyak jelantah dihitung (kg)" nilai={faktor} onUbah={setFaktor} angka />
      <Catatan>Angka kesepakatan sekolah untuk menghitung target kelas. Tidak memengaruhi poin.</Catatan>
      <Tombol
        label="Simpan Pengaturan"
        onPress={() => {
          const a = jalankan((st) => L.ubahPersenPoin(st, angkaDari(persen)));
          if (!a.ok) return galat(a);
          const b = jalankan((st) => L.ubahFaktorJelantah(st, angkaDari(faktor)));
          if (!b.ok) return galat(b);
          Alert.alert('Pengaturan tersimpan', 'Perubahan berlaku mulai setoran berikutnya.');
        }}
      />
      <Tombol label="Kelola Akun" gaya="garis" onPress={() => nav.pergi('kelolaAkun')} />
      <Tombol
        label="Hapus Semua Data Uji Coba"
        gaya="teks"
        onPress={() => Alert.alert('Hapus data uji coba?', 'Semua setoran, penjualan, dan penarikan di HP ini dihapus.', [{ text: 'Batal', style: 'cancel' }, { text: 'Hapus', style: 'destructive', onPress: reset }])}
      />
    </Layar>
  );
}

export function KelolaAkun({ nav }) {
  const { state: s, jalankan } = useStore();
  const [peran, setPeran] = useState('wali');
  const [kelas, setKelas] = useState(s.pengaturan.kelas[0]);
  const [nama, setNama] = useState('');
  const [pin, setPin] = useState('');
  const [resetId, setResetId] = useState(null);
  const [pinBaru, setPinBaru] = useState('');
  return (
    <Layar judul="Kelola Akun" onKembali={nav.kembali} kembaliLabel="Pengaturan">
      <Kartu>
        {s.akun.map((a) => (
          <View key={a.id} style={{ gap: 6, paddingVertical: 6 }}>
            <Baris kiri={a.nama} kanan={a.peran === 'wali' ? 'Wali kelas ' + a.kelas : 'Pengelola'} />
            {resetId === a.id ? (
              <View style={{ gap: 8 }}>
                <Isian label="PIN baru (6 angka)" nilai={pinBaru} onUbah={setPinBaru} angka rahasia panjang={6} />
                <Tombol label="Simpan PIN Baru" onPress={() => { const r = jalankan((st) => aturPIN(st, a.id, pinBaru)); if (!r.ok) return galat(r); setResetId(null); setPinBaru(''); }} />
              </View>
            ) : (
              <Tombol label="Atur ulang PIN" gaya="teks" onPress={() => { setResetId(a.id); setPinBaru(''); }} />
            )}
          </View>
        ))}
      </Kartu>
      <Teks tebal>Tambah akun</Teks>
      <Pilihan opsi={[{ k: 'wali', l: 'Wali kelas' }, { k: 'pengelola', l: 'Pengelola cadangan' }]} nilai={peran} onPilih={setPeran} />
      {peran === 'wali' ? <Pilihan opsi={kelasOpsi(s)} nilai={kelas} onPilih={setKelas} /> : null}
      <Isian label="Nama pengguna" nilai={nama} onUbah={setNama} placeholder="Contoh: bu.rina" />
      <Isian label="PIN awal (6 angka)" nilai={pin} onUbah={setPin} angka rahasia panjang={6} />
      <Catatan>Berikan kode sekolah, nama pengguna, dan PIN ini kepada yang bersangkutan. Pengelola cadangan punya akses penuh seperti pengelola.</Catatan>
      <Tombol
        label="Simpan Akun"
        onPress={() => {
          const r = jalankan((st) => tambahAkun(st, { peran, kelas, nama, pin }));
          if (!r.ok) return galat(r);
          setNama(''); setPin('');
        }}
      />
    </Layar>
  );
}
