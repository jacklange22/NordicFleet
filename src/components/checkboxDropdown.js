import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

const MultiSelectDropdown = ({ items, onSelectionDone, label }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSelectItem = (item) => {
    setSelectedItems((prevSelectedItems) => {
      let newSelectedItems;
      if (prevSelectedItems.includes(item)) {
        // If item is already selected, remove it
        newSelectedItems = prevSelectedItems.filter((selectedItem) => selectedItem !== item);
      } else {
        // If item is not selected, add it
        newSelectedItems = [...prevSelectedItems, item];
      }
      console.log(newSelectedItems); // Log the new state to see if it's correct
      return newSelectedItems;
    });
  };
  

  const handleDone = () => {
    onSelectionDone(selectedItems);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setIsVisible(true)}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView style={styles.scrollView}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.item}
                  onPress={() => handleSelectItem(item)}
                >
                  <Text style={styles.itemText}>{item}</Text>
                  {/* Ensure the checkmark is within a Text component */}
                  <Text style={styles.itemCheck}>
                    {selectedItems.includes(item) ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              {/* Ensure the 'Done' text is within a Text component */}
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
        backgroundColor: '#333', // Dark background
        borderRadius: 30, // Rounded corners
        minWidth: 200, // Minimum width
        borderWidth: 1,
        borderColor: '#555', // Slightly lighter border for subtle effect
      },
    button: {
        flexDirection: 'row', // Align 'Skis Waxed' and the icon on the same line
      justifyContent: 'space-between', // Push 'Skis Waxed' and the icon to opposite ends
      alignItems: 'center', // Center items vertically
    },
    buttonText: {
      // The text inside the button
      fontSize: 16,
      color: '#fff',
    },
    modal: {
      // The modal view
      margin: 20,
      width: '90%', // Take up 90% of the screen width
      backgroundColor: '#222', // Dark background for the modal
      borderRadius: 20, // Rounded borders for the modal
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
        // The individual item in the list
        flexDirection: 'row',
        justifyContent: 'space-between', // Spread the items across the container
        paddingVertical: 20,
        borderBottomWidth: 1, // For a separator effect
        borderBottomColor: '#444', // Slightly lighter than the background
        width: '100%', // Ensure the item takes the full width
      },
      itemText: {
        // The text of the item
        color: '#ddd', // Light grey text color
        fontSize: 16,
        flex: 1, // This should allow text to take up all available space
        textAlign: 'left', // Align text to the left
      },
      
    itemCheck: {
      // The checkmark for the selected item
      color: '#fff', // White checkmark for better visibility
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10, // Some space between the text and the checkmark
    },
    doneButton: {
      // The 'Done' button below the list
      marginTop: 10,
      backgroundColor: '#282828', // A green color for confirmation actions
      borderRadius: 20,
      padding: 10,
      elevation: 2,
    },
    doneButtonText: {
      // The text of the 'Done' button
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: 16,
    },
    // Add more styles if needed
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim the background
      },
      scrollView: {
        width: '100%',
      },
  });
  

export default MultiSelectDropdown;


