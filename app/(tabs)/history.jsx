import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Card from "../../components/Card";
import { images } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';
import { Ionicons } from '@expo/vector-icons';

const API_URL = API_URL_BCNKEND;
const ITEMS_PER_PAGE = 5;

const History = () => {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("all"); 
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchScanHistory();
  }, []);

  // Apply filters and search whenever scans, searchQuery, or filterType changes
  useEffect(() => {
    applyFiltersAndSearch();
  }, [scans, searchQuery, filterType]);

  const fetchScanHistory = async () => {
    try {
      if (!user.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/history/scan-history/${user.id}`, {
        headers: {
          'X-API-Key': AUTH_KEY
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scan history');
      }

      const data = await response.json();
     
      const transformedData = data.map(scan => ({
        ...scan,
        diseaseDescription: scan.disease_description, 
        confidence: scan.confidence.toString(), 
        treatments: scan.treatments.map(treatment => ({
          ...treatment,
          treatment: treatment.name 
        })),
        medicines: scan.medicines.map(medicine => ({
          ...medicine,
          medicine: medicine.name 
        }))
      }));
      
      setScans(transformedData);
      setCurrentPage(1); 
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Error',
        'Failed to load scan history. Please try again later.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...scans];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter((scan) => 
        scan.disease.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sort filter
    switch (filterType) {
      case "recent":
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "highest":
        result.sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));
        break;
      case "lowest":
        result.sort((a, b) => parseFloat(a.confidence) - parseFloat(b.confidence));
        break;
      default:
        // Default is recent first
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    setFilteredScans(result);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchScanHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCardPress = useCallback(async (scan) => {
    if (isNavigating) return;

    setIsNavigating(true);

    router.push({
      pathname: "/result",
      params: {
        imageUri: scan.image,
        disease: scan.disease,
        confidence: `${scan.confidence}%`,
        date: formatDate(scan.date),
        description: scan.diseaseDescription,
        medicines: JSON.stringify(scan.medicines),
        treatments: JSON.stringify(scan.treatments),
        fromHistory: true
      }
    });

    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  }, [isNavigating]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedScans = filteredScans.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <ImageBackground
      source={images.background_history}
      className="flex-1 h-full w-full bg-white"
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        className="mt-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <SafeAreaView className="px-7 w-full h-full mb-10">
          <View className="flex-row items-center w-full mb-3">
            <Text className="font-pmedium text-[30px]">History</Text>
          </View>

          {/* Search Bar */}
          <View className="flex flex-row items-center bg-white rounded-full px-4 mb-4 border border-gray-300">
            <Ionicons name="search" size={20} color="gray" />
            <TextInput
              className="flex-1 py-2 px-2"
              placeholder="Search by disease name"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Options */}
          <View className="flex-row mb-4 justify-between">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${filterType === "all" ? "bg-[#228B22]" : "bg-gray-200"}`}
                onPress={() => setFilterType("all")}
              >
                <Text className={filterType === "all" ? "text-white" : "text-gray-700"}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${filterType === "recent" ? "bg-[#228B22]" : "bg-gray-200"}`}
                onPress={() => setFilterType("recent")}
              >
                <Text className={filterType === "recent" ? "text-white" : "text-gray-700"}>Recent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${filterType === "oldest" ? "bg-[#228B22]" : "bg-gray-200"}`}
                onPress={() => setFilterType("oldest")}
              >
                <Text className={filterType === "oldest" ? "text-white" : "text-gray-700"}>Oldest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${filterType === "highest" ? "bg-[#228B22]" : "bg-gray-200"}`}
                onPress={() => setFilterType("highest")}
              >
                <Text className={filterType === "highest" ? "text-white" : "text-gray-700"}>Highest Confidence</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mr-2 ${filterType === "lowest" ? "bg-[#228B22]" : "bg-gray-200"}`}
                onPress={() => setFilterType("lowest")}
              >
                <Text className={filterType === "lowest" ? "text-white" : "text-gray-700"}>Lowest Confidence</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Results Counter */}
          {!loading && (
            <Text className="text-gray-500 mb-2">
              Showing {filteredScans.length > 0 ? startIdx + 1 : 0} - {Math.min(startIdx + ITEMS_PER_PAGE, filteredScans.length)} of {filteredScans.length} results
            </Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#ADD8E6" />
          ) : paginatedScans.length > 0 ? (
            <>
              {paginatedScans.map((scan, index) => (
                <TouchableOpacity
                  key={`${scan.id}-${index}`}
                  onPress={() => handleCardPress(scan)}
                  activeOpacity={0.7}
                  disabled={isNavigating}
                >
                  <Card
                    disease={scan.disease}
                    desc={scan.diseaseDescription}
                    date={formatDate(scan.date)}
                    percent={scan.confidence.toString()}
                    color="bg-[#ADD8E6]"
                    image={{ uri: scan.image }}
                    medicines={scan.medicines}
                    treatments={scan.treatments}
                  />
                </TouchableOpacity>
              ))}
              
              {/* Pagination Controls */}
              {filteredScans.length > ITEMS_PER_PAGE && (
                <View className="flex-row justify-between items-center mt-1 mb-4">
                  <TouchableOpacity 
                    onPress={prevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-full ${currentPage === 1 ? "bg-gray-200" : "bg-[#228B22]"}`}
                  >
                    <Text className={currentPage === 1 ? "text-gray-400" : "text-white"}>Prev</Text>
                  </TouchableOpacity>
                  
                  <Text className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-full ${currentPage === totalPages ? "bg-gray-200" : "bg-[#228B22]"}`}
                  >
                    <Text className={currentPage === totalPages ? "text-gray-400" : "text-white"}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text className="text-center mt-4">
              {searchQuery ? "No matching scans found" : "No scan history found"}
            </Text>
          )}
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

export default History;