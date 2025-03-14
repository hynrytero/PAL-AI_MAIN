import React, { useState, useEffect } from "react";
import { TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Image,
} from "react-native";
import { images } from "../../constants";
import Feather from "react-native-vector-icons/Feather";

const viewuser = () => {
  const params = useLocalSearchParams(); // Get URL parameters
  
  // Extract user data from params instead of fetching from the database
  const [userData, setUserData] = useState({
    firstname: params.firstname || '',
    lastname: params.lastname || '',
    email: params.email || '',
    mobile_number: params.mobile_number || '',
    birthdate: params.birthdate || '',
    gender: params.gender || '',
    profile_image: params.profile_image || '',
  });
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [contactNumber, setContactNumber] = useState("");
 
  useEffect(() => {
    setFirstName(userData.firstname);
    setLastName(userData.lastname);
    setContactNumber(userData.mobile_number);
    
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
          {/* Header with back button */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={handleBack}>
              <Feather name="chevron-left" size={36} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold ml-4">User Profile</Text>
          </View>

          {/* Profile Picture */}
          <View className="items-center mb-8">
            <Image
              source={
                userData.profile_image
                  ? { uri: userData.profile_image }
                  : images.Default_Profile
              }
              resizeMode="cover"
              className="w-[140px] h-[140px] rounded-full border-4 border-gray-300 shadow-md"
            />
            <Text className="text-2xl font-semibold text-gray-900 mt-4">
              {userData.firstname} {userData.lastname}
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
                {birthDate ? birthDate.toDateString() : "Not specified"}
              </Text>
            </View>

            {/* Contact Number */}
            <View className="mb-2">
              <Text className="text-base text-gray-700">Contact Number</Text>
              <Text className="border border-gray-400 rounded-md p-2 mt-2 text-base text-gray-800">
                {contactNumber || "Not provided"}
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
                {userData.gender || "Not specified"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

export default viewuser;