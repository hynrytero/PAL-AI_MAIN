import {
  SafeAreaView,
  View,
  ScrollView,
  ImageBackground,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { TextInput, Menu } from "react-native-paper";
import React, { useState, useEffect } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import images from "../../constants/images";
import CustomButton from "../../components/CustomButton";
import { useAuth } from "../../context/AuthContext";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const API_URL = API_URL_BCNKEND;

const RecommendTreatments = () => {
  const { user } = useAuth();
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDescription, setSuggestionDescription] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [imageUri, setImageUri] = useState(null);
  const [imageMenuVisible, setImageMenuVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const suggestionTypes = [
    { id: 'general', label: 'General' },
    { id: 'treatment', label: 'Treatment' },
    { id: 'medicine', label: 'Medicine' },
    { id: 'disease', label: 'Disease' },
  ];

  // Image picker function for gallery
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

  // Camera capture function
  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Upload image to cloud storage
  const uploadImageToCloud = async (imageUri) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg'
    });

    try {
      const response = await fetch(`${API_URL}/admin/notif/upload`, {
        method: 'POST',
        headers: {
          'X-API-Key': AUTH_KEY,
          'Accept': 'application/json',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Upload failed with status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.imageUrl) {
        console.error('Invalid response format:', data);
        throw new Error('No image URL received from server. Response format: ' + JSON.stringify(data));
      }

      return data.imageUrl;
    } catch (error) {
      console.error('Upload failed with details:', {
        error: error.message,
        stack: error.stack,
        imageUri: imageUri,
        formData: formData
      });
      throw error;
    }
  };

  // send suggestion to admin
  const sendSuggestionNotificationToAdmins = async () => {
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImageToCloud(imageUri);
      }

      // Fetch all admin users with push tokens
      const response = await fetch(`${API_URL}/notifications/fetch-admin`, {
        method: 'GET',
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin users: ${response.status}`);
      }

      const adminUsers = await response.json();

      if (!adminUsers || adminUsers.length === 0) {
        console.log('No admin users found with push tokens');
        return;
      }

      const currentDate = new Date().toLocaleString();

      // For each admin, store notification and send push notification
      for (const admin of adminUsers) {
        //Store notification in database
        await fetch(`${API_URL}/notifications/store-notification`, {
          method: 'POST',
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: admin.userId,
            title: `${suggestionTypes.find(type => type.id === selectedType)?.label || 'General'} Suggestion: From Farmer ${user.username} (${user.email})`,
            body: `Description: ${suggestionDescription}`,
            icon: 'warning',
            icon_bg_color: 'green',
            type: 'suggestion',
            data: {
              imageUrl: imageUrl,
              suggestionType: selectedType,
              timestamp: currentDate
            }
          })
        });

        // Send push notification
        await fetch(`${API_URL}/push-notify/notify`, {
          method: 'POST',
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: admin.userId,
            title: `${suggestionTypes.find(type => type.id === selectedType)?.label || 'General'} Suggestion: From Farmer ${user.username} (${user.email})`,
            body: `Description: ${suggestionDescription}`,
            data: {
              imageUrl: imageUrl,
              suggestionType: selectedType
            }
          })
        });
      }

      console.log(`Suggestion notification sent to ${adminUsers.length} admins`);
    } catch (error) {
      console.error('Error sending suggestion notifications:', error);
      throw error;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSendSuggestion = async () => {
    if (!suggestionTitle.trim() || !suggestionDescription.trim()) {
      alert('Please fill in both title and description');
      return;
    }
    
    try {
      await sendSuggestionNotificationToAdmins();
      alert('Suggestion sent successfully!');
      setSuggestionTitle('');
      setSuggestionDescription('');
      setSelectedType('general');
      setImageUri(null);
    } catch (error) {
      alert('Failed to send suggestion. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={images.background_history}
      className="flex-1 h-full"
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1 pt-8">
        <ScrollView
          className="flex-1 p-5"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 50,
            justifyContent: "space-between",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View className="flex-row items-center w-full mb-4">
              <Icon
                name="chevron-left"
                size={32}
                color="#006400"
                onPress={handleBack}
              />
              <Text className="font-psemibold text-[28px] ml-2 text-[#2D3648]">
                Suggestions
              </Text>
            </View>

            <View className="space-y-6">
              <View className="flex-column items-start w-full">
                <Text className="font-psemibold text-[16px] mb-2">
                  Suggestion Type
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-1.5"
                >
                  {suggestionTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setSelectedType(type.id)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        selectedType === type.id
                          ? 'bg-[#006400] border-[#006400]'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-pmedium text-sm ${
                          selectedType === type.id ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-column items-start w-full">
                <Text className="font-psemibold text-[16px] mb-2">
                  Suggestion Name
                </Text>
                <TextInput
                  className="w-full"
                  mode="outlined"
                  placeholder="Title of the suggestion"
                  activeOutlineColor="#006400"
                  outlineColor="grey"
                  textColor="#2D3648"
                  value={suggestionTitle}
                  onChangeText={setSuggestionTitle}
                />
              </View>

              <View className="flex-column items-start w-full">
                <Text className="font-psemibold text-[16px] mb-2">
                  Description
                </Text>
                <TextInput
                  className="w-full h-[280px]"
                  mode="outlined"
                  placeholder="Describe your suggestion"
                  activeOutlineColor="#006400"
                  outlineColor="grey"
                  textColor="#2D3648"
                  multiline={true}
                  textAlignVertical="top"
                  value={suggestionDescription}
                  onChangeText={setSuggestionDescription}
                />
              </View>

              {/* Image Picker Section */}
              <View className="flex-column items-start w-full">
                <Text className="font-psemibold text-[16px] mb-2">
                  Add Image (Optional)
                </Text>
                <Menu
                  visible={imageMenuVisible}
                  onDismiss={() => setImageMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={() => setImageMenuVisible(true)}
                      className="flex-row items-center border border-gray-300 p-2 rounded-lg w-full"
                    >
                      <View className="flex-row items-center">
                        <Icon name="add-photo-alternate" size={24} color="#666" />
                        <Text className="ml-2 text-gray-600">
                          {imageUri ? "Change Image" : "Select an Image"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    title="Take Photo"
                    leadingIcon="camera"
                    onPress={() => {
                      setImageMenuVisible(false);
                      takePhoto();
                    }}
                  />
                  <Menu.Item
                    title="Choose from Gallery"
                    leadingIcon="image-multiple"
                    onPress={() => {
                      setImageMenuVisible(false);
                      pickImage();
                    }}
                  />
                  {imageUri && (
                    <Menu.Item
                      title="Remove Image"
                      leadingIcon="delete"
                      onPress={() => {
                        setImageMenuVisible(false);
                        setImageUri(null);
                      }}
                    />
                  )}
                </Menu>

                {imageUri && (
                  <View className="mt-2 w-full">
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: 200, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </View>

            <View className="mt-8">
              <CustomButton
                title="Send"
                color="#006400"
                containerStyles="w-full"
                handlePress={handleSendSuggestion}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default RecommendTreatments;
