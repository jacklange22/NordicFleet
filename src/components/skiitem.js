import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const SkiItem = ({skiId, name, technique, type, grind}) => {
  const navigation = useNavigation();
  const goToSkiInfo = () => {
    navigation.navigate('SkiInfo', {skiId});
  };
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${name || 'ski'}`}
      style={styles.container}
      onPress={goToSkiInfo}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.keywords}>
          {!!technique && (
            <View style={styles.keywordButton}>
              <Text style={styles.keywordText}>{technique}</Text>
            </View>
          )}
          {!!type && (
            <View style={styles.keywordButton}>
              <Text style={styles.keywordText}>{type}</Text>
            </View>
          )}
          {!!grind && (
            <View style={styles.keywordButton}>
              <Text style={styles.keywordText}>{grind}</Text>
            </View>
          )}
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'grey',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
  },
  keywords: {
    flexDirection: 'row',
  },
  keywordButton: {
    backgroundColor: 'red',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 6,
  },
  keywordText: {
    color: '#fff',
    fontSize: 12,
  },
  arrow: {
    fontSize: 24,
    color: 'white',
    paddingHorizontal: 10,
  },
});

export default SkiItem;
