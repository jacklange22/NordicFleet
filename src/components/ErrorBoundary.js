import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  componentDidCatch(error, info) {
    // In real life we'd ship to crash reporting. Here we just keep the state.
    void info;
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>Please restart the app.</Text>
          {this.state.error && (
            <Text style={styles.errorDetail}>
              {String(this.state.error.message || this.state.error)}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  errorDetail: {
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
