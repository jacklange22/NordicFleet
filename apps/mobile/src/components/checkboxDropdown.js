import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';

/**
 * Multi-select dropdown.
 *
 * `items` is an array of `{ id, label }` objects.
 * `onSelectionDone(selectedIds)` receives the array of selected IDs on Done.
 */
const MultiSelectDropdown = ({items, onSelectionDone, label}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectItem = id => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  const handleDone = () => {
    onSelectionDone(selectedIds);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.button}
        onPress={() => setIsVisible(true)}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView style={styles.scrollView}>
              {(items || []).map(item => (
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityLabel={item.label}
                  accessibilityState={{checked: selectedIds.includes(item.id)}}
                  key={item.id}
                  style={styles.item}
                  onPress={() => handleSelectItem(item.id)}>
                  <Text style={styles.itemText}>{item.label}</Text>
                  <Text style={styles.itemCheck}>
                    {selectedIds.includes(item.id) ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Done"
              style={styles.doneButton}
              onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 30,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#555',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  modal: {
    margin: 20,
    width: '90%',
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    width: '100%',
  },
  itemText: {
    color: '#ddd',
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
  },
  itemCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: '#282828',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollView: {
    width: '100%',
  },
});

export default MultiSelectDropdown;
