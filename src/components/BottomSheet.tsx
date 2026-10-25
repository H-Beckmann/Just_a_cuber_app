import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors } from '../theme';

interface Props {
  visible: boolean;
  /** Tapping the backdrop, or the back button on Android. */
  onClose: () => void;
  /**
   * False when the sheet asks something that should not be answered by a
   * stray tap outside it. The back button still closes.
   */
  dismissOnBackdrop?: boolean;
  children: React.ReactNode;
}

/**
 * A panel sliding up from the bottom of the screen.
 *
 * A Modal is a window of its own, so the insets of the app's provider do not
 * apply to it: it gets a provider of its own, and the padding at the bottom
 * comes from there. Without that the last button ends up underneath the
 * navigation buttons of the phone.
 */
export default function BottomSheet({
  visible,
  onClose,
  dismissOnBackdrop = true,
  children,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <Backdrop onClose={dismissOnBackdrop ? onClose : undefined}>
          {children}
        </Backdrop>
      </SafeAreaProvider>
    </Modal>
  );
}

function Backdrop({
  onClose,
  children,
}: {
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable style={styles.backdrop} onPress={onClose} disabled={!onClose}>
      <Pressable
        style={[
          styles.sheet,
          {
            // 16 keeps some air under the last button where the inset is
            // small, as it is with gesture navigation.
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
        onPress={() => {}}
      >
        <View style={styles.grabber} />
        {children}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    gap: 12,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
});
