import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rowlê</Text>
      <Text style={styles.subtitle}>Descoberta de rolês no DF. Em desenvolvimento.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D0C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#C6FF36',
    fontSize: 40,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A9B1A8',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
