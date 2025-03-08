// treatment-details.jsx in (admin-screen) folder
import { View, Text, Image, ScrollView } from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import images from "../../constants/images";

const TreatmentDetailsScreen = () => {
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: getTreatmentColor(treatment),
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Image
            source={getTreatmentImage(treatment)}
            style={{ width: 120, height: 120, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
            {treatment}
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            Description
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: "#333" }}>
            {treatment} is a common treatment used for rice diseases. It's
            effective against various pests and diseases that affect rice
            plants. Proper application is necessary for optimal results.
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            Dosage
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: "#333" }}>
            The recommended dosage is 2-3ml per liter of water. Apply evenly
            across affected areas for best results.
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            Application Method
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: "#333" }}>
            Apply using a backpack sprayer early in the morning or late
            afternoon for best absorption. Avoid application before rain or in
            strong wind conditions.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default TreatmentDetailsScreen;
