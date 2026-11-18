import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import WalletScreen from './src/screens/WalletScreen';
import FundScreen from './src/screens/FundScreen';

const TABS = [
  { key: 'wallet', label: 'Wallet' },
  { key: 'fund', label: 'Add PLN' },
];

export default function App() {
  const [tab, setTab] = useState('wallet');
  // Last wallet confirmed by the service, shared by both screens.
  const [wallet, setWallet] = useState(null);

  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <Text style={styles.title}>Exchangeator</Text>
      </View>

      <View style={styles.body}>
        {tab === 'wallet' ? <WalletScreen wallet={wallet} onWallet={setWallet} /> : <FundScreen onWallet={setWallet} />}
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key ? styles.tabActive : null]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 12 : 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1f5fa8' },
  body: { flex: 1 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 24 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { color: '#777', fontSize: 15 },
  tabActive: { color: '#1f5fa8', fontWeight: '700' },
});
