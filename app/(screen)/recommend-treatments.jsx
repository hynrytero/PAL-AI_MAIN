import {
  SafeAreaView,
  View,
  ScrollView,
  ImageBackground,
  Text,
} from "react-native";
import { TextInput } from "react-native-paper";
import React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  Link,
  Redirect,
  router,
  Router,
  useLocalSearchParams,
} from "expo-router";

import images from "../../constants/images";
import CustomButton from "../../components/CustomButton";
import CustomButtonOutline from "../../components/CustomButtonOutline";

const RecommendTreatments = () => {
  const handleBack = () => {
    router.back();
  };
  return (
    <ImageBackground
      source={images.background_result}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
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
            <View className="flex-row items-center w-full mb-7">
              <Text className="font-psemibold text-[25px]">
                Recommend Treatment
              </Text>
            </View>
            <View className="flex-column items-start w-full mb-2">
              <Text className="font-psemibold text-[16px]">Treatment Name</Text>
              <TextInput
                className="w-full mt-3"
                mode="outlined"
                placeholder="e.g. Imidiacloprid"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
              />
            </View>
            <View className="flex-column items-start w-full mb-2">
              <Text className="font-psemibold text-[16px]">Description</Text>
              <TextInput
                className="w-full mt-3 h-[200px]"
                mode="outlined"
                placeholder="Description of the treatment"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
            <View className="flex-column items-start w-full mb-2">
              <Text className="font-psemibold text-[16px]">Instruction</Text>
              <TextInput
                className="w-full mt-3 h-[200px]"
                mode="outlined"
                placeholder="Instruction on how to use the treatment"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
          </View>
          <View className="flex-row justify-between w-full mt-5">
            <CustomButtonOutline
              title="Cancel"
              color="#FF0000"
              handlePress={handleBack}
              containerStyles="w-[48%] mt-6"
            />
            <CustomButton
              title="Recommend"
              color="#006400"
              containerStyles="w-[48%] mt-6"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default RecommendTreatments;
