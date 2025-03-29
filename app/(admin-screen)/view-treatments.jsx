import { View, Text, Image, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const Viewresult = () => {

  const params = useLocalSearchParams();
  const [diseaseInfo, setDiseaseInfo] = useState({
    whatItDoes: { text: "", lists: [] },
    whyAndWhereItOccurs: { text: "", lists: [] },
    howToIdentify: { text: "", lists: [] }
  });
  const [isLoading, setIsLoading] = useState(true);

  const {
    imageUri = null,
    disease = "Unknown Disease",
    confidence = "0%",
    date = new Date().toLocaleDateString(),
    description = "No description available",
  } = params;

  // Function to get disease URL
  const getDiseaseUrl = (diseaseName) => {
    const urls = {
      "Tungro": "http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/tungro",
      "Rice Blast": "http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/blast-node-neck",
      "Leaf Blight": "http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/sheath-blight"
    };
    return urls[diseaseName] || null;
  };

  // Fetch disease information
  useEffect(() => {
    const fetchDiseaseInfo = async () => {
      try {
        const url = getDiseaseUrl(disease);
        if (!url) {
          setDiseaseInfo({
            whatItDoes: { text: description, lists: [] },
            whyAndWhereItOccurs: { text: '', lists: [] },
            howToIdentify: { text: '', lists: [] }
          });
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL_BCNKEND}/history/scrape-text/diseaseInfo`, {
          method: 'POST',
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.content) {
          setDiseaseInfo(data.content);
        } else {
          setDiseaseInfo({
            whatItDoes: { text: description, lists: [] },
            whyAndWhereItOccurs: { text: '', lists: [] },
            howToIdentify: { text: '', lists: [] }
          });
        }
      } catch (error) {
        console.error('Error fetching disease info:', error);
        setDiseaseInfo({
          whatItDoes: { text: description, lists: [] },
          whyAndWhereItOccurs: { text: '', lists: [] },
          howToIdentify: { text: '', lists: [] }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiseaseInfo();
  }, [disease, description]);

  const handleBack = () => {
    router.push("/report");
  };

  return (
    <ImageBackground
      source={images.background_result}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{}}
    >
      <SafeAreaView className="flex-1">
        {/* Main content in ScrollView */}
        <ScrollView
          className="flex-1 p-5"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 55,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center w-full mb-4">
            <Icon
              name="chevron-left"
              size={40}
              color="black"
              onPress={handleBack}
            />
            <Text className="font-pmedium text-[30px]">Result</Text>
          </View>

          {/* Image */}
          <Image
            source={imageUri ? { uri: imageUri } : images.logo}
            resizeMode="cover"
            className="w-full h-[275px] mb-4 border bg-slate-400"
            borderRadius={10}
            onError={(e) =>
              console.error("Image load error:", e.nativeEvent.error)
            }
            onLoad={() => console.log("Image loaded successfully")}
          />

          {/* Disease and Date */}
          <View className="flex-row justify-between w-full items-center">
            <Text className="font-pmedium text-[25px]">{disease}</Text>
            <Text className="font-pregular text-sm ">{date}</Text>
          </View>

          {/* Confidence */}
          <Text className="font-pregular text-lg mb-6">{confidence}</Text>

          {/* Description */}
          {isLoading ? (
            <Text className="font-pregular text-md">Loading disease information...</Text>
          ) : (
            <View>
              <Text className="font-pbold text-xl mb-2">What it does:</Text>
              <Text className="font-pregular text-md leading-6 mb-2">{diseaseInfo.whatItDoes.text}</Text>
              {diseaseInfo.whatItDoes.lists.map((list, listIndex) => (
                <View key={`what-list-${listIndex}`} className="mb-4">
                  {list.map((item, itemIndex) => (
                    <Text key={`what-item-${itemIndex}`} className="font-pregular text-md leading-6 ml-4">
                      • {item}
                    </Text>
                  ))}
                </View>
              ))}

              <Text className="font-pbold text-xl mb-2 mt-2">Why and where it occurs:</Text>
              <Text className="font-pregular text-md leading-6 mb-2">{diseaseInfo.whyAndWhereItOccurs.text}</Text>
              {diseaseInfo.whyAndWhereItOccurs.lists.map((list, listIndex) => (
                <View key={`why-list-${listIndex}`} className="mb-4">
                  {list.map((item, itemIndex) => (
                    <Text key={`why-item-${itemIndex}`} className="font-pregular text-md leading-6 ml-4">
                      • {item}
                    </Text>
                  ))}
                </View>
              ))}

              <Text className="font-pbold text-xl mb-2 mt-2">How to identify:</Text>
              <Text className="font-pregular text-md leading-6 mb-2">{diseaseInfo.howToIdentify.text}</Text>
              {diseaseInfo.howToIdentify.lists.map((list, listIndex) => (
                <View key={`identify-list-${listIndex}`} className="mb-4">
                  {list.map((item, itemIndex) => (
                    <Text key={`identify-item-${itemIndex}`} className="font-pregular text-md leading-6 ml-4">
                      • {item}
                    </Text>
                  ))}
                </View>
              ))}
              <Text className="font-pregular text-[12px] mt-2 leading-2 text-right mr-3">- IRRI Knowledge Bank 2025</Text>
            </View>
          )}
        </ScrollView>

        {/* Fixed Button at bottom */}
        <View className="px-5 pb-5 bg-white">
          <CustomButton
            title="Treatments"
            handlePress={() =>
              router.push({
                pathname: "/treatment"
              })
            }
            containerStyles="w-full"
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Viewresult;
