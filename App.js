import React, { useState } from 'react';
import { View, BackHandler, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/store';
import { BarTab, C } from './src/ui';
import { Login } from './src/screens/auth';
import * as P from './src/screens/pengelola';
import * as W from './src/screens/wali';

const LAYAR = {
  login: Login,
  beranda: P.Beranda, setor: P.Setor, riwayat: P.Riwayat, tarik: P.Tarik, kas: P.Kas,
  setorBerhasil: P.SetorBerhasil, penarikanBerhasil: P.PenarikanBerhasil, batal: P.Batal,
  penjualan: P.Penjualan, rekap: P.Rekap, cekKas: P.CekKas, harga: P.Harga, ubahHarga: P.UbahHarga,
  tambahJenis: P.TambahJenis, pengaturan: P.Pengaturan, kelolaAkun: P.KelolaAkun,
  waliBeranda: W.WaliBeranda, waliRiwayat: W.WaliRiwayat, waliHarga: W.WaliHarga, waliTarget: W.WaliTarget, papan: W.Papan,
};
const TAB_P = [{ k: 'beranda', l: 'Beranda' }, { k: 'setor', l: 'Setor' }, { k: 'riwayat', l: 'Riwayat' }, { k: 'tarik', l: 'Tarik' }, { k: 'kas', l: 'Kas' }];
const TAB_W = [{ k: 'waliBeranda', l: 'Beranda' }, { k: 'waliRiwayat', l: 'Riwayat' }, { k: 'waliHarga', l: 'Harga' }];

function Isi() {
  const { state } = useStore();
  const [tumpukan, setTumpukan] = useState([{ nama: 'login', params: {} }]);
  const atas = tumpukan[tumpukan.length - 1];

  const nav = {
    pergi: (nama, params = {}) => setTumpukan((t) => [...t, { nama, params }]),
    ganti: (nama, params = {}) => setTumpukan((t) => [...t.slice(0, -1), { nama, params }]),
    reset: (nama, params = {}) => setTumpukan([{ nama, params }]),
    kembali: () => setTumpukan((t) => (t.length > 1 ? t.slice(0, -1) : t)),
  };

  React.useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tumpukan.length > 1) { nav.kembali(); return true; }
      return false;
    });
    return () => h.remove();
  }, [tumpukan.length]);

  if (!state) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.latar }}><ActivityIndicator color={C.hijau} /></View>;
  const Komponen = LAYAR[atas.nama];
  const tabs = TAB_P.some((t) => t.k === atas.nama) ? TAB_P : TAB_W.some((t) => t.k === atas.nama) ? TAB_W : null;
  return (
    <View style={{ flex: 1 }}>
      <Komponen nav={nav} params={atas.params} />
      {tabs ? <BarTab item={tabs} aktif={atas.nama} onPilih={(k) => nav.reset(k)} /> : null}
    </View>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Isi />
    </StoreProvider>
  );
}
