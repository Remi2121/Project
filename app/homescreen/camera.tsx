//camera.tsx
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-image-picker';


export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const router = useRouter();

  const GC_API_KEY = 'AIzaSyBv6KZSIw8fmWblJ2IbotzwGP0atovp70c'; // Replace with your actual API key
  const GC_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GC_API_KEY}`;

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setPreviewUri(photo.uri);
      setBase64Image(photo.base64 || null);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const picked = result.assets[0];
      setPreviewUri(picked.uri);
      setBase64Image(picked.base64 || null);
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
        requests: [{
          image: {
            content: base64Image
          },
          features: [{
            type: 'FACE_DETECTION',
            maxResults: 10
          }]
        }]
      };

      const response = await fetch(GC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Google Vision Response:', data);

      if (data.error) {
        console.error('Google Vision API Error:', data.error);
        alert(`API Error: ${data.error.message || 'Unknown error'}`);
        return;
      }

      if (!data.responses || data.responses.length === 0 || !data.responses[0].faceAnnotations) {
        alert('No face detected.');
        return;
      }

      const face = data.responses[0].faceAnnotations[0];
      const mood = getDominantMood(face)
      const confidence = face.detectionConfidence; // optional: confidence value (0 to 1)

      router.push({
        pathname: '/cameraResult' as any,
        params: {
          mood,
          confidence: (confidence * 100).toFixed(1) + '%', // Convert to percentage
          imageUri: previewUri,
        }
      });
    } catch (error) {
      console.error("Error using Google Vision API:", error);
      alert("Something went wrong. Please try again.");
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

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <LinearGradient colors={['#0d0b2f', '#2a1faa']} style={styles.container}>
      {previewUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>

            <TouchableOpacity style={styles.button} onPress={handleRetake}>
              <Ionicons name="refresh-circle-outline" size={48} color="white" />
              <Text style={styles.iconLabel}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleUsePhoto}>
              <Ionicons name="checkmark-circle-outline" size={48} color="white" />
              <Text style={styles.iconLabel} >Use Photo</Text>
            </TouchableOpacity>

          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.bottomControls}>
             
              <TouchableOpacity style={styles.iconButton} onPress={pickImageFromGallery}>
                <Ionicons name="image-outline" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back')) }>
                <Ionicons name="camera-reverse-outline" size={35} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={35} color="#fff" />
              </TouchableOpacity>



            </View>
          </CameraView>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  iconButton: {
    alignItems: 'center',
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
  iconLabel: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },

});
