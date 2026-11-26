import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useStore } from '../store';
import { Layar, Kartu, Tombol, Isian, Catatan, Peringatan, Teks } from '../ui';

export function Login({ nav }) {
  const { state: s, masuk } = useStore();
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [pin, setPin] = useState('');
  return (
    <Layar judul={s.sekolah.bank} subjudul="Masuk">
      <Isian label="Kode sekolah" nilai={kode} onUbah={setKode} placeholder="Contoh: BSL-001" />
      <Isian label="Nama pengguna" nilai={nama} onUbah={setNama} placeholder="Contoh: wali.kelas3" />
      <Isian label="PIN (6 angka)" nilai={pin} onUbah={setPin} angka rahasia panjang={6} />
      <Tombol
        label="Masuk"
        onPress={() => {
          const a = s.akun.find((x) => x.nama === nama.trim() && x.pin === pin);
          if (kode.trim().toUpperCase() !== s.sekolah.kode.toUpperCase() || !a) {
            return Alert.alert('Belum bisa masuk', 'Kode sekolah, nama pengguna, atau PIN salah.');
          }
          masuk(a.id);
          nav.reset(a.peran === 'pengelola' ? 'beranda' : 'waliBeranda');
        }}
      />
      <Kartu>
        <Teks tebal>Versi uji coba</Teks>
        <Catatan>Data tersimpan di HP ini saja. Untuk mencoba: kode BSL-001, pengguna pengelola.bsl atau wali.kelas3 (sampai wali.kelas6), PIN 123456.</Catatan>
        <Tombol label="Isi otomatis sebagai pengelola" gaya="teks" onPress={() => { setKode(s.sekolah.kode); setNama('pengelola.bsl'); setPin('123456'); }} />
        <Tombol label="Isi otomatis sebagai wali kelas 3" gaya="teks" onPress={() => { setKode(s.sekolah.kode); setNama('wali.kelas3'); setPin('123456'); }} />
      </Kartu>
      <Peringatan>Ganti PIN bawaan lewat Pengaturan, Kelola Akun, sebelum dipakai sungguhan.</Peringatan>
    </Layar>
  );
}
