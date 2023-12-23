import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SkiItem = ({ name, technique, type, grind, flex, brand, model, base, build, length, notes }) => {
  console.log(name, technique, type);
  const navigation = useNavigation();
  const goToSkiInfo = () => {
    // Navigate to the SkiInfo screen with parameters
    navigation.navigate('SkiInfo', {
      flex: flex,
      brand: brand,
      model: model,
      base: base,
      build: build,
      name: name,
      technique: technique,
      type: type,
      grind: grind,
      length: length,
    } );
  };
  return (
    <TouchableOpacity style={styles.container} onPress={goToSkiInfo}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.keywords}>
          <TouchableOpacity style={styles.keywordButton}>
            <Text style={styles.keywordText}>{technique}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keywordButton}>
            <Text style={styles.keywordText}>{type}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keywordButton}>
            <Text style={styles.keywordText}>{grind}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
      {/* ... other components if needed ... */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'grey',
    // Removed flexDirection as the default is column
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    // Removed marginBottom to align name with keywords
    flex: 1, // This will allow the name to take up space and push the keywords to the right
  },
  keywords: {
    flexDirection: 'row',
    // Removed justifyContent to allow keywords to sit next to the name
  },
  keywordButton: {
    backgroundColor: 'red',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  keywordText: {
    color: '#fff',
    fontSize: 16,
  },
  arrow: {
    fontSize: 24,
    color: 'white',
    paddingHorizontal: 10, // Adjust as needed for touchable area
  },
  });
  

export default SkiItem;
