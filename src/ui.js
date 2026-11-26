import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StatusBar, Platform } from 'react-native';

export const C = {
  hijau: '#1F6B4F', tua: '#12261D', latar: '#F4F8F5', garis: '#D5E3DA',
  teks2: '#4C6458', terang: '#E3F1E8', merah: '#B3261E', kuning: '#FBEFD2', kuningTeks: '#5B3E00',
  abu: '#C9D6CE', putih: '#FFFFFF',
};
const atas = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export function Teks({ besar, tebal, warna, kecil, children, gaya, ...rest }) {
  return (
    <Text
      {...rest}
      style={[{ fontSize: besar ? 24 : kecil ? 13 : 15, fontWeight: tebal ? '700' : '400', color: warna || C.tua }, gaya]}
    >
      {children}
    </Text>
  );
}

export function Layar({ judul, onKembali, kembaliLabel, children, bawah, subjudul }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.latar }}>
      <View style={{ backgroundColor: C.hijau, paddingTop: atas + 8, paddingHorizontal: 20, paddingBottom: 16 }}>
        {onKembali ? (
          <Pressable onPress={onKembali} style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="button">
            <Text style={{ color: '#D6EBDD', fontSize: 14, fontWeight: '600' }}>{'‹ ' + (kembaliLabel || 'Kembali')}</Text>
          </Pressable>
        ) : null}
        {subjudul ? <Text style={{ color: '#D6EBDD', fontSize: 13 }}>{subjudul}</Text> : null}
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>{judul}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {bawah}
    </View>
  );
}

export function Kartu({ children, gaya, warna }) {
  return (
    <View
      style={[
        { backgroundColor: warna || C.putih, borderWidth: warna ? 0 : 1, borderColor: C.garis, borderRadius: 16, padding: 14, gap: 6 },
        gaya,
      ]}
    >
      {children}
    </View>
  );
}

export function Tombol({ label, onPress, gaya = 'utama', nonaktif }) {
  const g = {
    utama: { bg: C.hijau, fg: '#FFFFFF', bd: C.hijau },
    garis: { bg: 'transparent', fg: C.hijau, bd: C.hijau },
    merah: { bg: C.merah, fg: '#FFFFFF', bd: C.merah },
    teks: { bg: 'transparent', fg: C.hijau, bd: 'transparent' },
  }[gaya];
  return (
    <Pressable
      onPress={nonaktif ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!nonaktif }}
      style={{
        backgroundColor: nonaktif ? C.abu : g.bg, borderColor: nonaktif ? C.abu : g.bd, borderWidth: 2,
        borderRadius: 14, minHeight: gaya === 'teks' ? 44 : 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
      }}
    >
      <Text style={{ color: nonaktif ? C.teks2 : g.fg, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export function Pilihan({ opsi, nilai, onPilih }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {opsi.map((o) => {
        const on = o.k === nilai;
        return (
          <Pressable
            key={String(o.k)}
            onPress={() => onPilih(o.k)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              minHeight: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: on ? C.hijau : C.putih, borderWidth: on ? 2 : 1, borderColor: on ? C.hijau : C.garis,
            }}
          >
            <Text style={{ color: on ? '#FFFFFF' : C.tua, fontWeight: on ? '700' : '600', fontSize: 14 }}>{o.l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Isian({ label, nilai, onUbah, placeholder, angka, rahasia, panjang }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ fontSize: 14, fontWeight: '600', color: C.tua }}>{label}</Text> : null}
      <TextInput
        value={nilai}
        onChangeText={onUbah}
        placeholder={placeholder}
        placeholderTextColor="#7A8F83"
        keyboardType={angka ? 'decimal-pad' : 'default'}
        secureTextEntry={!!rahasia}
        maxLength={panjang}
        style={{
          minHeight: 48, borderWidth: 1, borderColor: C.tua, borderRadius: 12, backgroundColor: C.putih,
          paddingHorizontal: 14, fontSize: 16, color: C.tua,
        }}
      />
    </View>
  );
}

export function Baris({ kiri, kanan, coret, warnaKanan }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 8 }}>
      <Text style={{ flexShrink: 1, color: C.teks2, fontSize: 15, textDecorationLine: coret ? 'line-through' : 'none' }}>{kiri}</Text>
      <Text
        style={{
          fontWeight: '700', fontSize: 15, color: warnaKanan || C.tua, textAlign: 'right', flexShrink: 1,
          textDecorationLine: coret ? 'line-through' : 'none',
        }}
      >
        {kanan}
      </Text>
    </View>
  );
}

export function Catatan({ children }) {
  return <Text style={{ fontSize: 13, color: C.teks2, lineHeight: 19 }}>{children}</Text>;
}

export function Peringatan({ children, hijau }) {
  return (
    <View style={{ backgroundColor: hijau ? C.terang : C.kuning, borderRadius: 14, padding: 12 }}>
      <Text style={{ fontSize: 14, color: hijau ? '#1F4D3A' : C.kuningTeks, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function BarTab({ item, aktif, onPilih }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.putih, borderTopWidth: 1, borderTopColor: C.garis, paddingBottom: 10, paddingTop: 6 }}>
      {item.map((t) => (
        <Pressable key={t.k} onPress={() => onPilih(t.k)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button">
          <Text style={{ fontSize: 13, fontWeight: aktif === t.k ? '700' : '500', color: aktif === t.k ? C.hijau : C.teks2 }}>{t.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Mata({ tampil, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tampil ? 'Sembunyikan poin' : 'Tampilkan poin'}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.terang, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.hijau }}>{tampil ? 'Tutup' : 'Lihat'}</Text>
    </Pressable>
  );
}

export const TITIK = '• • • • • •';

export function angkaDari(s) {
  const n = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function hariIni() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export function tanggal(t) {
  const [y, m, d] = String(t).split('-');
  return parseInt(d, 10) + ' ' + BLN[parseInt(m, 10) - 1] + ' ' + y;
}
