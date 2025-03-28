import { View, Text, Image, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";

const Treatment = () => {
  const {
    imageUri = null,
    disease = "Unknown Disease",
    confidence = "0%",
    date = new Date().toLocaleDateString(),
    description = "No description available",
    treatments = '{"id": "", "name": "", "description": ""}',
    medicines = '{"id": "", "name": "", "description": "", "image": ""}',
    fromHistory = false,
  } = useLocalSearchParams();

  const parsedTreatment = JSON.parse(treatments);
  const parsedMedicine = JSON.parse(medicines);

  return (
    <ImageBackground
      source={images.background_treatment}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{}}
    >
      <View className="flex-1 h-full w-full pt-7">
        <SafeAreaView className="w-full h-full">
          <ScrollView className="px-7">
            {/* Back navigation */}
            <View className="flex-row items-center w-full mb-7">
              <Icon
                name="chevron-left"
                size={40}
                color="black"
                onPress={() => router.back()}
              />
              <Text className="font-pmedium text-[30px]">Treatments</Text>
            </View>

            {/* Dynamic Image */}
            <Image
              source={imageUri ? { uri: imageUri } : images.logo}
              resizeMode="cover"
              className="w-full h-[275px] mb-5 border bg-slate-400"
              borderRadius={10}
              onError={(e) => console.error("Image load error:", e.nativeEvent.error)}
              onLoad={() => console.log("Image loaded successfully")}
            />

            {/* Disease Name */}
            <View className="justify-center items-center mb-5">
              <Text className="font-pmedium text-[25px] text-center">
                {disease} Treatment
              </Text>
            </View>

            {/* Treatments Section */}
            <Text className="font-psemibold text-xl mb-3">Recommended Treatments</Text>
            {Array.isArray(parsedTreatment) ? (
              parsedTreatment.map((item, index) => (
                <View key={item.id || index} className="mb-5 p-4 bg-white/80 rounded-lg">
                  <Text className="font-pmedium text-lg mb-2">{item.name}</Text>
                  <Text className="font-pregular text-md leading-6">
                    {item.description}
                  </Text>
                </View>
              ))
            ) : (
              <View className="mb-5 p-4 bg-white/80 rounded-lg">
                <Text className="font-pmedium text-lg mb-2">{parsedTreatment.name}</Text>
                <Text className="font-pregular text-md leading-6">
                  {parsedTreatment.description}
                </Text>
              </View>
            )}

            {/* Medicines Section */}
            <Text className="font-psemibold text-xl mb-3">Recommended Medicines</Text>
            {Array.isArray(parsedMedicine) ? (
              parsedMedicine.map((item, index) => (
                <View key={item.id || index} className="mb-5 p-4 bg-white/80 rounded-lg">
                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-[100px] mb-3"
                      resizeMode="contain"
                    />
                  )}
                  <Text className="font-pmedium text-lg mb-2">{item.name}</Text>
                  <Text className="font-pregular text-md leading-6">
                    {item.description}
                  </Text>
                </View>
              ))
            ) : (
              <View className="mb-5 p-4 bg-white/80 rounded-lg">
                {parsedMedicine.image && (
                  <Image
                    source={{ uri: parsedMedicine.image }}
                    className="w-full h-[100px] mb-3"
                    resizeMode="contain"
                  />
                )}
                <Text className="font-pmedium text-lg mb-2">{parsedMedicine.name}</Text>
                <Text className="font-pregular text-md leading-6">
                  {parsedMedicine.description}
                </Text>
              </View>
            )}

            <CustomButton
              title="Store Nearby"
              handlePress={() => router.push("nearby")}
              containerStyles="w-full my-6"
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default Treatment;
