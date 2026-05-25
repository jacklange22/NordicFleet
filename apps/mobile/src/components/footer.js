import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const Footer = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Home"
        onPress={() => navigation.navigate('Home')}>
        <Image
          source={require('../assets/home.png')}
          style={styles.icon}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add ski"
        onPress={() => navigation.navigate('newSki')}>
        <Image
          source={require('../assets/newski.png')}
          style={styles.icon}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Wax log"
        onPress={() => navigation.navigate('WaxLog')}>
        <Image
          source={require('../assets/waxlog.png')}
          style={styles.icon}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Testing log"
        onPress={() => navigation.navigate('TestingLog')}>
        <Image
          source={require('../assets/note.png')}
          style={styles.icon}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#282828',
    height: 40,
  },
  icon: {
    width: 25,
    height: 25,
    tintColor: 'white',
  },
});

export default Footer;
