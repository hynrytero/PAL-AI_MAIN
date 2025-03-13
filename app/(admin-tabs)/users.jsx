import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Avatar, Card, IconButton } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import { images } from "../../constants";
import { router } from "expo-router";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigation = useNavigation();

  const handleSearchChange = (text) => {
    setSearchTerm(text);
  };

  // const handleCardPress = (userName) => {
  //   console.log(`Card pressed for user: ${userName}`);
  //   navigation.navigate('ViewUser', { userName });
  // };

  return (
    <ImageBackground
      source={images.background_history}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView className="mt-12">
        <SafeAreaView className="px-7 w-full h-full mb-10">
          <View className="flex-row items-center w-full mb-3">
            <Text className="font-pmedium text-[30px]">Users</Text>
          </View>
          <TextInput
            placeholder="Search users..."
            value={searchTerm}
            onChangeText={handleSearchChange}
            className="border border-gray-300 rounded p-2 mb-4"
          />
          <TouchableOpacity onPress={() => router.push("viewuser")}>
            <Card.Title
              title="Angelo"
              left={(props) => (
                <Avatar.Image
                  {...props}
                  // source={require("assets/images/angelo.jpg")}
                />
              )}
              right={(props) => (
                <IconButton {...props} icon="dots-vertical" onPress={() => {}} />
              )}
            />
          </TouchableOpacity>
            <Card.Title
              title="User 2"
              left={(props) => (
                <Avatar.Image
                  {...props}
                  // source={require("assets/images/angelo.jpg")}
                />
              )}
              right={(props) => (
                <IconButton {...props} icon="dots-vertical" onPress={() => {}} />
              )}
            />
            <Card.Title
              title="User 3"
              left={(props) => (
                <Avatar.Image
                  {...props}
                  // source={require("assets/images/angelo.jpg")}
                />
              )}
              right={(props) => (
                <IconButton {...props} icon="dots-vertical" onPress={() => {}} />
              )}
            />
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

export default Users;