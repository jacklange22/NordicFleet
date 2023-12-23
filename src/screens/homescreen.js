import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList } from 'react-native';
import ProfileButton from '../components/profilebutton.js'; // Assuming you have this component
import Footer from '../components/footer.js'; // Assuming you have this component
import SearchBar from '../components/searchbar.js'; // Assuming you have this component
import SkiItem from '../components/skiitem.js'; // Assuming SkiItem is a separate component
import FilterMenu from '../components/filtermenu.js';
import { TouchableOpacity } from 'react-native';
import testingData from '../testingdata.json'; // Ensure you have the correct path


const HomeScreen = () => {
  const [userSkis, setUserSkis] = useState([]);
  const userId = 'user1'; //route.params eventually

  useEffect(() => {
    // Simulate fetching data and filtering by user
    const userData = testingData.users.find(user => user.userId === userId);
    if (userData) {
      setUserSkis(userData.skis);
      console.log(userSkis)
    } else {
      console.log('User not found');
    }
  }, [userId]);

  const [skis, setSkis] = useState([
    { id: '1', name: 'Ski 1', technique: 'Classic', condition: 'Cold', grind: 'Fine' },
    { id: '2', name: 'Ski 2', technique: 'Skate', condition: 'Warm', grind: 'Coarse' },
    // ... more dummy skis
  ]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);


// To toggle the visibility of the filter menu
const toggleFilterMenu = () => {
  setIsFilterVisible(!isFilterVisible);
};


  const [filteredSkis, setFilteredSkis] = useState(skis);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm);
    const filtered = skis.filter((ski) =>
      ski.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSkis(filtered);
  };

  const handleApplyFilter = (technique, condition) => {
    let filtered = skis;
    if (searchTerm) {
      filtered = filtered.filter((ski) =>
        ski.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (technique) {
      filtered = filtered.filter((ski) => ski.technique === technique);
    }
    if (condition) {
      filtered = filtered.filter((ski) => ski.condition === condition);
    }
    setFilteredSkis(filtered);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome back!</Text>
        <ProfileButton />
      </View>
  
      {/* Container View for SearchBar and Filter Button */}
      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
        <TouchableOpacity onPress={toggleFilterMenu} style={styles.filterButton}>
         <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterOptionsContainer}>
  
      {isFilterVisible && <FilterMenu onApplyFilter={handleApplyFilter} />}
      </View>
      <FlatList
        data={filteredSkis}
        renderItem={({ item }) => (
          <SkiItem
            name={item.name}
            technique={item.technique}
            type={item.condition}
            grind={item.grind}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
      />
  
  <View style={styles.Footer}>
      <Footer />
    </View>
    </SafeAreaView>

  ); 
        } 

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Match the background color with the rest of the screen if needed
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Only horizontal padding
    backgroundColor: '#282828', // Set the background color of the header
    height: 50, // Set the height of the header
    // Ensure there is no top margin/padding if you want content against the edges
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 10,
    borderRadius: 10,
    margin: 16,
  },
  skiItem: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 16,
  },
  skiText: {
    color: '#fff',
  },
  filterButton: {
    // Add styling for the filter button here
    // For example:
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'red', // Use your app's theme color
    borderRadius: 5,
    marginTop: 0,
    justifyContent: 'space-around',
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap', // Ensure options wrap to the next line if space runs out
    marginBottom: 20, // Space between the filter options and the apply button
  },
  searchContainer: {
    flexDirection: 'row', // Aligns items in a row
    justifyContent: 'space-around', // Puts space between items
    alignItems: 'center', // Centers items vertically
    paddingHorizontal: 30, // Add horizontal padding
    // Add other styling as needed
  },
  filterButtonText: {
    // Add styling for the filter button text here
    color: 'white', // White text color for the filter button
    fontSize: 16,
  },
  Footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
 },
  // ...other styles
});

export default HomeScreen;
