import { View, Text, Image, ScrollView, ImageBackground, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const Treatment = () => {
  const {
    imageUri = null,
    disease = "Unknown Disease",
    confidence = "0%",
    date = new Date().toLocaleDateString(),
    description = "No description available",
    treatments = '{"id": "", "name": "", "description": ""}',
    medicines = '{"id": "", "name": "", "description": "", "image": ""}',
    fromHistory = false,
  } = useLocalSearchParams();

  const [showAdditionalTreatments, setShowAdditionalTreatments] = useState(false);
  const [showAdditionalMedicines, setShowAdditionalMedicines] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to get disease URL
  const getDiseaseUrl = (diseaseName) => {
    const urls = {
      "Possible Tungro": "http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/tungro",
      "Rice Blast": "http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/blast-node-neck",
      "Leaf Blight": "http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/sheath-blight"
    };
    return urls[diseaseName] || null;
  };

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 400);

    const fetchScrapedData = async () => {
      try {
        const diseaseUrl = getDiseaseUrl(disease);
        if (diseaseUrl) {
          const response = await fetch(`${API_URL_BCNKEND}/history/scrape-text/diseaseTreatment`, {
            method: 'POST',
            headers: {
              'X-API-Key': AUTH_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: diseaseUrl }),
          });
          const data = await response.json();
          setScrapedData(data.content);
        }
      } catch (error) {
        console.error('Error fetching scraped data:', error);
      }
    };

    fetchScrapedData();
  }, [disease]);

  const parsedTreatment = JSON.parse(treatments);
  const parsedMedicine = JSON.parse(medicines);

  if (isLoading) {
    return (
      <ImageBackground
        source={images.background_treatment}
        className="flex-1 h-full"
        resizeMode="cover"
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={images.background_treatment}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{}}
    >
      <View className="flex-1 h-full w-full pt-7">
        <SafeAreaView className="w-full h-full">
          <ScrollView className="px-7">
            {/* Back navigation */}
            <View className="flex-row items-center w-full mb-2">
              <Icon
                name="chevron-left"
                size={40}
                color="black"
                onPress={() => router.back()}
              />
              <Text className="font-pmedium text-[30px]">Treatments</Text>
            </View>

            {/* Dynamic Image */}
            <Image
              source={imageUri ? { uri: imageUri } : images.logo}
              resizeMode="cover"
              className="w-full h-[275px] mb-3 border bg-slate-400"
              borderRadius={10}
              onError={(e) => console.error("Image load error:", e.nativeEvent.error)}
              onLoad={() => console.log("Image loaded successfully")}
            />

            {/* Disease Name */}
            <View className="justify-center items-center mb-1">
              <Text className="font-pmedium text-[25px] text-center">
                {disease} Treatment
              </Text>
            </View>

            {/* Scraped Content Section */}
            <View className="mb-5">
              <View className="p-4 bg-green-600/50 rounded-lg">
                {scrapedData?.Howtomanage && (
                  <View>
                    <Text className="font-pbold text-xl mb-2">How to Manage</Text>
                    <Text className="font-pregular text-md leading-6">
                      {scrapedData.Howtomanage.text}
                    </Text>
                    {scrapedData.Howtomanage.lists.map((list, listIndex) => (
                      <View key={listIndex} className="mt-2">
                        {list.map((item, itemIndex) => (
                          <View key={itemIndex} className="flex-row ml-4 mb-1">
                            <Text className="mr-2">•</Text>
                            <Text className="font-pregular text-md flex-1">{item}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                    <Text className="font-pregular text-[12px] mt-4 leading-2 text-right mr-3">- IRRI Knowledge Bank 2025</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Collapsible Database Treatments */}
            {Array.isArray(parsedTreatment) && parsedTreatment.length > 0 && (
              <View className="mb-5">
                <View
                  className="flex-row items-center justify-between  bg-green-600/50  p-4 rounded-lg"
                  onTouchEnd={() => setShowAdditionalTreatments(!showAdditionalTreatments)}
                >
                  <Text className="font-psemibold text-xl">Additional Treatments</Text>
                  <Icon
                    name={showAdditionalTreatments ? "expand-less" : "expand-more"}
                    size={24}
                    color="black"
                  />
                </View>
                {showAdditionalTreatments && (
                  <View className="mt-2">
                    {parsedTreatment.map((item, index) => (
                      <View key={item.id || index} className="mb-2 p-4  bg-green-600/50  rounded-lg">
                        <Text className="font-pmedium text-lg mb-2">{item.name}</Text>
                        <Text className="font-pregular text-md leading-6">
                          {item.description}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Medicines Section - Only Collapsible */}
            {Array.isArray(parsedMedicine) && parsedMedicine.length > 0 && (
              <View className="mb-5">
                <View
                  className="flex-row items-center justify-between  bg-green-600/50  p-4 rounded-lg"
                  onTouchEnd={() => setShowAdditionalMedicines(!showAdditionalMedicines)}
                >
                  <Text className="font-psemibold text-xl">Medicines</Text>
                  <Icon
                    name={showAdditionalMedicines ? "expand-less" : "expand-more"}
                    size={24}
                    color="black"
                  />
                </View>
                {showAdditionalMedicines && (
                  <View className="mt-2">
                    {parsedMedicine.map((item, index) => (
                      <View key={item.id || index}>
                        <View className="mb-2 p-4  bg-green-600/50  rounded-lg">
                          <Text className="font-pmedium text-lg mb-2">{item.name}</Text>
                          {item.image && (
                            <Image
                              source={{ uri: item.image }}
                              className="w-full h-[100px] mb-3"
                              resizeMode="contain"
                            />
                          )}
                          <Text className="font-pregular text-md leading-6">
                            {item.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <CustomButton
              title="Store Nearby"
              handlePress={() => router.push("nearby")}
              containerStyles="w-full my-6"
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default Treatment;
