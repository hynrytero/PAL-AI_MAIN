import React from "react";
import images from "../../constants/images";
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  View,
  Text,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import SimpleCard from "../../components/SimpleCard";

const FarmersTreatmentScreen = () => {
  const router = useRouter();
  return (
    <ImageBackground
      source={images.background_history}
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
            <Text className="font-pmedium text-[30px]">Farmer's Treatment</Text>
          </View>
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              rowGap: 10,
            }}
          >
            <SimpleCard
              disease="Lorem Ipsumazole"
              num="Joemar Ygot"
              color="#000064"
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Lorem Ipsumazole" },
                })
              }
            />
            <SimpleCard
              disease="Blatimazole"
              num="Henry Tero"
              color="#E80D0D"
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Blatimazole" },
                })
              }
            />
            <SimpleCard
              disease="Hatdoceterizine"
              num="Angelo Degamo"
              color="#FED402"
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Hatdoceterizine" },
                })
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default FarmersTreatmentScreen;
