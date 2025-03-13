import React, { useState, useEffect } from "react";
import { TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import { router } from "expo-router";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Image,
} from "react-native";
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from "react-native-vector-icons/MaterialIcons";
import { images } from "../../constants";
import Feather from "react-native-vector-icons/Feather";
import { useAuth } from "../../context/AuthContext";

const API_URL = 'https://pal-ai-backend-87197497418.asia-southeast1.run.app';

const viewuser = () => {
   const { user } = useAuth();
   const [userData, setUserData] = useState({
      firstname: 'jane',
      lastname: 'doe',
      email: 'jane@gmail.com',
      contactNumber: '1234566782',
      birthdate: '',
      gender: 'Female',
      image: '',
    });
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [contactNumber, setContactNumber] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
 
  const fetchUserProfile = async () => {
    try {
      setError(null);
      
      const response = await axios.get(`${API_URL}/profile/fetch-profile/${user.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUserData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile data');
      }
    } catch (error) {
      setError(error.message || 'Failed to load profile data');
      Alert.alert(
        'Error',
        error.message,
        [{ text: 'OK', onPress: () => setError(null) }]
      );
    } 
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    setFirstName(userData.firstname);
    setLastName(userData.lastname);
    setContactNumber(userData.contactNumber);
    
    if (userData.birthdate) {
      setBirthDate(new Date(userData.birthdate));
    }
  }, [userData]);

  const handleBack = () => {
      router.back();
  };

  return (
    <ImageBackground
      source={images.background_profile}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView className="mt-10">
        <SafeAreaView className="px-6 w-full h-full mb-12">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Feather name="chevron-left" size={36} color="black" onPress={handleBack} />
          </View>

          {/* Profile Picture */}
          <View className="items-center mb-8">
            <Image
              source={
                userData.image
                  ? { uri: userData.image }
                  : images.Default_Profile
              }
              resizeMode="cover"
              className="w-[140px] h-[140px] rounded-full border-4 border-gray-300 shadow-md"
            />
            <Text className="text-2xl font-semibold text-gray-900 mt-4">
              {userData.firstname}
            </Text>
          </View>

          {/* About Section */}
          <View className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <Text className="text-xl font-semibold text-gray-800 mb-4">About</Text>

            {/* First and Last Name */}
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="text-base text-gray-700">First Name</Text>
                <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                  {firstName}
                </Text>
              </View>
              <View className="w-[48%]">
                <Text className="text-base text-gray-700">Last Name</Text>
                <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                  {lastName}
                </Text>
              </View>
            </View>

            {/* Birth Date */}
            <View className="mb-4">
              <Text className="text-base text-gray-700">Birth Date</Text>
              <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                {birthDate ? birthDate.toDateString() : ""}
              </Text>
            </View>

            {/* Contact Number */}
            <View className="mb-2">
              <Text className="text-base text-gray-700">Contact Number</Text>
              <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                {contactNumber}
              </Text>
            </View>

            {/* Email */}
            <View className="mb-2">
              <Text className="text-base text-gray-700">Email</Text>
              <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                {userData.email}
              </Text>
            </View>

            {/* Gender */}
            <View className="mb-2">
              <Text className="text-base text-gray-700">Gender</Text>
              <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                {userData.gender}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  profileImageContainer: {
    position: 'relative',
    width: 150,
    height: 150,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default viewuser;