/**
 * App-wide Error Boundary for the Qur'ān, Bible and Science app.
 *
 * Last-resort fail-safe: catches any uncaught render error and shows the
 * user a calm "Something went wrong" card with a Go-back button — instead
 * of letting the whole app white-screen.
 *
 * Every caught error is forwarded to Sentry so we still see it in alerts.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { colors, radius, spacing, type as ty } from '../theme';
import { useApp } from '../store/useApp';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

class ErrorBoundaryInner extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message:
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    try {
      Sentry.captureException(error, {
        contexts: {
          react: { componentStack: info?.componentStack ?? '' },
        },
        tags: { boundary: 'app-root', app: 'quran-bible-science' },
      });
    } catch {
      /* Sentry not initialised in some preview/dev contexts. */
    }
    // eslint-disable-next-line no-console
    console.warn('[ErrorBoundary] caught', error, info?.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.kicker}>SOMETHING WENT WRONG</Text>
          <Text style={styles.title}>We hit a snag opening that page</Text>
          <Text style={styles.body}>
            The issue has been reported automatically. Tap below to go back
            and try again — your unlock and bookmarks are safe.
          </Text>
          {!!this.state.message && (
            <Text style={styles.detail} numberOfLines={3}>{this.state.message}</Text>
          )}
          <Pressable
            onPress={this.reset}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.btnText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

export function ErrorBoundary(props: Props) {
  // Hook into the store outside of the class boundary so it stays alive.
  // (Not used directly — boundary always uses Sentry. Hook reserved for future
  // "Send report including current lang/screen" features.)
  useApp.getState();
  return <ErrorBoundaryInner>{props.children}</ErrorBoundaryInner>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%', maxWidth: 420, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.gold + '88',
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center',
  },
  kicker: { ...ty.label, color: colors.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm, fontSize: 11 },
  title: { ...ty.h2, color: colors.silverHi, textAlign: 'center', marginBottom: spacing.sm },
  body: { ...ty.body, color: colors.text, textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  detail: { ...ty.tiny, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginBottom: spacing.md },
  btn: { backgroundColor: colors.gold, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill, marginTop: spacing.xs },
  btnText: { color: colors.bg, fontWeight: '700' },
});
