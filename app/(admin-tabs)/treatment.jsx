import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image, ScrollView, RefreshControl, Dimensions } from "react-native";
import { SafeAreaView, ImageBackground } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import TreatmentCard from "../../components/TreatmentCard";
import SimpleCard from "../../components/SimpleCard";
import images from "../../constants/images";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const { width } = Dimensions.get('window');

const TreatmentScreen = () => {
  const { shouldRefresh } = useLocalSearchParams();
  const [treatments, setTreatments] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isAddMedicineModalVisible, setIsAddMedicineModalVisible] = useState(false);

  // Pagination and Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 4;

  // Add Medicine Modal State
  const [medicineName, setMedicineName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [image, setImage] = useState(null);
  const [medicineLoading, setMedicineLoading] = useState(false);

  // Filtered and Paginated Treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter(treatment =>
      treatment.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      treatment.rice_plant_medicine?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [treatments, searchQuery]);

  const paginatedTreatments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTreatments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTreatments, currentPage]);

  const totalPages = Math.ceil(filteredTreatments.length / itemsPerPage);

  // Image Picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // Add Medicine Handler
  const handleAddMedicine = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Validation Error', 'Please enter medicine name');
      return;
    }

    setMedicineLoading(true);

    const formData = new FormData();
    formData.append('rice_plant_medicine', medicineName);

    if (selectedDisease) {
      formData.append('rice_leaf_disease_id', selectedDisease.disease_id);
    }

    if (description) {
      formData.append('description', description);
    }

    if (image) {
      formData.append('image', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'medicine-image.jpg'
      });
    }

    try {
      const response = await axios.post(
        `${API_URL_BCNKEND}/admin/disease/new-medicine`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-API-Key': AUTH_KEY
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Medicine added successfully');
        setTreatments(prevTreatments => [
          ...prevTreatments,
          response.data.data
        ]);
        resetMedicineForm();
        setIsAddMedicineModalVisible(false);
      }
    } catch (error) {
      console.error('Add medicine error:', error.response ? error.response.data : error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add medicine'
      );
    } finally {
      setMedicineLoading(false);
      onRefresh();
    }
  };

  // Reset Medicine Form
  const resetMedicineForm = () => {
    setMedicineName('');
    setDescription('');
    setSelectedDisease(null);
    setImage(null);
  };

  // Fetch Treatments and Diseases
  const fetchTreatmentsAndDiseases = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch treatments
      let treatmentData = [];
      try {
        const treatmentsResponse = await axios.get(`${API_URL_BCNKEND}/admin/treatments/all`, {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (treatmentsResponse?.data?.data && Array.isArray(treatmentsResponse.data.data)) {
          treatmentData = treatmentsResponse.data.data;
        }
      } catch (treatmentError) {
        console.error("Error fetching treatments:", treatmentError);
      }

      setTreatments(treatmentData);

      // Fetch diseases
      let diseaseData = [];
      try {
        const diseasesResponse = await axios.get(`${API_URL_BCNKEND}/admin/disease`, {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (diseasesResponse?.data?.data && Array.isArray(diseasesResponse.data.data)) {
          diseaseData = diseasesResponse.data.data;
        }
      } catch (diseaseError) {
        console.error("Error fetching diseases:", diseaseError);
      }

      setDiseases(diseaseData);

    } catch (error) {
      console.error("Error in data fetching process:", error);
      setError("Failed to load data. Please try again later.");
      Alert.alert(
        "Error",
        "Failed to load treatments and diseases. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // On Refresh Handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTreatmentsAndDiseases();
  }, []);

  // Initial Data Fetch and Handle Refresh
  useEffect(() => {
    // If shouldRefresh is true, trigger a refresh
    if (shouldRefresh === 'true') {
      onRefresh();
      // Reset the parameter to prevent repeated refreshes
      router.replace({
        pathname: "treatment",
        params: { shouldRefresh: 'false' }
      });
    } else {
      // Normal initial fetch
      fetchTreatmentsAndDiseases();
    }
  }, [shouldRefresh]);

  // Get Treatment Image
  const getTreatmentImage = (treatment) => {
    if (treatment.image) {
      const imageUrl = treatment.image.replace(/^data:image\/jpeg;base64,/, '');
      return { uri: imageUrl };
    }
    return images.medicine;
  };

  // Treatment color mapping
  const getTreatmentColor = (index) => {
    const colors = ["#CCCCE0", "#FACFCF", "#FFF6CC"];
    return colors[index % colors.length];
  };

  // Disease color mapping
  const getDiseaseColor = (diseaseName) => {
    const colorMap = {
      "Possible Tungro": "#228B22",
      "Rice Blast": "#E80D0D",
      "Leaf Blight": "#FED402"
    };
    return colorMap[diseaseName] || "#000064";
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2 font-pmedium">Loading treatments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={images.background_profile}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000000']}
            tintColor={'#000000'}
          />
        }
        className="mt-12"
      >
        <SafeAreaView
          className="px-7 w-full h-full mb-10 flex-col"
          style={{ rowGap: 10 }}
        >
          <View className="flex-row items-center justify-between w-full">
            <Text className="font-pmedium text-[30px]">Treatments</Text>
          </View>

          {error && (
            <View className="bg-red-100 p-3 rounded-md mb-3">
              <Text className="text-red-700">{error}</Text>
            </View>
          )}

          <View className="mb-5">
            {/* Search Input */}
            <View className="mb-2 flex-row items-center">
              <View className="flex-1 flex-row items-center border border-gray-300 rounded-full">
                <Icon
                  name="search"
                  size={20}
                  color="gray"
                  style={{
                    paddingLeft: 10,
                    paddingRight: 5
                  }}
                />
                <TextInput
                  className="flex-1 p-2 "
                  placeholder="Search Medicines..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Title and Add Button*/}
            <View className="flex-row items-center justify-between">
              <Text className="font-pmedium text-[18px]">Medicines</Text>
              <TouchableOpacity
                onPress={() => setIsAddMedicineModalVisible(true)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
                activeOpacity={0.7}
              >
                <Icon name="add" size={22} color="black" />
              </TouchableOpacity>
            </View>

            {/* Medicines Section */}
            <View style={{ rowGap: 15, width: '100%' }}>
              {paginatedTreatments.length > 0 ? (
                <View style={{ rowGap: 15 }}>
                  {Array(Math.ceil(paginatedTreatments.length / 2))
                    .fill()
                    .map((_, rowIndex) => (
                      <View
                        key={`row-${rowIndex}`}
                        style={{
                          flexDirection: "row",
                          width: "100%",
                          columnGap: 15,
                        }}
                      >
                        {paginatedTreatments
                          .slice(rowIndex * 2, rowIndex * 2 + 2)
                          .map((treatment, colIndex) => (
                            <TreatmentCard
                              key={treatment.medicine_id || `treatment-${rowIndex}-${colIndex}`}
                              treatment={treatment.name || treatment.rice_plant_medicine || "Unknown"}
                              color={getTreatmentColor(rowIndex * 2 + colIndex)}
                              image={getTreatmentImage(treatment)}
                              handlePress={() =>
                                router.push({
                                  pathname: "treatment-details",
                                  params: {
                                    treatmentId: treatment.medicine_id,
                                    treatment: treatment.name || treatment.rice_plant_medicine,
                                  },
                                })
                              }
                            />
                          ))}
                        {/* If odd number of treatments in the last row, add empty space */}
                        {rowIndex === Math.ceil(paginatedTreatments.length / 2) - 1 &&
                          paginatedTreatments.length % 2 === 1 && <View style={{ flex: 1 }} />}
                      </View>
                    ))}
                </View>
              ) : (
                <View className="py-5 items-center bg-white-100 rounded-md">
                  <Text>No treatments found</Text>
                </View>
              )}
            </View>

            {/* Pagination Controls */}
            <View className="flex-row justify-between items-center mt-2 mx-1">
              <TouchableOpacity
                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg ${currentPage === 1 ? 'bg-gray-300' : 'bg-green-600'}`}
              >
                <Text className={`${currentPage === 1 ? 'text-gray-500' : 'text-white'} text-[13px]`}>Prev</Text>
              </TouchableOpacity>
              
              <View className="flex-row space-x-2">
                {[...Array(totalPages)].map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentPage(index + 1)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      currentPage === index + 1 ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`${currentPage === index + 1 ? 'text-white' : 'text-gray-700'} text-[11px]`}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg ${currentPage === totalPages ? 'bg-gray-300' : 'bg-green-600'}`}
              >
                <Text className={`${currentPage === totalPages ? 'text-gray-500' : 'text-white'} text-[13px]`}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Diseases Section */}
          <View>
            <Text className="font-pmedium text-[18px] mb-2">Disease Treatments</Text>

            <View style={{ rowGap: 10 }}>
              {diseases.length > 0 ? (
                diseases
                  .filter(disease => disease.name !== "No Disease")
                  .map(disease => (
                    <SimpleCard
                      key={disease.disease_id}
                      disease={disease.name || "Unknown"}
                      num={disease.medicine_count || 0}
                      color={getDiseaseColor(disease.name)}
                      handlePress={() =>
                        router.push({
                          pathname: "disease-treatments",
                          params: {
                            diseaseId: disease.disease_id,
                            diseaseName: disease.name
                          }
                        })
                      }
                    />
                  ))
              ) : (
                <View className="py-5 items-center bg-gray-100 rounded-md">
                  <Text>No diseases available</Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Add Medicine Modal*/}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAddMedicineModalVisible}
        onRequestClose={() => setIsAddMedicineModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white w-[90%] rounded-lg p-5">
            <Text className="text-xl font-pbold mb-4">Add New Medicine</Text>

            <ScrollView>
              <TextInput
                placeholder="Medicine Name"
                value={medicineName}
                onChangeText={setMedicineName}
                className="border border-gray-300 p-2 rounded mb-3"
              />

              <TextInput
                placeholder="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="border border-gray-300 p-2 rounded mb-3 h-24"
              />

              {/* Disease Selector*/}
              <View className="mb-3">
                <Text className="font-pmedium">Select Disease</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    {diseases
                    .filter(disease => disease.name !== "No Disease")
                    .map(disease => (
                      <TouchableOpacity
                        key={disease.disease_id}
                        onPress={() => setSelectedDisease(disease)}
                        className={`p-2 m-1 rounded-full ${selectedDisease?.disease_id === disease.disease_id
                          ? 'bg-green-600'
                          : 'bg-gray-200'
                          }`}
                      >
                        <Text
                          className={`${
                            selectedDisease?.disease_id === disease.disease_id
                              ? 'text-white'
                              : 'text-black'
                          } text-[12px]`}
                        >
                          {disease.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* Image Picker */}
              <TouchableOpacity
                onPress={pickImage}
                className="bg-gray-200 p-3 rounded mb-3 items-center"
              >
                <Text className="text-gray-700">
                  {image ? 'Change Image' : 'Pick an Image (Optional)'}
                </Text>
              </TouchableOpacity>

              {image && (
                <Image
                  source={{ uri: image.uri }}
                  className="w-full h-48 rounded mb-3"
                  resizeMode="cover"
                />
              )}

              {/* Action Buttons */}
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setIsAddMedicineModalVisible(false)}
                  className="bg-gray-300 p-3 rounded-lg flex-1 mr-2"
                >
                  <Text className="text-center">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddMedicine}
                  disabled={medicineLoading || !selectedDisease}
                  className={`p-3 rounded-lg flex-1 ml-2 ${selectedDisease ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                >
                  <Text className={`text-center ${selectedDisease ? 'text-white' : 'text-gray-200'}`}>
                    {medicineLoading ? 'Adding...' : 'Add Medicine'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default TreatmentScreen;