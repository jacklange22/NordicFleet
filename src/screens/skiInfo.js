import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import Footer from '../components/footer.js';
import ProfileButton from '../components/profilebutton.js';

const SkiInfo = ({route}) => {
  const params = route?.params || {};
  const {
    flex,
    grind,
    brand,
    model,
    base,
    build,
    name,
    technique,
    type,
    length,
    notes,
  } = params;

  const InfoRow = ({label, value}) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{name}</Text>
        <ProfileButton />
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.header}>Ski Information</Text>
          <InfoRow label="Flex" value={flex} />
          <InfoRow label="Grind" value={grind} />
          <InfoRow label="Brand" value={brand} />
          <InfoRow label="Model" value={model} />
          <InfoRow label="Base" value={base} />
          <InfoRow label="Build" value={build} />
          <InfoRow label="Technique" value={technique} />
          <InfoRow label="Type" value={type} />
          <InfoRow label="Length" value={length} />
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.header}>Wax History</Text>
          <Text style={styles.placeholderText}>
            Wax history will be displayed here.
          </Text>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.header}>Test History</Text>
          <Text style={styles.placeholderText}>
            Test history will be displayed here.
          </Text>
        </View>
        <View style={styles.historyContainer}>
          <Text style={styles.header}>Notes</Text>
          <Text style={styles.placeholderText}>{notes}</Text>
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
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
  headerText: {
    fontSize: 24,
    color: '#fff',
  },
  historyContainer: {
    padding: 30,
    marginTop: 10,
    marginBottom: 30,
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
    color: '#555',
    fontStyle: 'italic',
  },
  Footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
});

export default SkiInfo;
