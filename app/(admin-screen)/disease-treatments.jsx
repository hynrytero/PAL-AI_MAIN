import React, { useState, useEffect } from "react";
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import SimpleCard from "../../components/SimpleCard";
import images from "../../constants/images";
import axios from "axios";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const DiseaseTreatmentsScreen = () => {
  const { diseaseId, diseaseName } = useLocalSearchParams();

  const [treatments, setTreatments] = useState([]);
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState(null);

  // Form states
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentDescription, setTreatmentDescription] = useState('');

  // Disease color mapping
  const getDiseaseColor = (diseaseName) => {
    const colorMap = {
      "Tungro": "#228B22",
      "Rice Blast": "#E80D0D",
      "Leaf Blight": "#FED402"
    };
    return colorMap[diseaseName] || "#000064";
  };

  // Search treatments
  const searchTreatments = (query) => {
    if (!query) {
      setFilteredTreatments(treatments);
    } else {
      const filtered = treatments.filter(treatment =>
        treatment.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTreatments(filtered);
    }
  };

  // Fetch treatments
  const fetchTreatments = async () => {
    if (!diseaseId) {
      setError("No disease ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL_BCNKEND}/admin/treatments/by-disease/${diseaseId}`, {
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response?.data?.data && Array.isArray(response.data.data)) {
        setTreatments(response.data.data);
        setFilteredTreatments(response.data.data);
      } else {
        setError("No treatments found");
      }
    } catch (error) {
      console.error("Treatments fetch error:", error);
      setError("Failed to load treatments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Delete treatment handler
  const handleDeleteTreatment = async () => {
    if (!currentTreatment) return;

    try {
      const response = await axios.delete(
        `${API_URL_BCNKEND}/admin/treatments/delete/${currentTreatment.treatment_id}`,
        {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Close edit modal
        setEditModalVisible(false);

        // Refresh treatments after deletion
        fetchTreatments();

        // Reset search
        setSearchQuery('');

        // Show success message
        Alert.alert("Success", "Treatment deleted successfully");
      }
    } catch (error) {
      console.error("Delete treatment error:", error);
      Alert.alert("Error", "Failed to delete treatment");
    }
  };

  // Refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setSearchQuery('');
    fetchTreatments();
  }, [diseaseId]);

  // Add treatment handler
  const handleAddTreatment = async () => {
    if (!treatmentName.trim()) {
      Alert.alert("Error", "Treatment name is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL_BCNKEND}/admin/treatments/add`,
        {
          rice_leaf_disease_id: diseaseId,
          treatment: treatmentName,
          description: treatmentDescription
        },
        {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh treatments after adding
      if (response.data.success) {
        // Reset form and close modal
        setTreatmentName('');
        setTreatmentDescription('');
        setAddModalVisible(false);

        // Fetch updated treatments
        fetchTreatments();

        // Reset search
        setSearchQuery('');
      }
    } catch (error) {
      console.error("Add treatment error:", error);
      Alert.alert("Error", "Failed to add treatment");
    }
  };

  // Edit treatment handler
  const handleEditTreatment = async () => {
    if (!treatmentName.trim()) {
      Alert.alert("Error", "Treatment name is required");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL_BCNKEND}/admin/treatments/edit/${currentTreatment.treatment_id}`,
        {
          treatment: treatmentName,
          description: treatmentDescription
        },
        {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check if update was successful
      if (response.data.success) {
        // Reset form and close modal
        setTreatmentName('');
        setTreatmentDescription('');
        setEditModalVisible(false);

        // Fetch updated treatments
        fetchTreatments();

        // Reset search
        setSearchQuery('');
      }
    } catch (error) {
      console.error("Edit treatment error:", error);
      Alert.alert("Error", "Failed to edit treatment");
    }
  };

  // Open edit modal
  const openEditModal = (treatment) => {
    setCurrentTreatment(treatment);
    setTreatmentName(treatment.name || '');
    setTreatmentDescription(treatment.description || '');
    setEditModalVisible(true);
  };

  // Render treatment modal
  const renderTreatmentModal = (isEdit = false) => {
    const modalVisible = isEdit ? isEditModalVisible : isAddModalVisible;
    const modalTitle = isEdit ? "Edit Treatment" : "Add Treatment";
    const handleSubmit = isEdit ? handleEditTreatment : handleAddTreatment;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          isEdit ? setEditModalVisible(false) : setAddModalVisible(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-5 rounded-lg w-[90%] max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-pbold">{modalTitle}</Text>
              {isEdit && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Confirm Deletion",
                      "Are you sure you want to delete this treatment?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: handleDeleteTreatment }
                      ]
                    );
                  }}
                >
                  <Icon name="delete" size={24} color="black" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              className="border border-gray-300 p-2 rounded mb-3"
              placeholder="Treatment Name"
              value={treatmentName}
              onChangeText={setTreatmentName}
            />

            <TextInput
              className="border border-gray-300 p-2 rounded mb-3 h-60"
              placeholder="Description (Optional)"
              value={treatmentDescription}
              onChangeText={setTreatmentDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              scrollEnabled={true}
            />

            <View className="flex-row justify-between items-center mt-3">
              <TouchableOpacity
                className="bg-gray-300 px-4 py-2 rounded"
                onPress={() => {
                  isEdit ? setEditModalVisible(false) : setAddModalVisible(false);
                  setTreatmentName('');
                  setTreatmentDescription('');
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-green-600 px-4 py-2 rounded"
                onPress={handleSubmit}
              >
                <Text className="text-white">{isEdit ? "Update" : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    fetchTreatments();
  }, [diseaseId]);

  // Update filtered treatments when search query changes
  useEffect(() => {
    searchTreatments(searchQuery);
  }, [searchQuery, treatments]);

  if (loading && !refreshing) {
    return (
      <ImageBackground
        source={images.background_history}
        className="flex-1 h-full"
        resizeMode="cover"
        imageStyle={{ opacity: 0.5 }}
      >
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 font-pmedium">Loading treatments...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={images.background_history}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{ opacity: 0.5 }}
    >
      <SafeAreaView className="flex-1 pt-8">
        <ScrollView
          className="flex-1 p-5"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0000ff']}
              tintColor="#0000ff"
            />
          }
        >
          {/* Back navigation and title */}
          <View className="flex-row items-center justify-between w-full mb-2">
            <View className="flex-row items-center">
              <Icon
                name="chevron-left"
                size={40}
                color="black"
                onPress={() => router.back()}
              />
              <Text className="font-pmedium text-[27px]">
                {diseaseName || "Treatments"}
              </Text>
            </View>

            {/* Add Treatment Button */}
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={{
                padding: 8,
                borderRadius: 8,
                marginBottom: 12,
              }}
              activeOpacity={0.7}
            >
              <Icon name="add" size={30} color="black" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="mb-4 flex-row items-center">
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
                placeholder="Search treatments..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {error && (
            <View className="bg-red-100 p-3 rounded-md mb-3">
              <Text className="text-red-700 text-center">{error}</Text>
            </View>
          )}

          {filteredTreatments.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="font-pmedium text-lg">
                {searchQuery ? "No treatments found" : "No treatments available"}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                rowGap: 10,
              }}
            >
              {filteredTreatments.map((treatment) => (
                <View
                  key={treatment.treatment_id}
                  className="w-full"
                >
                  <SimpleCard
                    disease={treatment.name || "Unknown Treatment"}
                    num={treatment.description || "No additional info"}
                    color={getDiseaseColor(diseaseName)}
                    handlePress={() => openEditModal(treatment)}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Modals */}
        {renderTreatmentModal()}
        {renderTreatmentModal(true)}
      </SafeAreaView>
    </ImageBackground>
  );
};

export default DiseaseTreatmentsScreen;