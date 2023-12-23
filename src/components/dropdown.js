import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';

const optionHeight = 40; // Estimated height for each option
const doneButtonHeight = 50; // Height for the Done button

const Dropdown = ({ options, onSelect }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState(options[0] || '');

    const handleSelect = (option) => {
        setSelectedOption(option);
        setIsVisible(false);
        onSelect(option); // Assuming onSelect expects a string
    };

    const handleDone = () => {
        setIsVisible(false);
    };

    // Calculate the total height of options and the Done button
    
    const optionsHeight = options.length * optionHeight + doneButtonHeight;

    return (
        <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.dropdownButtonText}>
          {selectedOption || placeholder || 'Select an option'}
        </Text>
      </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isVisible}
                onRequestClose={handleDone}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.optionsContainer, { height: optionsHeight }]}>
                        <ScrollView>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index.toString()} // Since options are strings, index can be used as key
                                    style={styles.option}
                                    onPress={() => handleSelect(option)}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
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
      backgroundColor: '#333', // Dark background
      borderRadius: 30, // Rounded corners
      minWidth: 200, // Minimum width
      borderWidth: 1,
      borderColor: '#555', // Slightly lighter border for subtle effect
    },
    dropdownButton: {
      flexDirection: 'row', // Align 'Skis Waxed' and the icon on the same line
      justifyContent: 'space-between', // Push 'Skis Waxed' and the icon to opposite ends
      alignItems: 'center', // Center items vertically
    },
    dropdownButtonText: {
      fontSize: 16,
      color: '#fff', // White text color
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end', // Align the options to the bottom of the screen
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for the rest of the screen
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
        // Removed maxHeight to use the dynamically calculated height instead
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
      color: '#fff', // Black text for the options
    },
    doneButton: {
        backgroundColor: '#333', // Slightly darker background for the button
        borderRadius: 8,
        padding: 10,
        marginTop: 5, // Spacing between the last option and the Done button
    },
    doneButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
  });
  

export default Dropdown;
