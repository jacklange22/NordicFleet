import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search skis"
        value={searchTerm}
        onChangeText={setSearchTerm}
        returnKeyType="search"
        onSubmitEditing={() => onSearch(searchTerm)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center', // This will vertically center the items in the container
  },
  input: {
    // Assuming the filter button takes up approximately 1/4 of the space,
    // you can allocate 3/4 for the search bar by setting its flex to 3
    // and the button's flex to 1 in the parent container styles.
    flex: 0.8, // Adjust this value as needed based on the space the filter button takes
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    color: 'white',
    height: 40,
  },
});


export default SearchBar;
