import { View, Text, Image } from "react-native";
import images from "../constants/images";
import React from "react";

const ReportCard = ({ disease, user, date, percent, color, image }) => {
  return (
    <View className="bg-white rounded-lg overflow-hidden m-3">
      <Image
        source={image}
        className="w-full h-52"
      />
      <View className={`p-3 ${color}`}>
        <Text className="text-lg font-bold mb-1">{disease}</Text>
        <Text className="text-sm text-gray-600 mb-3">{user}</Text>
        <Text className="text-xs text-gray-500">{date}</Text>
      </View>
      <View className="absolute top-2 right-2 bg-[#f1f1f1] px-2 py-1 rounded-md">
        <Text className="text-sm font-semibold">{percent}%</Text>
      </View>
    </View>
  );
};

export default ReportCard;
