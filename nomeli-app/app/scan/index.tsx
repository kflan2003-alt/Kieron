import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../src/components/Button';
import { useScanSessionStore } from '../../src/store/useScanSessionStore';
import { color, radius, spacing, type } from '../../src/theme/tokens';

export default function ScanScreen() {
  const router = useRouter();
  const photoUris = useScanSessionStore((s) => s.photoUris);
  const addPhoto = useScanSessionStore((s) => s.addPhoto);
  const reset = useScanSessionStore((s) => s.reset);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) addPhoto(result.assets[0].uri);
  };

  const done = () => {
    router.replace('/scan/confirm');
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Scan your food</Text>
        <View style={styles.closeButton} />
      </View>

      <Text style={styles.instruction}>Take quick photos. Nomeli will sort everything out.</Text>

      <Pressable onPress={takePhoto} style={styles.captureArea}>
        <View style={styles.captureCircle}>
          <Text style={styles.captureIcon}>📷</Text>
        </View>
        <Text style={styles.captureHint}>Tap to take a photo</Text>
      </Pressable>

      {photoUris.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
          {photoUris.map((uri, i) => (
            <Image key={`${uri}-${i}`} source={{ uri }} style={styles.thumb} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.counter}>{photoUris.length} item{photoUris.length === 1 ? '' : 's'} scanned</Text>

      <Button label="Done" onPress={done} disabled={photoUris.length === 0} block style={styles.doneButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.avocadoDarker, paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  closeButton: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeLabel: { color: color.white, fontSize: 16 },
  title: { ...type.h2, color: color.white },
  instruction: { ...type.body, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: spacing.xxl },
  captureArea: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.md },
  captureCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  captureIcon: { fontSize: 40 },
  captureHint: { ...type.small, color: 'rgba(255,255,255,0.6)' },
  thumbRow: { marginBottom: spacing.md, maxHeight: 72 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, marginRight: spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)' },
  counter: { ...type.bodyMedium, color: color.white, textAlign: 'center', marginBottom: spacing.lg },
  doneButton: {},
});
