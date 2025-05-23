import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import Button from "../../components/CameraButton";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../context/AuthContext";
import { AUTH_KEY, API_URL_AI, API_URL_BCNKEND } from "@env";

const API_URL = API_URL_BCNKEND;
const API_URL_PREDICT = API_URL_AI;

export default function App() {
  // Permissions hooks
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermissionResponse, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();
  const [imagePickerPermission, requestImagePickerPermission] =
    ImagePicker.useMediaLibraryPermissions();
  const { user } = useAuth();

  const [image, setImage] = useState(null);
  const [previousImage, setPreviousImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  // Camera and image state
  const [cameraProps, setCameraProps] = useState({
    zoom: 0,
    facing: "back",
    flash: "on",
    animateShutter: false,
    enableTorch: false,
  });

  // Camera reference
  const cameraRef = useRef(null);

  // Check and load last saved image on component mount
  useEffect(() => {
    if (
      cameraPermission?.granted &&
      mediaLibraryPermissionResponse?.status === "granted"
    ) {
      getLastSavedImage();
    }
  }, [cameraPermission, mediaLibraryPermissionResponse]);

  // Send image to prediction API
  const sendImageToAPI = async (imageUri) => {
    try {
      setIsProcessing(true);

      if (!imageUri) {
        throw new Error("Invalid image URI");
      }

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "image.jpg",
      });

      const response = await fetch(`${API_URL_PREDICT}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();

      // Handle non-rice leaf case
      if (!data.is_rice_leaf) {
        Alert.alert(
          "Not a Rice Leaf",
          "The image does not appear to contain a rice leaf. Please ensure you are taking a clear photo of a rice leaf with good lighting.",
          [
            {
              text: "Return Home",
              onPress: () => {
                setImage(null);
                setPredictions(null);
                router.push("/home");
              },
              style: "cancel",
            },
            {
              text: "Try Again",
              onPress: () => {
                setImage(null);
                setPredictions(null);
              },
              style: "default",
            },
          ]
        );
        return null;
      }

      // catch error sa response if naa
      if (!response.ok) {
        if (data.error) {
          throw new Error(data.error);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Ensure predictions array exists
      if (!data.predictions || !Array.isArray(data.predictions)) {
        throw new Error("Invalid response format: predictions array missing");
      }

      // array predictions
      setPredictions(data.predictions);
      return data.predictions;
    } catch (error) {
      console.error("Error sending image to API:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to process image. Please try again."
      );
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // upload image to google storage
  const uploadImageToCloud = async (imageUri) => {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "photo.jpg",
    });

    try {
      const response = await fetch(`${API_URL}/scan/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": AUTH_KEY,
        },
        body: formData,
      });
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  };

  // Take picture from camera
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const picture = await cameraRef.current.takePictureAsync();
        setImage(picture.uri);
        // Automatically send to API when picture is taken
      } catch (err) {
        console.log("Error while taking/processing the picture:", err);
        Alert.alert("Error", "Failed to process image");
      }
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      // Request permission if not already granted
      if (!imagePickerPermission?.granted) {
        const permissionResult = await requestImagePickerPermission();
        if (!permissionResult.granted) {
          Alert.alert(
            "Permission Required",
            "Gallery access is needed to select images."
          );
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  // Save Prediction to database
  async function savePredictionToDB(predictionsResult, uploadImage) {
    try {
      // Calculate confidence score if below 40, set to 4 else set to the prediction
      const confidenceScore = predictionsResult[0].confidence * 100;
      const diseasePrediction =
        confidenceScore < 40 && confidenceScore > 0
          ? 4
          : predictionsResult[0].class_number;

      const response = await fetch(`${API_URL}/scan/save`, {
        method: "POST",
        headers: {
          "X-API-Key": AUTH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_profile_id: user.id,
          disease_prediction: diseasePrediction,
          disease_prediction_score: predictionsResult[0].confidence,
          scan_image: uploadImage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Data saved to the database successfully");
      } else {
        console.error(
          "Error saving data to the database:",
          response.status,
          data
        );
        Alert.alert(
          "Error",
          data.message || "Failed to save data to the database"
        );
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  }

  // Get disease Information
  const getDiseaseInfo = async (classNumber) => {
    try {
      const response = await fetch(
        `${API_URL}/scan/disease-info/${classNumber}`,
        {
          headers: {
            "X-API-Key": AUTH_KEY,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Disease information not found");
        }
        throw new Error("Failed to fetch disease information");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching disease info:", error);
      throw error;
    }
  };

  // send notifications to admin if tungro
  const sendTungroNotificationToAdmins = async (imageUrl, disease) => {
    try {
      // Fetch all admin users with push tokens
      const response = await fetch(`${API_URL}/notifications/fetch-admin`, {
        method: "GET",
        headers: {
          "X-API-Key": AUTH_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin users: ${response.status}`);
      }

      const adminUsers = await response.json();

      if (!adminUsers || adminUsers.length === 0) {
        console.log("No admin users found with push tokens");
        return;
      }

      const currentDate = new Date().toLocaleString();

      // SEND TO ADMIN
      // For each admin, store notification and send push notification
      for (const admin of adminUsers) {
        // 1. Store notification in database
        await fetch(`${API_URL}/notifications/store-notification`, {
          method: "POST",
          headers: {
            "X-API-Key": AUTH_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: admin.userId,
            title: "Urgent: Possible Tungro Disease Detected",
            body: `Farmer ${user.username} (${user.email}) has detected a ${disease} in their field on ${currentDate}. Immediate attention required.`,
            icon: "warning",
            icon_bg_color: "red",
            type: "alert",
            data: {
              imageUrl: imageUrl,
              disease: disease,
              detectedAt: currentDate,
              scanBy: user.id,
            },
          }),
        });

        // 2. Send push notification
        await fetch(`${API_URL}/push-notify/notify`, {
          method: "POST",
          headers: {
            "X-API-Key": AUTH_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: admin.userId,
            title: "Urgent: Possible Tungro Disease Detected",
            body: `A farmer has detected ${disease} in their field. Immediate attention required.`,
            data: {
              type: "disease_alert",
              imageUrl: imageUrl,
              disease: disease,
              detectedAt: currentDate,
              scanBy: user.id,
            },
          }),
        });
      }

      // SEND TO USERS
       // 1. Store notification in database
       await fetch(`${API_URL}/notifications/store-notification-all`, {
        method: "POST",
        headers: {
          "X-API-Key": AUTH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Urgent: Possible Tungro Disease Detected",
          body: `Farmer ${user.username} (${user.email}) has detected a ${disease} in their field on ${currentDate}. Immediate attention required.`,
          icon: "warning",
          icon_bg_color: "red",
          type: "alert",
          data: {
            imageUrl: imageUrl,
            disease: disease,
            detectedAt: currentDate,
            scanBy: user.id,
          },
        }),
      });

      // 2. Send push notification
      await fetch(`${API_URL}/push-notify/broadcast`, {
        method: "POST",
        headers: {
          "X-API-Key": AUTH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Urgent: Possible Tungro Disease Detected",
          body: `A farmer has detected ${disease} in their field. Immediate attention required.`,
          data: {
            type: "Disease Alert",
            imageUrl: imageUrl,
            disease: disease,
            detectedAt: currentDate,
            scanBy: user.id,
          },
        }),
      });

      console.log(`Tungro notification sent to ${adminUsers.length} admins`);
    } catch (error) {
      console.error("Error sending Tungro notifications:", error);
    }
  };

  // Save Picture
  const savePicture = async () => {
    if (image) {
      try {
        // Send image for prediction
        const predictionsResult = await sendImageToAPI(image);

        // not a rice leaf if null
        if (predictionsResult === null) {
          return;
        }

        // Send image to cloud storage
        const uploadImage = await uploadImageToCloud(image);

        // Get Disease Info
        const result = await getDiseaseInfo(predictionsResult[0].class_number);

        // Check confidence threshold
        const confidenceScore = predictionsResult[0].confidence * 100;
        let diseaseName;
        if (confidenceScore < 40 && confidenceScore > 0) {
          diseaseName = `Possible Disease`;
        } else {
          diseaseName = result.rice_leaf_disease;
        }

        // Send prediction to database
        savePredictionToDB(predictionsResult, uploadImage);

        // Check if the disease is Tungro and send notification to admin
        if (result.rice_leaf_disease === "Possible Tungro") {
          await sendTungroNotificationToAdmins(
            uploadImage,
            result.rice_leaf_disease
          );
        }

        // Navigate to result screen with the data
        router.push({
          pathname: "/result",
          params: {
            imageUri: uploadImage,
            disease: diseaseName,
            confidence: `${confidenceScore.toFixed(2)}%`,
            date: new Date().toLocaleDateString(),
            description: result.disease_description,
            treatments: JSON.stringify(result.treatments),
            medicines: JSON.stringify(result.medicines),
          },
        });
      } catch (err) {
        console.log("Error details:", err.message, err.stack);
        Alert.alert("Error", `Upload failed: ${err.message}`);
      }
    }
  };

  // Retrieve last saved image from gallery
  const getLastSavedImage = async () => {
    if (
      mediaLibraryPermissionResponse &&
      mediaLibraryPermissionResponse.status === "granted"
    ) {
      const dcimAlbum = await MediaLibrary.getAlbumAsync("DCIM");

      if (dcimAlbum) {
        const { assets } = await MediaLibrary.getAssetsAsync({
          album: dcimAlbum,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          mediaType: MediaLibrary.MediaType.photo,
          first: 1,
        });

        if (assets.length > 0) {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(assets[0].id);
          setPreviousImage(assetInfo.localUri || assetInfo.uri);
        } else {
          setPreviousImage(null);
        }
      } else {
        setPreviousImage(null);
      }
    }
  };

  // Toggle camera properties
  const toggleProperty = (prop, option1, option2) => {
    setCameraProps((current) => ({
      ...current,
      [prop]: current[prop] === option1 ? option2 : option1,
    }));
  };

  // Zoom controls
  const zoomIn = () => {
    setCameraProps((current) => ({
      ...current,
      zoom: Math.min(current.zoom + 0.1, 1),
    }));
  };
  const zoomOut = () => {
    setCameraProps((current) => ({
      ...current,
      zoom: Math.max(current.zoom - 0.1, 0),
    }));
  };

  // Permission check
  if (!cameraPermission || !mediaLibraryPermissionResponse) {
    return <View />;
  }

  // Permission request screen
  if (
    !cameraPermission.granted ||
    mediaLibraryPermissionResponse.status !== "granted"
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.grantContainer}>
          <Text>We need camera and gallery permissions to continue.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              requestCameraPermission();
              requestMediaLibraryPermission();
            }}
          >
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!image ? (
        <>
          {/* Top Camera Controls */}
          <View style={styles.topControlsContainer}>
            <Button icon="arrow-back" onPress={() => router.push("/home")} />
            <Button
              icon={cameraProps.flash === "on" ? "flash-on" : "flash-off"}
              onPress={() => toggleProperty("flash", "on", "off")}
            />
            <Button
              icon="animation"
              color={cameraProps.animateShutter ? "white" : "#404040"}
              onPress={() => toggleProperty("animateShutter", true, false)}
            />
            <Button
              icon={
                cameraProps.enableTorch ? "flashlight-on" : "flashlight-off"
              }
              onPress={() => toggleProperty("enableTorch", true, false)}
            />
          </View>

          {/* Camera View */}
          <CameraView
            style={styles.camera}
            zoom={cameraProps.zoom}
            facing={cameraProps.facing}
            flash={cameraProps.flash}
            animateShutter={cameraProps.animateShutter}
            enableTorch={cameraProps.enableTorch}
            ref={cameraRef}
          />

          {/* Zoom Slider */}
          <View style={styles.sliderContainer}>
            <Button icon="zoom-out" onPress={zoomOut} />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={cameraProps.zoom}
              onValueChange={(value) =>
                setCameraProps((current) => ({ ...current, zoom: value }))
              }
              step={0.1}
            />
            <Button icon="zoom-in" onPress={zoomIn} />
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControlsContainer}>
            <Button
              icon="photo-library"
              onPress={pickImageFromGallery}
              size={40}
            />
            <Button
              testID="capture"
              icon="camera"
              size={60}
              style={{ height: 60 }}
              onPress={takePicture}
            />
            <Button
              icon="flip-camera-ios"
              onPress={() => toggleProperty("facing", "front", "back")}
              size={40}
            />
          </View>
        </>
      ) : (
        <>
          {/* Image Preview */}
          <Image source={{ uri: image }} style={styles.camera} />

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.processingText}>Processing Image...</Text>
            </View>
          )}

          {/* Image Preview Controls */}
          <View style={styles.bottomControlsContainer}>
            <Button icon="arrow-back" onPress={() => router.push("camera")} />
            <Button
              icon="photo-library"
              onPress={() => {
                setImage(null);
                setPredictions(null);
                pickImageFromGallery();
              }}
            />
            <Button
              testID="check"
              icon="check"
              onPress={async () => {
                try {
                  await savePicture();
                } catch (error) {
                  console.error("Error saving picture:", error);
                }
              }}
            />
          </View>
        </>
      )}
      <StatusBar style="light" />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  grantContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topControlsContainer: {
    height: 100,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 40,
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderContainer: {
    position: "absolute",
    bottom: 270,
    left: 20,
    right: 20,
    flexDirection: "row",
  },
  bottomControlsContainer: {
    height: 250,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  previousImage: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 16,
  },
  predictionsContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 5,
  },
  predictionsText: {
    color: "#ffffff",
    fontSize: 14,
  },
});
