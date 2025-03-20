import { View, Text, TouchableOpacity } from "react-native";
import { ScrollView, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import TreatmentCard from "../../components/TreatmentCard";
import SimpleCard from "../../components/SimpleCard";
import images from "../../constants/images";
import React from "react";

const TreatmentScreen = () => {
  return (
    <ScrollView className="mt-12">
      <SafeAreaView
        className="px-7 w-full h-full mb-10 flex-col"
        style={{ rowGap: 10 }}
      >
        <View className="flex-row items-center w-full mb-3">
          <Text className="font-pmedium text-[30px]">Treatments</Text>
          <TouchableOpacity
            onPress={() => router.push("farmers-treatment")}
            style={{ marginLeft: 10 }}
          >
            <FontAwesome name="refresh" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            rowGap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              columnGap: 20,
            }}
          >
            <TreatmentCard
              treatment="Imidacloprid"
              color="#CCCCE0"
              image={images.treatment1}
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Imidacloprid" },
                })
              }
            />
            <TreatmentCard
              treatment="Thiamethoxam"
              color="#CCCCE0"
              image={images.treatment2}
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Thiamethoxam" },
                })
              }
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              columnGap: 20,
            }}
          >
            <TreatmentCard
              treatment="Tricyclazole"
              color="#FACFCF"
              image={images.treatment3}
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Tricyclazole" },
                })
              }
            />
            <TreatmentCard
              treatment="Azoxystrbin"
              color="#FACFCF"
              image={images.treatment4}
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Azoxystrbin" },
                })
              }
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              columnGap: 20,
            }}
          >
            <TreatmentCard
              treatment="Mancozeb"
              color="#FFF6CC"
              image={images.treatment5}
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Mancozeb" },
                })
              }
            />
            <TreatmentCard
              treatment="Carbendazim"
              color="#FFF6CC"
              image={images.treatment6}
              handlePress={() =>
                router.push({
                  pathname: "treatment-details",
                  params: { treatment: "Carbendazim" },
                })
              }
            />
          </View>
        </View>
        <SimpleCard disease="Tungro" num={6} color="#000064" />
        <SimpleCard disease="Rice Blast" num={3} color="#E80D0D" />
        <SimpleCard disease="Leaf Blight" num={10} color="#FED402" />
      </SafeAreaView>
    </ScrollView>
  );
};

export default TreatmentScreen;
