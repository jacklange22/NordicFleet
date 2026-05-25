import React from 'react';
import {View, Image, Text, StyleSheet, StatusBar} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, spacing, typography, radius} from '../theme';
import Button from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  componentDidCatch() {
    // In real life we'd ship to crash reporting. Here we just keep state.
  }

  handleRestart = () => {
    // Best-effort restart — reset our local state so the tree re-renders.
    // On a real device the user would force-close and reopen the app, but
    // clearing this state recovers from most render-time errors.
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" />
          <Image
            source={require('../assets/nordicfleet.png')}
            style={styles.logo}
            accessibilityElementsHidden
            importantForAccessibility="no"
            resizeMode="contain"
          />
          <View style={styles.iconBadge}>
            <Ionicons name="warning-outline" size={36} color={colors.red} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We hit an unexpected error. Try restarting the app.
          </Text>
          {this.state.error && (
            <Text style={styles.errorDetail} numberOfLines={3}>
              {String(this.state.error.message || this.state.error)}
            </Text>
          )}
          <View style={styles.actionWrap}>
            <Button
              variant="primary"
              size="md"
              icon="refresh"
              onPress={this.handleRestart}>
              Restart app
            </Button>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.lg,
    opacity: 0.7,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 57, 53, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorDetail: {
    ...typography.bodySm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionWrap: {
    marginTop: spacing.md,
  },
});

export default ErrorBoundary;
