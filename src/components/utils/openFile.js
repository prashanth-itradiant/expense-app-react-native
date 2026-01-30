import { API_URL } from '@env';
import { Alert, Linking } from 'react-native';

export const openFile = async file => {
  try {
    // ✅ handle string OR object
    const fileUrl =
      typeof file === 'string'
        ? file
        : file?.url || file?.path || file?.filename;

    if (!fileUrl) {
      Alert.alert('Error', 'Invalid file');
      return;
    }

    const res = await fetch(`${API_URL}/files/signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fileUrl }),
    });

    const data = await res.json();

    if (!data.success || !data.url) {
      Alert.alert('Error', 'Failed to generate signed URL');
      return;
    }

    await Linking.openURL(data.url);
  } catch (err) {
    console.error('openFile error:', err);
    Alert.alert('Error', 'Unable to open file');
  }
};
