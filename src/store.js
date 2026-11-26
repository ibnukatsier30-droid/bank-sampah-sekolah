import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultState } from './logic';

const KUNCI = 'bank-sampah-state-v1';
const Konteks = createContext(null);

function akunAwal() {
  const wali = [3, 4, 5, 6].map((k) => ({ id: 'a' + k, peran: 'wali', kelas: k, nama: 'wali.kelas' + k, pin: '123456' }));
  return [{ id: 'a0', peran: 'pengelola', nama: 'pengelola.bsl', pin: '123456' }, ...wali];
}

function stateAwal() {
  return { ...defaultState(), akun: akunAwal() };
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(null);
  const [sesi, setSesi] = useState(null); // id akun yang masuk
  const ref = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(KUNCI)
      .then((v) => {
        let s = null;
        if (v) {
          try { s = JSON.parse(v); } catch (e) { s = null; }
        }
        s = s || stateAwal();
        ref.current = s;
        setState(s);
      })
      .catch(() => {
        const s = stateAwal();
        ref.current = s;
        setState(s);
      });
  }, []);

  // fn(state) -> { ok, state } | { ok:false, error }
  const jalankan = useCallback((fn) => {
    const r = fn(ref.current);
    if (r.ok) {
      ref.current = r.state;
      setState(r.state);
      AsyncStorage.setItem(KUNCI, JSON.stringify(r.state)).catch(() => {});
    }
    return r;
  }, []);

  const reset = useCallback(() => {
    const s = stateAwal();
    ref.current = s;
    setState(s);
    AsyncStorage.setItem(KUNCI, JSON.stringify(s)).catch(() => {});
  }, []);

  const akun = state && sesi ? state.akun.find((a) => a.id === sesi) || null : null;
  return (
    <Konteks.Provider value={{ state, jalankan, reset, akun, masuk: setSesi, keluar: () => setSesi(null) }}>
      {children}
    </Konteks.Provider>
  );
}

export function useStore() {
  return useContext(Konteks);
}

export function tambahAkun(state, { peran, kelas, nama, pin }) {
  if (!nama || !String(nama).trim()) return { ok: false, error: 'Nama pengguna wajib diisi.' };
  if (!/^\d{6}$/.test(pin || '')) return { ok: false, error: 'PIN harus 6 angka.' };
  const n = String(nama).trim();
  if (state.akun.some((a) => a.nama === n)) return { ok: false, error: 'Nama pengguna sudah dipakai.' };
  if (peran === 'wali' && !state.pengaturan.kelas.includes(kelas)) return { ok: false, error: 'Pilih kelas.' };
  const id = 'a' + (state.seq + 1);
  const baru = peran === 'wali' ? { id, peran, kelas, nama: n, pin } : { id, peran: 'pengelola', nama: n, pin };
  return { ok: true, state: { ...state, seq: state.seq + 1, akun: [...state.akun, baru] } };
}

export function aturPIN(state, id, pin) {
  if (!/^\d{6}$/.test(pin || '')) return { ok: false, error: 'PIN harus 6 angka.' };
  return { ok: true, state: { ...state, akun: state.akun.map((a) => (a.id === id ? { ...a, pin } : a)) } };
}
