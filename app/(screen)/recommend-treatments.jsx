import {
  SafeAreaView,
  View,
  ScrollView,
  ImageBackground,
  Text,
} from "react-native";
import { TextInput } from "react-native-paper";
import React, { useState } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import images from "../../constants/images";
import CustomButton from "../../components/CustomButton";
import { useAuth } from "../../context/AuthContext";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const API_URL = API_URL_BCNKEND;

const RecommendTreatments = () => {
  const { user } = useAuth();
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDescription, setSuggestionDescription] = useState('');

  // send suggestion to admin
  const sendSuggestionNotificationToAdmins = async () => {
    try {
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
            title: `Suggestion: From Farmer ${user.username} (${user.email})`,
            body: `Description: ${suggestionDescription}`,
            icon: 'warning',
            icon_bg_color: 'green',
            type: 'suggestion'
          })
        });

        // 2. Send push notification
        await fetch(`${API_URL}/push-notify/notify`, {
          method: 'POST',
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: admin.userId,
            title: `Suggestion: From Farmer ${user.username} (${user.email})`,
            body: `Description: ${suggestionDescription}`
          })
        });
      }

      console.log(`Suggestion notification sent to ${adminUsers.length} admins`);
    } catch (error) {
      console.error('Error sending suggestion notifications:', error);
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
            <View className="flex-row items-center w-full mb-8">
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
                <Text className="font-psemibold text-[16px] mb-2 ">
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
