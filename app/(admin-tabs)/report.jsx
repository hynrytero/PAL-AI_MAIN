import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, ScrollView, ImageBackground, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from "react-native";
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
  const [selectedDateFilter, setSelectedDateFilter] = useState("All Time");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("All");
  const [activeFilterType, setActiveFilterType] = useState("disease"); // 'disease', 'date', 'severity'
  const ITEMS_PER_PAGE = 5;
  const [refreshing, setRefreshing] = useState(false);

  // Disease mapping for colors and filters
  const diseaseMapping = {
    "All": { color: "#CCCCCC" },
    "Possible Tungro": { color: "#008000" },
    "Rice Blast": { color: "#E80D0D" },
    "Leaf Blight": { color: "#FED402" }
  };

  // Date filter options
  const dateFilters = [
    "All Time",
    "Today",
    "This Week",
    "This Month",
    "This Year"
  ];

  // Severity level filter options
  const severityFilters = [
    "All",
    "Severe",
    "Moderate",
    "Mild"
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    // Apply filters whenever search query or any filter changes
    applyFilters();
  }, [searchQuery, selectedFilter, selectedDateFilter, selectedSeverityFilter, scanData]);

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
    // Deduplicate the data based on rice_leaf_scan_id and created_at
    const uniqueScans = data.reduce((acc, scan) => {
        const key = `${scan.rice_leaf_scan_id}-${scan.created_at}`;
        if (!acc[key]) {
            acc[key] = scan;
        }
        return acc;
    }, {});

    const deduplicatedData = Object.values(uniqueScans);
    setScanData(deduplicatedData);
    setFilteredData(deduplicatedData);

    // Count occurrences of each disease type
    const diseaseCounts = deduplicatedData.reduce((acc, scan) => {
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
    setTotalScans(deduplicatedData.length);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    let results = [...scanData];

    // Apply disease filter
    if (selectedFilter !== "All") {
      results = results.filter(scan =>
        scan.rice_leaf_disease === selectedFilter
      );
    }

    // Apply date filter
    if (selectedDateFilter !== "All Time") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      results = results.filter(scan => {
        const scanDate = new Date(scan.created_at);

        switch (selectedDateFilter) {
          case "Today":
            return scanDate >= today;
          case "This Week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return scanDate >= weekStart;
          case "This Month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return scanDate >= monthStart;
          case "This Year":
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return scanDate >= yearStart;
          default:
            return true;
        }
      });
    }

    // Apply severity filter
    if (selectedSeverityFilter !== "All") {
      results = results.filter(scan => {
        const disease = scan.rice_leaf_disease;
        switch (selectedSeverityFilter) {
          case "Severe":
            return disease === "Possible Tungro"; 
          case "Moderate":
            return disease === "Rice Blast"; 
          case "Mild":
            return disease === "Leaf Blight"; 
          default:
            return true;
        }
      });
    }

    // Apply search query filter 
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
    setSelectedDateFilter("All Time");
    setSelectedSeverityFilter("All");
    setFilteredData(scanData);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get user's name from scan databse
  const getUserName = (scan) => {
    if (!scan.firstname && !scan.lastname) {
      return `User ${scan.user_id || 'Unknown'}`;
    }
    return `${scan.firstname || ''} ${scan.lastname || ''}`.trim();
  };

  // Convert scan_image to image source for ReportCard
  const getImageSource = (scan) => {
    if (scan.scan_image &&
      (scan.scan_image.startsWith('https://') || scan.scan_image.startsWith('http://'))) {
      return { uri: scan.scan_image };
    }

    // Fallback images
    const diseaseImageMap = {
      "Tungro": images.tungro,
      "Rice Blast": images.blast,
      "Leaf Blight": images.blight
    };

    return diseaseImageMap[scan.rice_leaf_disease] || images.default;
  };

  // Handle navigation to result screen
  const handleViewResult = (scan) => {
    console.log(`user id: ` + user.id);
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

  // Check if any filters are active
  const hasActiveFilters = searchQuery ||
    selectedFilter !== "All" ||
    selectedDateFilter !== "All Time" ||
    selectedSeverityFilter !== "All";

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchReports().finally(() => {
      setRefreshing(false);
    });
  }, []);

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
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#000064"]}
            tintColor="#000064"
          />
        }
      >
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

          {/* Filter Type Selection */}
          <View className="flex-row mb-3">
            {["Disease", "Date", "Severity"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setActiveFilterType(type.toLowerCase())}
                className={`flex-1 h-9 py-2 mx-1 items-center rounded-full ${activeFilterType === type.toLowerCase() ? "bg-[#228B22]" : "bg-gray-200"
                  }`}
              >
                <Text
                  className={`font-pmedium ${activeFilterType === type.toLowerCase() ? "text-white" : "text-gray-700"
                    }`}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Filter Options */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {activeFilterType === "disease" && Object.keys(diseaseMapping).map((disease) => (
              <TouchableOpacity
                key={disease}
                onPress={() => setSelectedFilter(disease)}
                className={`mr-2 px-3 py-1 rounded-full ${selectedFilter === disease
                  ? "bg-green-600"
                  : "bg-gray-200"
                  }`}
              >
                <Text
                  className={`font-pmedium ${selectedFilter === disease
                    ? "text-white"
                    : "text-gray-700"
                    }`}
                >
                  {disease}
                </Text>
              </TouchableOpacity>
            ))}

            {activeFilterType === "date" && dateFilters.map((dateFilter) => (
              <TouchableOpacity
                key={dateFilter}
                onPress={() => setSelectedDateFilter(dateFilter)}
                className={`mr-2 px-3 py-1 rounded-full ${selectedDateFilter === dateFilter
                  ? "bg-green-600"
                  : "bg-gray-200"
                  }`}
              >
                <Text
                  className={`font-pmedium ${selectedDateFilter === dateFilter
                    ? "text-white"
                    : "text-gray-700"
                    }`}
                >
                  {dateFilter}
                </Text>
              </TouchableOpacity>
            ))}

            {activeFilterType === "severity" && severityFilters.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setSelectedSeverityFilter(level)}
                className={`mr-2 px-3 py-1 rounded-full ${selectedSeverityFilter === level
                  ? "bg-green-600"
                  : "bg-gray-200"
                  }`}
              >
                <Text
                  className={`font-pmedium ${selectedSeverityFilter === level
                    ? "text-white"
                    : "text-gray-700"
                    }`}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}{/* Clear Filters Button */}
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={clearFilters}
                className="mr-2 px-3 py-1 rounded-full border border-gray-300 bg-white"
              >
                <Text className="font-pmedium text-gray-700">Clear All</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <View className="mb-4 p-2 bg-white-100 rounded-lg border border-gray-300">
              <Text className="font-pmedium text-xs text-gray-700 mb-1">Active Filters:</Text>
              <View className="flex-row flex-wrap">
                {selectedFilter !== "All" && (
                  <View className="bg-green-100 mr-2 mb-1 px-2 py-1 rounded-full flex-row items-center">
                    <Text className="text-xs font-pmedium text-green-800">{selectedFilter}</Text>
                    <TouchableOpacity onPress={() => setSelectedFilter("All")}>
                      <Icon name="close" size={14} color="#166534" />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedDateFilter !== "All Time" && (
                  <View className="bg-blue-100 mr-2 mb-1 px-2 py-1 rounded-full flex-row items-center">
                    <Text className="text-xs font-pmedium text-blue-800">{selectedDateFilter}</Text>
                    <TouchableOpacity onPress={() => setSelectedDateFilter("All Time")}>
                      <Icon name="close" size={14} color="#1e40af" />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedSeverityFilter !== "All" && (
                  <View className="bg-purple-100 mr-2 mb-1 px-2 py-1 rounded-full flex-row items-center">
                    <Text className="text-xs font-pmedium text-purple-800">{selectedSeverityFilter}</Text>
                    <TouchableOpacity onPress={() => setSelectedSeverityFilter("All")}>
                      <Icon name="close" size={14} color="#6b21a8" />
                    </TouchableOpacity>
                  </View>
                )}

                {searchQuery && (
                  <View className="bg-gray-200 mr-2 mb-1 px-2 py-1 rounded-full flex-row items-center">
                    <Text className="text-xs font-pmedium text-gray-800">"{searchQuery}"</Text>
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Icon name="close" size={14} color="#374151" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

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
              <Text style={{ color: "#008000" }}>  ● </Text>
              <Text style={{ fontSize: 14 }}>Tungro: {chartData.find(item => item.disease === "Possible Tungro")?.value || 0}</Text>
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
                {visibleScans.map((scan, index) => (
                  <TouchableOpacity
                    key={`${scan.rice_leaf_scan_id}-${index}`}
                    onPress={() => handleViewResult(scan)}
                    activeOpacity={0.7}
                  >
                    <ReportCard
                      disease={scan.rice_leaf_disease}
                      user={getUserName(scan)}
                      date={formatDate(scan.created_at)}
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