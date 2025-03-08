import { View, Text, Image } from "react-native";
import React from "react";

export default function TreatmentCard({ treatment, color, image }) {
  return (
    <View
      style={{
        backgroundColor: color, // ✅ Use inline style for dynamic background color
        borderRadius: 20,
        overflow: "hidden",
        height: 144,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 10,
        flex: 1, // ✅ Allow the card to take up available space in a row
      }}
    >
      <Image source={image} style={{ heighth: "100%", height: 87 }} />
      <Text style={{ fontSize: 14, color: "black", fontWeight: "600" }}>
        {treatment}
      </Text>
    </View>
  );
}
