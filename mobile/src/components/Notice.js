import { StyleSheet, Text, View } from 'react-native';

const TONES = {
  error: { bg: '#fdecec', border: '#e0a3a3', text: '#8a1f1f' },
  warning: { bg: '#fff4e0', border: '#e8c27a', text: '#7a4b00' },
  success: { bg: '#e8f5e9', border: '#9ccc9c', text: '#1e5e22' },
};

export default function Notice({ tone = 'error', title, children }) {
  const c = TONES[tone];
  return (
    <View style={[styles.box, { backgroundColor: c.bg, borderColor: c.border }]}>
      {title ? <Text style={[styles.title, { color: c.text }]}>{title}</Text> : null}
      <Text style={{ color: c.text }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12 },
  title: { fontWeight: '600', marginBottom: 4 },
});
