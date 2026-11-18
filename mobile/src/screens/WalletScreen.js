import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getWallet } from '../api/endpoints';
import Notice from '../components/Notice';

function timeOf(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Read path: loads the balances from the service (F9).
export default function WalletScreen({ wallet, onWallet }) {
  const [state, setState] = useState(wallet ? 'ready' : 'loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setState((s) => (s === 'ready' ? 'refreshing' : 'loading'));
    setError(null);
    try {
      onWallet(await getWallet());
      setState('ready');
    } catch (err) {
      setError(err);
      setState('error');
    }
  }, [onWallet]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={state === 'refreshing'} onRefresh={load} />}
    >
      <Text style={styles.heading}>Wallet</Text>
      <Text style={styles.muted}>Simulated money, no real funds.</Text>

      {state === 'loading' ? <ActivityIndicator style={{ marginTop: 32 }} size="large" /> : null}

      {wallet ? (
        <View style={styles.card}>
          {wallet.balances.map((b) => (
            <View key={b.currency} style={styles.row}>
              <Text style={styles.code}>{b.currency}</Text>
              <Text style={styles.amount}>{b.amount}</Text>
            </View>
          ))}
          <Text style={styles.muted}>Confirmed by the server at {timeOf(wallet.asOf)}</Text>
        </View>
      ) : null}

      {state === 'error' ? (
        <>
          <Notice tone={error.kind === 'network' || error.kind === 'timeout' ? 'warning' : 'error'} title="Could not load the wallet">
            {error.message}
          </Notice>
          <Pressable style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20 },
  heading: { fontSize: 24, fontWeight: '700' },
  muted: { color: '#666', marginTop: 4 },
  card: { marginTop: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  code: { fontSize: 18, fontWeight: '600' },
  amount: { fontSize: 18, fontVariant: ['tabular-nums'] },
  button: { marginTop: 12, backgroundColor: '#1f5fa8', borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
