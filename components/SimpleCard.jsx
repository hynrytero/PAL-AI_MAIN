import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function SmallCard({ disease, num, color, handlePress }) {
  // Check if num is a number
  const isNumber = typeof num === "number";

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#E6F7F0", 
          borderRadius: 10,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
          width: "100%",
          alignSelf: "center",
          position: "relative",
          overflow: "hidden", 
        }}
      >
        {/* Left Colored Bar */}
        <View
          style={{
            width: 8,
            backgroundColor: color,
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            height: "100%",
          }}
        />

        {/* Disease Name & Treatments Count */}
        <View
          style={{
            flex: 1,
            marginLeft: 8,
            paddingVertical: 16,
            paddingLeft: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#000",
              marginBottom: 2,
            }}
          >
            {disease}
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            {isNumber ? `Treatments` : num}
          </Text>
        </View>

      </View>
    </TouchableOpacity>
  );
}
