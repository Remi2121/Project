// camera.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../utilis/Settings';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const router = useRouter();

  // theme
  const { isDark } = useSettings();
  const styles = getCameraStyles(isDark);
  const palette = getPalette(isDark);

  // NOTE: keep your key where it is (or move to secure storage). Leaving as-is.
  const GC_API_KEY = 'AIzaSyBv6KZSIw8fmWblJ2IbotzwGP0atovp70c';
  const GC_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GC_API_KEY}`;

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        setPreviewUri(photo.uri);
        setBase64Image(photo.base64 || null);
      } catch (err) {
        console.warn('takePhoto error', err);
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const picked = result.assets[0];
        setPreviewUri(picked.uri);
        setBase64Image((picked as any).base64 || null);
      }
    } catch (err) {
      console.warn('pickImageFromGallery error', err);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    setBase64Image(null);
  };

  const handleUsePhoto = async () => {
    if (!base64Image) return;
    try {
      const requestBody = {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'FACE_DETECTION', maxResults: 10 }],
          },
        ],
      };

      const response = await fetch(GC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.error) {
        alert(`API Error: ${data.error.message || 'Unknown error'}`);
        return;
      }

      if (!data.responses || data.responses.length === 0 || !data.responses[0].faceAnnotations) {
        alert('No face detected.');
        return;
      }

      const face = data.responses[0].faceAnnotations[0];
      const mood = getDominantMood(face);
      const confidence = face.detectionConfidence;

      router.push({
        pathname: '/cameraResult' as any,
        params: {
          mood,
          confidence: (confidence * 100).toFixed(1) + '%',
          imageUri: previewUri,
        },
      });
    } catch (error) {
      console.warn('handleUsePhoto error', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const getDominantMood = (emotion: any): string => {
    const likelihoodScore: Record<string, number> = {
      VERY_UNLIKELY: 0,
      UNLIKELY: 1,
      POSSIBLE: 2,
      LIKELY: 3,
      VERY_LIKELY: 4,
    };

    const scores: Record<string, number> = {
      Joy: likelihoodScore[emotion.joyLikelihood],
      Sorrow: likelihoodScore[emotion.sorrowLikelihood],
      Anger: likelihoodScore[emotion.angerLikelihood],
      Surprise: likelihoodScore[emotion.surpriseLikelihood],
    };

    const dominant = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
    return dominant[1] === 0 ? 'Neutral' : dominant[0];
  };

  if (!permission) return <View style={[styles.container, { backgroundColor: palette.background }]} />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Text style={[styles.message, { color: palette.accent }]}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {previewUri ? (
        <View style={[styles.previewContainer, { backgroundColor: palette.surface }]}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.previewButton} onPress={handleRetake}>
              <Ionicons name="refresh-circle-outline" size={48} color={palette.accent} />
              <Text style={[styles.iconLabel, { color: palette.accent }]}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.previewButton} onPress={handleUsePhoto}>
              <Ionicons name="checkmark-circle-outline" size={48} color={palette.accent} />
              <Text style={[styles.iconLabel, { color: palette.accent }]}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.cameraContainer, { backgroundColor: palette.surface }]}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.bottomControls}>
              <View style={styles.control}>
                <Text style={[styles.controlLabel, { color: palette.text }]}>Gallery</Text>
                <TouchableOpacity style={styles.iconButton} onPress={pickImageFromGallery}>
                  <Ionicons name="image-outline" size={32} color={palette.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.control}>
                <Text style={[styles.controlLabel, { color: palette.text }]}>Flip</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back'))}
                >
                  <Ionicons name="camera-reverse-outline" size={35} color={palette.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.control}>
                <Text style={[styles.controlLabel, { color: palette.text }]}>Capture</Text>
                <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={35} color={palette.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      )}
    </View>
  );
}

/**
 * Palette helper — centralizes colors for dark and light
 */
const getPalette = (dark: boolean) => ({
  background: dark ? '#07070a' : '#ffffff',
  surface: dark ? '#0f1016' : '#ffffff',
  accent: dark ? '#6f6cff' : '#2a1faa',
  text: dark ? '#e6e6e6' : '#000000',
  muted: dark ? '#b9b9ff' : '#555555',
});

/**
 * Static layout styles (theme values set at runtime)
 */
const getCameraStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    message: {
      textAlign: 'center',
      paddingBottom: 10,
      fontSize: 16,
    },
    cameraContainer: {
      flex: 1,
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    bottomControls: {
      position: 'absolute',
      bottom: 80,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'flex-end',
      paddingHorizontal: 20,
    },
    control: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 80,
    },
    controlLabel: {
      fontSize: 14,
      marginBottom: 6,
      textAlign: 'center',
      fontWeight: '600',
    },
    iconButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 40,
    },
    button: {
      flex: 1,
      alignSelf: 'flex-end',
      alignItems: 'center',
    },
    iconLabel: {
      fontSize: 14,
      marginTop: 4,
    },
    previewImage: {
      width: '100%',
      height: '80%',
      resizeMode: 'contain',
    },
    previewButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingVertical: 20,
    },
    previewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export { getCameraStyles };

