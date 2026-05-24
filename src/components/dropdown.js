import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';

const optionHeight = 40;
const doneButtonHeight = 50;

const Dropdown = ({options, onSelect, placeholder, value}) => {
  const [isVisible, setIsVisible] = useState(false);
  // Empty string so the placeholder shows on first render. If a controlled
  // `value` is passed, it wins over local state.
  const [selectedOption, setSelectedOption] = useState('');

  const display = value !== undefined && value !== '' ? value : selectedOption;

  const handleSelect = option => {
    setSelectedOption(option);
    setIsVisible(false);
    if (onSelect) {
      onSelect(option);
    }
  };

  const handleDone = () => {
    setIsVisible(false);
  };

  const optionsHeight =
    (options || []).length * optionHeight + doneButtonHeight;

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={placeholder || 'Open dropdown'}
        style={styles.dropdownButton}
        onPress={() => setIsVisible(true)}>
        <Text style={styles.dropdownButtonText}>
          {display || placeholder || 'Select an option'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={handleDone}>
        <View style={styles.modalContainer}>
          <View style={[styles.optionsContainer, {height: optionsHeight}]}>
            <ScrollView>
              {(options || []).map((option, index) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={String(option)}
                  key={index.toString()}
                  style={styles.option}
                  onPress={() => handleSelect(option)}>
                  <Text style={styles.optionText}>{option}</Text>
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
  dropdownContainer: {
    margin: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 30,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#555',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 36,
    width: '80%',
    paddingBottom: 4,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'flex-start',
    height: optionHeight,
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
  },
  doneButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  doneButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Dropdown;
