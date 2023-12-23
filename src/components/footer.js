import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Footer = () => {
  const navigation = useNavigation();
  // Footer component's styles
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
        },
      });
  

  return (
    <View style={styles.footer}>
      {/* For a PNG icon */}
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Image source={require('../assets/home.png')} style={{...styles.icon, tintColor: 'white'}} />
      </TouchableOpacity>

      {/* For another PNG icon */}
      <TouchableOpacity onPress={() => navigation.navigate('newSki')}>
      <Image source={require('../assets/newski.png')} style={{...styles.icon, tintColor: 'white'}}/>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('WaxLog')}>
        <Image source={require('../assets/waxlog.png')} style={{...styles.icon, tintColor: 'white'}} />
      </TouchableOpacity> 

      {/* For a PNG icon used within Svg component, which is not correct */}
      {/* If you have an SVG path for waxing log, use it here as shown above */}
      {/* If you only have a PNG, use the Image component as shown in the first two buttons */}
      <TouchableOpacity onPress={() => navigation.navigate('TestingLog')}>
        <Image source={require('../assets/note.png')} style={{...styles.icon, tintColor: 'white'}} />
      </TouchableOpacity>
    </View>
  );
};
const footerStyles = StyleSheet.create({
    footerContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      // Define height, backgroundColor, and other properties as needed
    },
    });


export default Footer;
