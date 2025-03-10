import { View, Text, SafeAreaView, ScrollView } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import ReportCard from "../../components/ReportCard";
import images from "../../constants/images";
const ReportScreen = () => {
  const data = [
    { value: 694, color: "#000064", disease: "Tungro" },
    { value: 602, color: "#E80D0D", disease: "Rice Blast" },
    { value: 350, color: "#FED402", disease: "Leaf Blight" },
  ];

  // Calculate total scans
  const totalScans = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ScrollView className="mt-12">
      <SafeAreaView className="px-7 w-full h-full mb-10 gap-5">
        <View className="flex-row items-center w-full mb-3">
          <Text className="font-pmedium text-[30px]">Reports</Text>
        </View>

        <View className="flex-column justify-center items-center w-full mb-3 gap-1">
          <PieChart
            donut
            innerRadius={70}
            data={data}
            radius={90}
            centerLabelComponent={() => (
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 30, fontWeight: "bold" }}>
                  {totalScans}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "semibold",
                    color: "#555",
                  }}
                >
                  Total Scans
                </Text>
              </View>
            )}
          />
          {/* Legends Section */}
          <View className="flex-row flex-wrap justify-center w-full mt-3 gap-4">
            {data.map((item, index) => (
              <View
                key={index}
                className="flex-row items-center m-2 gap-2"
                style={{ minWidth: "20%", justifyContent: "center" }} // Ensures even spacing
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: item.color,
                    borderRadius: 5,
                    marginRight: 5,
                  }}
                />
                <View className="flex-col items-start justify-start">
                  <Text className="font-psemibold text-lg">{item.value}</Text>
                  <Text className="mt-[-8] font-pregular text-sm">
                    {item.disease}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <ReportCard
            disease="Tungro"
            user="John Doe"
            date="3/2/2025"
            percent={87}
            color="bg-[#ADD8E6]"
            image={images.tungro}
          />
          <ReportCard
            disease="Rice Blast"
            user="Angelo Degamo"
            date="3/1/2025"
            percent={97}
            color="bg-[#ADD8E6]"
            image={images.blast}
          />
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default ReportScreen;
