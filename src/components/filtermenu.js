import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FilterMenu = ({ onApplyFilter }) => {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);

  const toggleTechnique = (technique) => {
    setSelectedTechnique(technique === selectedTechnique ? null : technique);
  };

  const toggleCondition = (condition) => {
    setSelectedCondition(condition === selectedCondition ? null : condition);
  };

  const applyFilter = () => {
    onApplyFilter(selectedTechnique, selectedCondition);
  };

  return (
    <View style={styles.filterMenu}>
      <Text style={styles.filterTitle}>Technique</Text>
      <View style={styles.filterRow}>
        <FilterButton
          title="Skate"
          onPress={() => toggleTechnique('Skate')}
          isSelected={selectedTechnique === 'Skate'}
        />
        <FilterButton
          title="Classic"
          onPress={() => toggleTechnique('Classic')}
          isSelected={selectedTechnique === 'Classic'}
        />
      </View>

      <Text style={styles.filterTitle}>Condition</Text>
      <View style={styles.filterRow}>
        <FilterButton
          title="Cold"
          onPress={() => toggleCondition('Cold')}
          isSelected={selectedCondition === 'Cold'}
        />
        <FilterButton
          title="Universal"
          onPress={() => toggleCondition('Universal')}
          isSelected={selectedCondition === 'Universal'}
        />
        <FilterButton
          title="Warm"
          onPress={() => toggleCondition('Warm')}
          isSelected={selectedCondition === 'Warm'}
        />
      </View>

      <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};

const FilterButton = ({ title, onPress, isSelected }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterButton, isSelected ? styles.selected : styles.unselected]}
  >
    <Text style={styles.filterButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Define your styles
const styles = StyleSheet.create({
  filterMenu: {
    // Style for the filter menu container
  },
  filterTitle: {
    // Style for the filter titles (Technique, Condition)
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // Additional styles
  },
  filterButton: {
    // Base style for filter buttons
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    // Additional styles
  },
  selected: {
    backgroundColor: 'red',
  },
  unselected: {
    backgroundColor: 'grey',
  },
  filterButtonText: {
    color: 'white',
    // Additional styles
  },
  applyButton: {
    // Style for the apply button
    backgroundColor: 'red',
    borderRadius: 20,
    padding: 10,
    // Additional styles
  },
  applyButtonText: {
    color: 'white',
    textAlign: 'center',
    // Additional styles
  },
});

export default FilterMenu;
