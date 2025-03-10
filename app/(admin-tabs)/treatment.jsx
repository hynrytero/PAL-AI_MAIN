import { View, Text } from "react-native";
import TreatmentCard from "../../components/TreatmentCard";
import { ScrollView, SafeAreaView } from "react-native";
import images from "../../constants/images";
import { Link, router } from "expo-router";

import SimpleCard from "../../components/SimpleCard";

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
              handlePress={() => router.push("treatment-details")}
              style={{ width: "48%" }}
            />
            <TreatmentCard
              treatment="Thiamethoxam"
              color="#CCCCE0"
              image={images.treatment2}
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
            />
            <TreatmentCard
              treatment="Azoxystrbin"
              color="#FACFCF"
              image={images.treatment4}
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
            />
            <TreatmentCard
              treatment="Carbendazim"
              color="#FFF6CC"
              image={images.treatment6}
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
