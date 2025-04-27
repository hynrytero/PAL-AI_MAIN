import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl
} from "react-native";
import { SafeAreaView, ImageBackground } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";
import images from "../../constants/images";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const TreatmentDetailScreen = () => {
  const { treatmentId, treatment } = useLocalSearchParams();
  const [treatmentDetails, setTreatmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  // Edit form state
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // Disease color mapping
  const getDiseaseColor = (diseaseName) => {
    const colorMap = {
      "Tungro": "#000064",
      "Rice Blast": "#E80D0D",
      "Leaf Blight": "#228B22"
    };
    return colorMap[diseaseName] || "#000000";
  };

  // Treatment image mapping
  const getTreatmentImage = (treatment) => {
    if (treatment.image) {
      const imageUrl = treatment.image.replace(/^data:image\/jpeg;base64,/, '');
      return { uri: imageUrl };
    }
    return images.medicine;
  };

  // Fetch treatment details
  const fetchTreatmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL_BCNKEND}/admin/treatments/fetch/${treatmentId}`, {
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response?.data?.success && response.data.data) {
        const details = response.data.data;
        setTreatmentDetails(details);

        // Initialize edit form with current values
        setEditedName(details.name || '');
        setEditedDescription(details.description || '');
        setImageUri(null); // Reset image URI
      } else {
        throw new Error("Invalid treatment data format");
      }
    } catch (err) {
      console.error("Error fetching treatment details:", err);
      setError("Failed to load treatment details. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchTreatmentDetails();
  }, [treatmentId]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTreatmentDetails();
  }, [treatmentId]);

  // Image picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Handle back navigation with edit mode check
  const handleBackNavigation = () => {
    if (isEditing) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to go back? Unsaved changes will be lost.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setIsEditing(false);
              // Reset edit state to original values
              setEditedName(treatmentDetails.name || '');
              setEditedDescription(treatmentDetails.description || '');
              setImageUri(null);
            }
          }
        ]
      );
    } else {
      if (isEdited) {
        setIsEdited(false);
        router.push({
          pathname: "/treatment",
          params: { shouldRefresh: 'true' }
        });
      }
      else 
      { 
        router.back();
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this treatment?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.delete(
                `${API_URL_BCNKEND}/admin/disease/delete/${treatmentDetails.medicine_id}`,
                {
                  headers: {
                    'X-API-Key': AUTH_KEY,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (response.data.success) {
                Alert.alert('Success', 'Treatment deleted successfully');
                router.push({
                  pathname: "/treatment",
                  params: { shouldRefresh: 'true' }
                });
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete treatment');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Treatment name is required');
      return;
    }
  
    try {
      setLoading(true);
      const formData = new FormData();
  
      // Add text fields
      formData.append('rice_plant_medicine', editedName);
      formData.append('description', editedDescription);
  
      if (imageUri) {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'medicine-image.jpg'
        });
      }
  
      const response = await axios.put(
        `${API_URL_BCNKEND}/admin/disease/edit/${treatmentDetails.medicine_id}`,
        formData,
        {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
  
      if (response.data.success) {
        await fetchTreatmentDetails();
        setIsEditing(false);
        setIsEdited(true);
      }
  
    } catch (error) {
      console.error('Update error:', error.response ? error.response.data : error);
      Alert.alert('Error', 'Failed to update treatment');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <ImageBackground
        source={images.background_profile}
        className="flex-1 h-full w-full bg-white"
      >
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 font-pmedium">Loading treatment details...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // Render error state
  if (error) {
    return (
      <ImageBackground
        source={images.background_profile}
        className="flex-1 h-full w-full bg-white"
      >
        <SafeAreaView className="flex-1 justify-center items-center px-4">
          <FontAwesome name="exclamation-circle" size={50} color="red" />
          <Text className="mt-2 font-pmedium text-center">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-pmedium">Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // Render content
  return (
    <ImageBackground
      source={images.background_profile}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView
        className="mt-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0000ff']} // Android
            tintColor="#0000ff" // iOS
          />
        }
      >
        <SafeAreaView className="px-7 w-full h-full mb-10 flex-col" style={{ rowGap: 10 }}>
          {/* Header with navigation and edit/save buttons */}
          <View className="flex-row items-center justify-between w-full">
            <TouchableOpacity onPress={handleBackNavigation} className="p-2">
              <FontAwesome name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text className="font-pmedium text-[24px] flex-1 text-left">
              {isEditing ? 'Edit Treatment' : 'Treatment Details'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isEditing) {
                  handleUpdate();
                } else {
                  setIsEditing(true);
                }
              }}
              className="p-2 ml-auto"
            >
              <FontAwesome
                name={isEditing ? "save" : "edit"}
                size={20}
                color="black"
              />
            </TouchableOpacity>
          </View>

          {/* Treatment Details/Edit Form */}
          {treatmentDetails && (
            <View className="mb-5 bg-blue-100 rounded-xl p-4 shadow-sm">
              {/* Image Section */}
              <View className="flex-row items-start mb-4">
                {isEditing ? (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="mr-4"
                  >
                    <Image
                      source={imageUri ? { uri: imageUri } : getTreatmentImage(treatmentDetails)}
                      style={{ width: 80, height: 80, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                    <View className="absolute bottom-0 right-0 items-center justify-center rounded-10 p-1">
                      <FontAwesome name="camera" size={18} color="white" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Image
                    source={getTreatmentImage(treatmentDetails)}
                    style={{ width: 80, height: 80, borderRadius: 10 }}
                    resizeMode="cover"
                    className="mr-4"
                  />
                )}
                <View className="flex-1">
                  {isEditing ? (
                    <TextInput
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Treatment Name"
                      className="font-pbold text-[17px] mb-1 border-b border-gray-500"
                    />
                  ) : (
                    <Text className="font-pbold text-[20px] ">
                      {treatmentDetails.name || treatment}
                    </Text>
                  )}
                  <Text className="text-gray-500 text-sm">
                    Medicine
                  </Text>
                </View>
              </View>

              {/* Description Section */}
              <View className="mb-4">
                <Text className="font-psemibold text-lg">Description</Text>
                {isEditing ? (
                  <TextInput
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Treatment Description"
                    multiline
                    numberOfLines={3}
                    className="font-pregular border border-gray-500 p-2 rounded-md"
                  />
                ) : (
                  <Text className="text-gray-700 font-pregular">
                    {treatmentDetails.description || "No description available."}
                  </Text>
                )}
              </View>

              {/* Delete Button (only when editing) */}
              {isEditing && (
                <TouchableOpacity
                  onPress={handleDelete}
                  className="bg-red-500 p-3 rounded-md mt-3"
                >
                  <Text className="text-white font-pmedium text-center">Delete Treatment</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Related Disease Section */}
          <View>
            <Text className="font-pmedium text-[18px] mb-2">Related Disease</Text>

            {treatmentDetails?.disease ? (
              <View style={{ rowGap: 10 }}>
                <View
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: getDiseaseColor(treatmentDetails.disease.name) + "20" }}
                >
                  <Text
                    className="font-psemibold text-lg mb-1"
                    style={{ color: getDiseaseColor(treatmentDetails.disease.name) }}
                  >
                    {treatmentDetails.disease.name}
                  </Text>
                  <Text className="text-gray-700 font-pregular">
                    {treatmentDetails.disease.description || "No description available."}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="py-5 items-center bg-gray-100 rounded-md">
                <Text className="text-gray-500">No related disease found</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

export default TreatmentDetailScreen;