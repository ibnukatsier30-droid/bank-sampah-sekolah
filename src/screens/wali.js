import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useStore } from '../store';
import * as L from '../logic';
import { C, Layar, Kartu, Tombol, Isian, Baris, Catatan, Peringatan, Teks, Mata, TITIK, angkaDari, hariIni, tanggal } from '../ui';

const bln = () => hariIni().slice(0, 7);
const namaJenis = (s, id) => (s.jenis.find((j) => j.id === id) || { nama: id }).nama;
const satuan = (s, id) => (s.jenis.find((j) => j.id === id) || { satuan: 'kg' }).satuan;

export function WaliBeranda({ nav }) {
  const { state: s, akun, keluar } = useStore();
  const [tampil, setTampil] = useState(false); // selalu mulai tersembunyi
  const k = akun.kelas;
  const p = L.progresTarget(s, k, bln());
  const lit = s.setoran.filter((x) => !x.batal && x.kelas === k && x.tgl.slice(0, 7) === bln() && satuan(s, x.jenisId) === 'liter').reduce((a, x) => a + x.qty, 0);
  return (
    <Layar judul={'Kelas ' + k} subjudul={s.sekolah.bank}>
      <Kartu warna={C.hijau}>
        <Teks warna="#D6EBDD" kecil>Saldo poin kelas</Teks>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Teks besar tebal warna="#FFFFFF" gaya={{ fontSize: 30 }}>{tampil ? L.saldoKelas(s, k) + ' poin' : TITIK}</Teks>
          <Mata tampil={tampil} onPress={() => setTampil(!tampil)} />
        </View>
        {tampil ? <Teks warna="#D6EBDD" kecil>{'Setara ' + L.formatRp(L.saldoKelas(s, k))}</Teks> : null}
      </Kartu>
      <Kartu>
        <Teks tebal>Target bulan ini</Teks>
        {p.target ? (
          <>
            <View style={{ height: 14, backgroundColor: C.terang, borderRadius: 7, overflow: 'hidden' }}>
              <View style={{ width: p.persen + '%', height: 14, backgroundColor: C.hijau }} />
            </View>
            <Catatan>{L.formatAngka(p.kg) + ' dari ' + L.formatAngka(p.target, 0) + ' kg (' + p.persen + '%) · tonggak ' + p.tonggak + ' dari 4'}</Catatan>
          </>
        ) : (
          <Catatan>{L.formatAngka(p.kg) + ' kg terkumpul. Belum ada target, atur di menu Target.'}</Catatan>
        )}
        {lit > 0 ? <Catatan>{'Termasuk jelantah ' + L.formatAngka(lit) + ' liter, dihitung ' + L.formatAngka(s.pengaturan.faktorJelantah, 2) + ' kg per liter.'}</Catatan> : null}
      </Kartu>
      <Tombol label="Atur Target" gaya="garis" onPress={() => nav.pergi('waliTarget')} />
      <Tombol label="Papan Kelas" gaya="garis" onPress={() => nav.pergi('papan')} />
      <Tombol label="Keluar" gaya="teks" onPress={() => { keluar(); nav.reset('login'); }} />
    </Layar>
  );
}

export function WaliRiwayat() {
  const { state: s, akun } = useStore();
  const daftar = [...s.setoran].reverse().filter((x) => x.kelas === akun.kelas);
  return (
    <Layar judul="Riwayat Kelas">
      {daftar.length === 0 ? <Catatan>Belum ada setoran.</Catatan> : null}
      {daftar.map((x) => (
        <Kartu key={x.id}>
          <Baris coret={!!x.batal} kiri={tanggal(x.tgl)} kanan={namaJenis(s, x.jenisId) + ' ' + L.formatAngka(x.qty) + ' ' + satuan(s, x.jenisId)} />
          {x.batal ? <Catatan>{'Dibatalkan: ' + x.batal.alasan}</Catatan> : null}
        </Kartu>
      ))}
    </Layar>
  );
}

export function WaliHarga() {
  const { state: s } = useStore();
  return (
    <Layar judul="Daftar Harga">
      <Catatan>Poin yang didapat kelas untuk setiap satuan sampah.</Catatan>
      {s.jenis.filter((j) => j.aktif).map((j) => (
        <Kartu key={j.id}>
          <Baris kiri={j.nama + ' (per ' + j.satuan + ')'} kanan={j.poin + ' poin'} warnaKanan={C.hijau} />
        </Kartu>
      ))}
    </Layar>
  );
}

export function WaliTarget({ nav }) {
  const { state: s, jalankan, akun } = useStore();
  const [kg, setKg] = useState(s.target[akun.kelas] ? String(s.target[akun.kelas]) : '');
  return (
    <Layar judul="Target Kelas" onKembali={nav.kembali}>
      <Isian label="Target sampah per bulan (kg)" nilai={kg} onUbah={setKg} angka />
      <Peringatan hijau>Tonggak dirayakan di 25%, 50%, 75%, dan 100%. Tidak ada peringkat antar kelas.</Peringatan>
      <Tombol
        label="Simpan Target"
        onPress={() => {
          const r = jalankan((st) => L.aturTarget(st, akun.kelas, angkaDari(kg)));
          if (!r.ok) return Alert.alert('Belum bisa disimpan', r.error);
          nav.kembali();
        }}
      />
    </Layar>
  );
}

export function Papan({ nav }) {
  const { state: s } = useStore();
  const b = bln();
  const total = s.pengaturan.kelas.reduce((a, k) => a + L.kgBulan(s, k, b), 0);
  return (
    <Layar judul="Papan Kelas" onKembali={nav.kembali}>
      <Kartu warna={C.hijau}>
        <Teks warna="#D6EBDD" kecil>Terkumpul bersama bulan ini</Teks>
        <Teks besar tebal warna="#FFFFFF" gaya={{ fontSize: 32 }}>{L.formatAngka(total) + ' kg'}</Teks>
      </Kartu>
      <Kartu>
        {s.pengaturan.kelas.map((k) => {
          const p = L.progresTarget(s, k, b);
          return <Baris key={k} kiri={'Kelas ' + k} kanan={p.target ? 'Tonggak ' + p.tonggak + ' dari 4' : 'Belum ada target'} />;
        })}
      </Kartu>
      <Catatan>Papan ini menunjukkan kemajuan, bukan peringkat. Saldo poin kelas lain tidak ditampilkan.</Catatan>
    </Layar>
  );
}
