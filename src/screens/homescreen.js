import React, {useState, useEffect, useMemo} from 'react';
import {SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import ProfileButton from '../components/profilebutton.js';
import Footer from '../components/footer.js';
import SearchBar from '../components/searchbar.js';
import SkiItem from '../components/skiitem.js';
import FilterMenu from '../components/filtermenu.js';
import testingData from '../testingdata.json';

const HomeScreen = () => {
  const [userSkis, setUserSkis] = useState([]);
  const userId = 'user1'; // Phase 3 swaps in AuthContext.

  useEffect(() => {
    // Fix: the JSON uses `id`, not `userId`.
    const userData = testingData.users.find(user => user.id === userId);
    if (userData) {
      setUserSkis(userData.skis);
    } else {
      setUserSkis([]);
    }
  }, [userId]);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [technique, setTechnique] = useState(null);
  const [condition, setCondition] = useState(null);

  const toggleFilterMenu = () => {
    setIsFilterVisible(v => !v);
  };

  const filteredSkis = useMemo(() => {
    let result = userSkis;
    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      result = result.filter(ski =>
        (ski.name || '').toLowerCase().includes(needle),
      );
    }
    if (technique) {
      result = result.filter(ski => ski.technique === technique);
    }
    if (condition) {
      // condition matches the `type` field on the ski (Cold/Warm/Universal).
      result = result.filter(
        ski => (ski.type || '').toLowerCase() === condition.toLowerCase(),
      );
    }
    return result;
  }, [userSkis, searchTerm, technique, condition]);

  const handleSearch = term => setSearchTerm(term);
  const handleApplyFilter = (t, c) => {
    setTechnique(t);
    setCondition(c);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome back!</Text>
        <ProfileButton />
      </View>

      <View style={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Toggle filter menu"
          onPress={toggleFilterMenu}
          style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterOptionsContainer}>
        {isFilterVisible && <FilterMenu onApplyFilter={handleApplyFilter} />}
      </View>
      <FlatList
        data={filteredSkis}
        renderItem={({item}) => (
          <SkiItem
            skiId={item.id}
            name={item.name}
            technique={item.technique}
            type={item.type}
            grind={item.grind}
            flex={item.flex}
            brand={item.brand}
            model={item.model}
            base={item.base}
            build={item.build}
            length={item.length}
            notes={item.notes}
          />
        )}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No skis yet — add one!</Text>
        }
      />

      <View style={styles.Footer}>
        <Footer />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#282828',
    height: 50,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    marginTop: 0,
    justifyContent: 'space-around',
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 16,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  Footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
});

export default HomeScreen;
