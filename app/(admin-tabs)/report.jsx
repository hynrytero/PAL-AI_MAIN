import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, ScrollView, ImageBackground, ActivityIndicator, TouchableOpacity, TextInput } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { router } from "expo-router";
import ReportCard from "../../components/ReportCard";
import images from "../../constants/images";
import axios from "axios";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";

const API_URL = API_URL_BCNKEND;


const ReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanData, setScanData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const ITEMS_PER_PAGE = 5;

  // Disease mapping for colors and filters
  const diseaseMapping = {
    "All": { color: "#CCCCCC" },
    "Tungro": { color: "#000064" },
    "Rice Blast": { color: "#E80D0D" },
    "Leaf Blight": { color: "#FED402" }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    // Apply filters whenever search query or disease filter changes
    applyFilters();
  }, [searchQuery, selectedFilter, scanData]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/reports/rice-leaf-scans`,
        {
          headers: {
            'X-API-Key': AUTH_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        processReportData(response.data.data);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Network error or server unavailable");
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data) => {
    setScanData(data);
    setFilteredData(data);

    // Count occurrences of each disease type
    const diseaseCounts = data.reduce((acc, scan) => {
      const disease = scan.rice_leaf_disease;
      acc[disease] = (acc[disease] || 0) + 1;
      return acc;
    }, {});

    // Create chart data in the required format
    const formattedChartData = Object.entries(diseaseCounts).map(([disease, count]) => ({
      value: count,
      color: diseaseMapping[disease]?.color || "#CCCCCC",
      disease: disease
    }));

    setChartData(formattedChartData);
    setTotalScans(data.length);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    let results = [...scanData];
    if (selectedFilter !== "All") {
      results = results.filter(scan => 
        scan.rice_leaf_disease === selectedFilter
      );
    }
    
    // Apply search query filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(scan => {
        const userName = getUserName(scan).toLowerCase();
        const diseaseType = scan.rice_leaf_disease.toLowerCase();
        const date = formatDate(scan.created_at).toLowerCase();
        
        return (
          userName.includes(query) || 
          diseaseType.includes(query) || 
          date.includes(query)
        );
      });
    }
    
    setFilteredData(results);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("All");
    setFilteredData(scanData);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Get user's name from scan data, handling possible null values
  const getUserName = (scan) => {
    // If the backend doesn't include user information, provide a default
    if (!scan.firstname && !scan.lastname) {
      return `User ${scan.user_id || 'Unknown'}`;
    }
    return `${scan.firstname || ''} ${scan.lastname || ''}`.trim();
  };

  // Convert scan_image to image source for ReportCard
  const getImageSource = (scan) => {
    // Check if scan_image is a URL to cloud storage
    if (scan.scan_image &&
      (scan.scan_image.startsWith('https://') || scan.scan_image.startsWith('http://'))) {
      return { uri: scan.scan_image };
    }

    // Fallback to default images based on disease type
    const diseaseImageMap = {
      "Tungro": images.tungro,
      "Rice Blast": images.blast,
      "Leaf Blight": images.blight
    };

    return diseaseImageMap[scan.rice_leaf_disease] || images.default;
  };

  // Handle navigation to result screen
  const handleViewResult = (scan) => {
    console.log(`user id: `+user.id);
    router.push({
      pathname: "/view-treatments",
      params: {
        imageUri: scan.scan_image || null,
        disease: scan.rice_leaf_disease || "Unknown Disease",
        confidence: `${Math.round(scan.disease_confidence_score * 100)}%`,
        date: formatDate(scan.created_at),
        description: scan.disease_description || "No description available",
        treatments: scan.medicine_description || "No treatments available",
      }
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleScans = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={images.background_profile}
        className="flex-1 h-full w-full bg-white justify-center items-center"
      >
        <ActivityIndicator size="large" color="#000064" />
        <Text className="mt-4 font-pmedium">Loading reports...</Text>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground
        source={images.background_profile}
        className="flex-1 h-full w-full bg-white justify-center items-center"
      >
        <Text className="font-pmedium text-red-500">{error}</Text>
        <Text
          className="mt-4 text-blue-500 font-psemibold"
          onPress={fetchReports}
        >
          Try Again
        </Text>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={images.background_profile}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView className="flex-1">
        <SafeAreaView className="px-4 pt-10 pb-8">
          <View className="flex-row items-center w-full mb-3 mt-5">
            <Text className="font-pmedium text-3xl">Reports</Text>
          </View>

          {/* Search Box */}
          <View className="flex-row items-center mb-4 bg-white rounded-lg border border-gray-300 px-2">
            <Icon name="search" size={24} color="#666" />
            <TextInput
              className="flex-1 py-2 px-2 font-pregular"
              placeholder="Search by name, disease, or date..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Buttons */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="mb-4"
          >
            {Object.keys(diseaseMapping).map((disease) => (
              <TouchableOpacity
                key={disease}
                onPress={() => setSelectedFilter(disease)}
                className={`mr-2 px-3 py-1 rounded-full ${
                  selectedFilter === disease 
                    ? "bg-green-600" 
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-pmedium ${
                    selectedFilter === disease 
                      ? "text-white" 
                      : "text-gray-700"
                  }`}
                >
                  {disease}
                </Text>
              </TouchableOpacity>
            ))}
            
            {(searchQuery || selectedFilter !== "All") && (
              <TouchableOpacity
                onPress={clearFilters}
                className="mr-2 px-3 py-1 rounded-full border border-gray-300 bg-white"
              >
                <Text className="font-pmedium text-gray-700">Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Pie Chart */}
          <View className="w-full items-center mb-4">
            <PieChart
              donut
              innerRadius={50}
              data={chartData}
              radius={70}
              centerLabelComponent={() => (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                    {totalScans}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: "#555",
                    }}
                  >
                    Total Scans
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Disease Summary */}
          <View className="w-full bg-white-100 px-3 py-2 rounded-lg mb-4 border border-gray-400">
            <Text className="font-pbold mb-1">Disease Summary</Text>
            <Text className="text-sm" numberOfLines={1} ellipsizeMode="tail">
              <Text style={{ color: "#FED402" }}>● </Text>
              <Text style={{ fontSize: 14 }}>Leaf Blight: {chartData.find(item => item.disease === "Leaf Blight")?.value || 0}</Text>
              <Text style={{ color: "#E80D0D" }}>  ● </Text>
              <Text style={{ fontSize: 14 }}>Rice Blast: {chartData.find(item => item.disease === "Rice Blast")?.value || 0}</Text>
              <Text style={{ color: "#000064" }}>  ● </Text>
              <Text style={{ fontSize: 14 }}>Tungro: {chartData.find(item => item.disease === "Tungro")?.value || 0}</Text>
            </Text>
          </View>

          {/* Report Cards Section with Pagination */}
          <View className="w-full">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-pbold text-base">Scan Reports</Text>
              <Text className="font-pregular text-sm text-gray-600">
                {filteredData.length} {filteredData.length === 1 ? "result" : "results"}
              </Text>
            </View>

            {filteredData.length === 0 ? (
              <View className="py-8 items-center">
                <Icon name="search-off" size={48} color="#666" />
                <Text className="font-pmedium text-gray-500 mt-2">No results found</Text>
                <TouchableOpacity 
                  onPress={clearFilters}
                  className="mt-4 bg-green-600 px-4 py-2 rounded-lg"
                >
                  <Text className="font-pmedium text-white">Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {visibleScans.map((scan) => (
                  <TouchableOpacity 
                    key={scan.rice_leaf_scan_id} 
                    onPress={() => handleViewResult(scan)}
                    activeOpacity={0.7}
                  >
                    <ReportCard
                      disease={scan.rice_leaf_disease}
                      user={getUserName(scan)}
                      date={formatDate(scan.created_at)}
                      percent={Math.round(scan.disease_confidence_score * 100)}
                      color="bg-[#ADD8E6]"
                      image={getImageSource(scan)}
                    />
                  </TouchableOpacity>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View className="flex-row justify-between mt-3">
                    <TouchableOpacity
                      onPress={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${currentPage === 1 ? "bg-gray-300" : "bg-green-600"
                        }`}
                    >
                      <Text className={`font-psemibold text-sm ${currentPage === 1 ? "text-gray-500" : "text-white"
                        }`}>Prev</Text>
                    </TouchableOpacity>

                    <Text className="self-center font-pregular text-xs">
                      {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
                    </Text>

                    <TouchableOpacity
                      onPress={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded ${currentPage === totalPages ? "bg-gray-300" : "bg-green-600"
                        }`}
                    >
                      <Text className={`font-psemibold text-sm ${currentPage === totalPages ? "text-gray-500" : "text-white"
                        }`}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ImageBackground>
  );
};

export default ReportScreen;