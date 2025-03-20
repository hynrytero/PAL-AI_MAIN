import {
  SafeAreaView,
  View,
  ScrollView,
  ImageBackground,
  Text,
} from "react-native";
import { TextInput } from "react-native-paper";
import React, { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";

import images from "../../constants/images";
import CustomButton from "../../components/CustomButton";
import CustomButtonOutline from "../../components/CustomButtonOutline";

const EditTreatments = () => {
  const { treatment, description, instructions } = useLocalSearchParams(); // Get parameters from URL

  // State to handle form inputs
  const [treatmentName, setTreatmentName] = useState(treatment || "");
  const [treatmentDescription, setTreatmentDescription] = useState(
    description || ""
  );
  const [treatmentInstructions, setTreatmentInstructions] = useState(
    instructions || ""
  );

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

            {/* Treatment Name Input */}
            <View className="flex-column items-start w-full mb-2">
              <Text className="font-psemibold text-[16px]">Treatment Name</Text>
              <TextInput
                className="w-full mt-3"
                mode="outlined"
                placeholder="e.g. Imidacloprid"
                value={treatmentName}
                onChangeText={setTreatmentName}
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
              />
            </View>

            {/* Description Input */}
            <View className="flex-column items-start w-full mb-2">
              <Text className="font-psemibold text-[16px]">Description</Text>
              <TextInput
                className="w-full mt-3 h-[200px]"
                mode="outlined"
                placeholder="Description of the treatment"
                value={treatmentDescription}
                onChangeText={setTreatmentDescription}
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                multiline={true}
                textAlignVertical="top"
              />
            </View>

            {/* Instructions Input */}
            <View className="flex-column items-start w-full mb-2">
              <Text className="font-psemibold text-[16px]">Instruction</Text>
              <TextInput
                className="w-full mt-3 h-[200px]"
                mode="outlined"
                placeholder="Instruction on how to use the treatment"
                value={treatmentInstructions}
                onChangeText={setTreatmentInstructions}
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                multiline={true}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
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
              onPress={() =>
                console.log("Updated Treatment:", {
                  treatmentName,
                  treatmentDescription,
                  treatmentInstructions,
                })
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default EditTreatments;
