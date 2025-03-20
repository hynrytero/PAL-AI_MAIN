// treatment-details.jsx in (admin-screen) folder
import {
  View,
  Text,
  Image,
  ScrollView,
  ImageBackground,
  SafeAreaView,
} from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import images from "../../constants/images";
import CustomButton from "../../components/CustomButton";
import Icon from "react-native-vector-icons/MaterialIcons";

const TreatmentDetailsScreen = ({ isReview = false, farmerName = "" }) => {
  const { treatment } = useLocalSearchParams();
  const router = useRouter();

  // Get the appropriate image based on treatment name
  const getTreatmentImage = (name) => {
    switch (name) {
      case "Imidacloprid":
        return images.treatment1;
      case "Thiamethoxam":
        return images.treatment2;
      case "Tricyclazole":
        return images.treatment3;
      case "Azoxystrobin":
        return images.treatment4;
      case "Mancozeb":
        return images.treatment5;
      case "Carbendazim":
        return images.treatment6;
      default:
        return images.treatment1;
    }
  };

  // Get color based on treatment name
  const getTreatmentColor = (name) => {
    if (["Imidacloprid", "Thiamethoxam"].includes(name)) return "#CCCCE0";
    if (["Tricyclazole", "Azoxystrobin"].includes(name)) return "#FACFCF";
    if (["Mancozeb", "Carbendazim"].includes(name)) return "#FFF6CC";
    return "#CCCCE0";
  };

  const handleApprove = () => {
    // Implement approve logic here
    console.log("Treatment approved");
    router.back();
  };

  const handleDeny = () => {
    // Implement deny logic here
    console.log("Treatment denied");
    router.back();
  };

  return (
    <ImageBackground
      source={images.background_result}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{ opacity: 0.5 }}
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
          {/* Back navigation */}
          <View className="flex-row items-center w-full mb-7">
            <Icon
              name="chevron-left"
              size={40}
              color="black"
              onPress={() => router.back()}
            />
            <Text className="font-pmedium text-[30px]">Treatment Detail</Text>
          </View>

          {/* Dynamic Image */}
          <Image
            source={images.logo} // Replace with your fallback image path
            resizeMode="cover"
            className="w-full h-[275px] mb-5 border bg-slate-400"
            borderRadius={10}
            onError={(e) =>
              console.error("Image load error:", e.nativeEvent.error)
            }
            onLoad={() => console.log("Image loaded successfully")}
          />

          {/* Treatments Description */}
          <Text className="font-pregular text-md leading-6 mb-2">
            {treatment}
          </Text>

          {/* Submitted By section */}
          {isReview && (
            <Text className="font-pregular text-md leading-6 mb-5 text-gray-600">
              Submitted By: {farmerName}
            </Text>
          )}

          <Text className="font-psemibold text-md mb-5 mt-3">Description</Text>
          <Text className="font-pregular text-md leading-6 mb-5">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Cum sequi
            at molestias vitae vel autem eum maiores, ipsum libero doloremque
            maxime aut inventore vero sapiente distinctio similique beatae
            veritatis natus.
          </Text>

          {/* Instructions section */}
          <Text className="font-psemibold text-md mb-5">Instructions</Text>
          <Text className="font-pregular text-md leading-6 mb-5">
            {/* You can customize or dynamically populate these instructions */}
            1. Consult with a healthcare professional or agricultural expert.{" "}
            {"\n"}
            2. Follow recommended treatment protocols. {"\n"}
            3. Monitor progress and adjust treatment as necessary.
          </Text>

          {/* Conditional rendering for buttons */}
          {isReview ? (
            <View className="flex-row justify-between w-full my-6">
              <CustomButton
                title="Deny"
                containerStyles="w-[48%]"
                buttonColor="#FF5252"
                onPress={handleDeny}
              />
              <CustomButton
                title="Approve"
                containerStyles="w-[48%]"
                buttonColor="#4CAF50"
                onPress={handleApprove}
              />
            </View>
          ) : (
            <CustomButton
              title="Edit Treatment"
              containerStyles="w-full my-6"
              onPress={() => router.push("/edit-treatment")}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default TreatmentDetailsScreen;
