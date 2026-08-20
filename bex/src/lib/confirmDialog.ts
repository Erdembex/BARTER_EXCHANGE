import { Alert, Platform } from 'react-native';

/** Native Alert + web window.confirm */
export function confirmDialog(
  title: string,
  message: string,
  confirmLabel = 'OK',
  cancelLabel = 'Vazgeç',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}
