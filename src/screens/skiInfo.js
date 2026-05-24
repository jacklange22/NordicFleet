import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Footer from '../components/footer.js';
import ProfileButton from '../components/profilebutton.js';
import {useAuth} from '../context/AuthContext';
import {subscribeSki} from '../services/skiService';
import {subscribeWaxLogsForSki} from '../services/waxLogService';
import {subscribeTestLogsForSki} from '../services/testLogService';

const InfoRow = ({label, value}) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value === undefined || value === null ? '—' : String(value)}</Text>
  </View>
);

const formatDate = raw => {
  if (!raw) {
    return '—';
  }
  // Firestore Timestamp has a toDate() method.
  if (raw && typeof raw.toDate === 'function') {
    return raw.toDate().toLocaleDateString();
  }
  if (raw instanceof Date) {
    return raw.toLocaleDateString();
  }
  if (typeof raw === 'string') {
    return raw;
  }
  return '—';
};

const SkiInfo = ({route, navigation}) => {
  const {user} = useAuth();
  const uid = user?.uid;
  const skiId = route?.params?.skiId;

  const [ski, setSki] = useState(null);
  const [waxLogs, setWaxLogs] = useState([]);
  const [testLogs, setTestLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !skiId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubSki = subscribeSki(uid, skiId, data => {
      setSki(data);
      setLoading(false);
    });
    const unsubWax = subscribeWaxLogsForSki(uid, skiId, logs =>
      setWaxLogs(logs.slice(0, 10)),
    );
    const unsubTest = subscribeTestLogsForSki(uid, skiId, logs =>
      setTestLogs(logs.slice(0, 10)),
    );
    return () => {
      unsubSki();
      unsubWax();
      unsubTest();
    };
  }, [uid, skiId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" style={styles.loading} />
      </View>
    );
  }

  if (!ski) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Ski not found</Text>
          <ProfileButton />
        </View>
        <View style={styles.Footer}>
          <Footer />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{ski.name}</Text>
        <ProfileButton />
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.header}>Ski Information</Text>
          <InfoRow label="Flex" value={ski.flex} />
          <InfoRow label="Grind" value={ski.grind} />
          <InfoRow label="Brand" value={ski.brand} />
          <InfoRow label="Model" value={ski.model} />
          <InfoRow label="Base" value={ski.base} />
          <InfoRow label="Build" value={ski.build} />
          <InfoRow label="Technique" value={ski.technique} />
          <InfoRow label="Type" value={ski.type} />
          <InfoRow label="Length" value={ski.length} />
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.header}>Wax History</Text>
          {waxLogs.length === 0 ? (
            <Text style={styles.placeholderText}>No wax logs yet</Text>
          ) : (
            waxLogs.map(log => (
              <TouchableOpacity
                key={log.id}
                accessibilityRole="button"
                accessibilityLabel={`Wax log from ${formatDate(log.date)}`}
                style={styles.historyRow}
                // Tap is a no-op until a detail screen exists.
                onPress={() => navigation.navigate('SkiInfo', {skiId})}>
                <Text style={styles.historyDate}>{formatDate(log.date)}</Text>
                <Text style={styles.historyDetail}>
                  {(log.glideWaxes && log.glideWaxes.join(', ')) || '—'}
                  {log.kickWax ? ` + kick: ${log.kickWax}` : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.header}>Test History</Text>
          {testLogs.length === 0 ? (
            <Text style={styles.placeholderText}>No tests yet</Text>
          ) : (
            testLogs.map(log => (
              <TouchableOpacity
                key={log.id}
                accessibilityRole="button"
                accessibilityLabel={`Test log from ${formatDate(log.date)}`}
                style={styles.historyRow}
                onPress={() => navigation.navigate('SkiInfo', {skiId})}>
                <Text style={styles.historyDate}>{formatDate(log.date)}</Text>
                <Text style={styles.historyDetail}>
                  Glide {log.glideRating ?? '—'} / Kick {log.kickRating ?? '—'}
                  {log.temperature !== null && log.temperature !== undefined
                    ? ` @ ${log.temperature}°C`
                    : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.header}>Notes</Text>
          <Text style={styles.placeholderText}>
            {ski.notes || 'No notes yet'}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.Footer}>
        <Footer />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loading: {
    marginTop: 40,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 200,
  },
  infoContainer: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#282828',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  historyRow: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  historyDate: {
    color: '#fff',
    fontWeight: '600',
  },
  historyDetail: {
    color: '#aaa',
    marginTop: 2,
  },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    color: '#ccc',
    fontSize: 18,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderText: {
    color: '#777',
    fontStyle: 'italic',
  },
  Footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
});

export default SkiInfo;
