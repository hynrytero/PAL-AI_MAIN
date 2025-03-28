import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

const TreatmentCard = ({ treatment, color, image, handlePress }) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        backgroundColor: color,
        padding: 10,
        borderRadius: 10,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image source={image} style={{ width: 100, height: 100, borderRadius: 15 }} />
      <Text>{treatment}</Text>
    </TouchableOpacity>
  );
};

export default TreatmentCard;
