import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { fundWallet } from '../api/endpoints';
import Notice from '../components/Notice';

// Write path: adds simulated PLN (F4). A tap only sends the request;
// the result shown is always the one the service confirmed.
export default function FundScreen({ onWallet }) {
  const [amount, setAmount] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // The requestId is kept when the answer did not arrive, so a retry of the same
  // amount cannot add the money twice (N6). Full recovery flow comes in Lab 10.
  const [pending, setPending] = useState(null);

  async function submit() {
    const value = amount.trim().replace(',', '.');
    if (!value) {
      setError({ kind: 'validation', message: 'Enter an amount, for example 100.00' });
      setState('error');
      return;
    }
    const requestId = pending && pending.amount === value ? pending.requestId : Crypto.randomUUID();
    setPending({ requestId, amount: value });
    setState('sending');
    setError(null);
    try {
      const res = await fundWallet(requestId, value);
      setPending(null);
      setResult(res);
      onWallet(res.wallet);
      setAmount('');
      setState('done');
    } catch (err) {
      if (err.kind !== 'network' && err.kind !== 'timeout') setPending(null);
      setError(err);
      setState('error');
    }
  }

  const pln = result && result.wallet.balances.find((b) => b.currency === 'PLN');

  return (
    <View style={styles.page}>
      <Text style={styles.heading}>Add PLN</Text>
      <Text style={styles.muted}>Simulated funding: 1.00 to 10 000.00 PLN per operation.</Text>

      <TextInput
        style={[styles.input, error && error.kind === 'validation' ? styles.inputError : null]}
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          if (state !== 'sending') setState('idle');
        }}
        placeholder="100.00"
        keyboardType="decimal-pad"
        editable={state !== 'sending'}
      />
      {state === 'error' && error.kind === 'validation' ? <Text style={styles.fieldError}>{error.message}</Text> : null}

      <Pressable
        style={[styles.button, state === 'sending' ? styles.buttonBusy : null]}
        onPress={submit}
        disabled={state === 'sending'}
      >
        {state === 'sending' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add PLN</Text>}
      </Pressable>

      {state === 'done' && result ? (
        <Notice tone="success" title={result.replayed ? 'Already added earlier' : 'Added'}>
          {`${result.transaction.amount} PLN. New balance: ${pln.amount} PLN.`}
        </Notice>
      ) : null}

      {state === 'error' && error.kind === 'network' ? (
        <Notice tone="warning" title="No connection to the server">
          {`${error.message} Tap "Add PLN" again to retry; the same request is reused, so the money is never added twice.`}
        </Notice>
      ) : null}
      {state === 'error' && error.kind === 'timeout' ? (
        <Notice tone="warning" title="No answer yet">
          {`${error.message} The amount may or may not have been added. Check the wallet, or tap "Add PLN" again: the same request is reused, so it is added at most once.`}
        </Notice>
      ) : null}
      {state === 'error' && (error.kind === 'server' || error.kind === 'config' || error.kind === 'auth') ? (
        <Notice tone="error" title="Something went wrong">
          {error.message}
        </Notice>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20 },
  heading: { fontSize: 24, fontWeight: '700' },
  muted: { color: '#666', marginTop: 4 },
  input: { marginTop: 20, borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, fontSize: 20 },
  inputError: { borderColor: '#c62828' },
  fieldError: { color: '#c62828', marginTop: 6 },
  button: { marginTop: 16, backgroundColor: '#1f5fa8', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonBusy: { backgroundColor: '#7a9cc4' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
