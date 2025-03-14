import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ImageBackground,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { images } from "../../constants";
import axios from "axios";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';
import Icon from "react-native-vector-icons/MaterialIcons";

const API_URL = API_URL_BCNKEND;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  
  // Filter state
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states for age and gender
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState(null);
  
  // Collapsible filter state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  
  // Age range options
  const ageRanges = [
    { label: "18-30", min: 18, max: 30 },
    { label: "31-45", min: 31, max: 45 },
    { label: "46-60", min: 46, max: 60 },
    { label: "Over 60", min: 61, max: 120 }
  ];
  
  // Toggle filters visibility
  const toggleFilters = () => {
    const toValue = filtersExpanded ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setFiltersExpanded(!filtersExpanded);
  };
  
  // Calculate if any filters are active
  const hasActiveFilters = 
    sortBy !== "name" || 
    sortOrder !== "asc" || 
    searchQuery || 
    selectedGender || 
    selectedAgeRange;
  
  // Use debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);
    
    return () => clearTimeout(handler);
  }, [inputValue]);

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch users from the API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users/fetch-user`, {
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const processedUsers = response.data.data.map(user => ({
          ...user,
          age: calculateAge(user.birthdate),
          isNew: user.created_at ? 
            (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24) <= 7 : 
            false
        }));
        
        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Apply filters and search
  useEffect(() => {
    let result = [...users];
    
    // Apply search query
    if (searchQuery) {
      result = result.filter((user) =>
        `${user.firstname} ${user.lastname}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.mobile_number && 
          user.mobile_number.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply gender filter
    if (selectedGender) {
      result = result.filter(user => 
        user.gender && user.gender.toLowerCase() === selectedGender.toLowerCase()
      );
    }
    
    // Apply age filter
    if (selectedAgeRange) {
      result = result.filter(user => 
        user.age !== null && 
        user.age >= selectedAgeRange.min && 
        user.age <= selectedAgeRange.max
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "name") {
        const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
        const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "email") {
        comparison = a.email.toLowerCase().localeCompare(b.email.toLowerCase());
      } else if (sortBy === "age") {
        // Handle null values for sorting
        const ageA = a.age !== null ? a.age : -1;
        const ageB = b.age !== null ? b.age : -1;
        comparison = ageA - ageB;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchQuery, sortBy, sortOrder, selectedGender, selectedAgeRange]);

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleInputChange = (text) => setInputValue(text);

  const clearSearch = () => {
    setInputValue("");
    setSearchQuery("");
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const clearFilters = () => {
    setInputValue("");
    setSearchQuery("");
    setSortBy("name");
    setSortOrder("asc");
    setSelectedGender(null);
    setSelectedAgeRange(null);
    setFilteredUsers(users);
    setCurrentPage(1);
  };

  const renderItem = ({ item }) => {
    const defaultAvatar = images.Default_Profile;
    
    return (
      <View style={{
        flexDirection: 'column',
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(249, 249, 249, 0.95)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        width: '100%',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={item.profile_image ? { uri: item.profile_image } : defaultAvatar}
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: '#e1e1e1',
              borderWidth: 2,
              borderColor: '#fff',
              marginRight: 16
            }}
            defaultSource={defaultAvatar}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 6 }}>
              {item.firstname} {item.lastname}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
              {item.email}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
              {item.mobile_number || "No phone number"}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: 12,
                color: "white",
                backgroundColor: "#008000",
                marginRight: 6,
                marginBottom: 4
              }}>
                User
              </Text>
              
              {item.gender && (
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  color: "white",
                  backgroundColor: item.gender.toLowerCase() === "male" ? "#2196F3" : "#E91E63",
                  marginRight: 6,
                  marginBottom: 4
                }}>
                  {item.gender}
                </Text>
              )}
              
              {item.age !== null && (
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  color: "white",
                  backgroundColor: "#FF9800",
                  marginBottom: 4
                }}>
                  {item.age} years old
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ImageBackground source={images.background_history} style={{ flex: 1 }}>
        <SafeAreaView style={{ paddingHorizontal: 28, flex: 1 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 16, color: '#666' }}>
            Loading users...
          </Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground source={images.background_history} style={{ flex: 1 }}>
        <SafeAreaView style={{ paddingHorizontal: 28, flex: 1 }}>
          <Text style={{ textAlign: 'center', fontSize: 16, color: 'red', marginTop: 48 }}>
            {error}
          </Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={images.background_history} style={{ flex: 1 }}>
      <SafeAreaView style={{ paddingHorizontal: 28, flex: 1 }}>
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={currentUsers}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item.email || index.toString())}
          ListHeaderComponent={
            <View>
              <Text style={{ fontSize: 30, fontWeight: '600', marginBottom: 12 }}>Users</Text>
              
              {/* Search Box */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 44,
              }}>
                <Icon name="search" size={24} color="#666" />
                <TextInput
                  ref={searchInputRef}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    fontSize: 14,
                  }}
                  placeholder="Search by name, email, or phone..."
                  value={inputValue}
                  onChangeText={handleInputChange}
                />
                {inputValue && (
                  <TouchableOpacity onPress={clearSearch}>
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Filter Header with Active Filter indicators */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginVertical: 8
              }}>
                <TouchableOpacity 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: hasActiveFilters ? '#e6f7ff' : '#f5f5f5',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: hasActiveFilters ? '#91d5ff' : '#e0e0e0',
                  }}
                  onPress={toggleFilters}
                >
                  <Icon name="filter-list" size={20} color={hasActiveFilters ? "#1890ff" : "#666"} />
                  <Text style={{ 
                    marginLeft: 6, 
                    fontWeight: '500',
                    color: hasActiveFilters ? "#1890ff" : "#666"
                  }}>
                    Filters {hasActiveFilters ? `(${[
                      sortBy !== "name" || sortOrder !== "asc" ? 1 : 0,
                      selectedGender ? 1 : 0,
                      selectedAgeRange ? 1 : 0
                    ].reduce((a, b) => a + b, 0)})` : ""}
                  </Text>
                  <Icon 
                    name={filtersExpanded ? "expand-less" : "expand-more"} 
                    size={20} 
                    color={hasActiveFilters ? "#1890ff" : "#666"} 
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
                
                {hasActiveFilters && (
                  <TouchableOpacity 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                    onPress={clearFilters}
                  >
                    <Icon name="clear" size={16} color="#ff4d4f" />
                    <Text style={{ color: '#ff4d4f', marginLeft: 4, fontWeight: '500' }}>
                      Clear all
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap',
                  marginBottom: 12
                }}>
                  {sortBy !== "name" && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f0f0f0',
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 6
                    }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Sorted by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                      </Text>
                    </View>
                  )}
                  
                  {sortOrder !== "asc" && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f0f0f0',
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 6
                    }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Order: Descending
                      </Text>
                    </View>
                  )}
                  
                  {selectedGender && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f0f0f0',
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 6
                    }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Gender: {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}
                      </Text>
                    </View>
                  )}
                  
                  {selectedAgeRange && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f0f0f0',
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 6
                    }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Age: {selectedAgeRange.label}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Collapsible Filter Panel - MODIFIED TO COMPLETELY HIDE WHEN CLOSED */}
              {filtersExpanded && (
                <Animated.View 
                  style={{
                    overflow: 'hidden',
                    height: animatedHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 330] 
                    }),
                    backgroundColor: '#f9f9f9',
                    borderRadius: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                >
                  <View style={{ padding: 12 }}>
                    {/* Sort Options */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 6 }}>
                        Sort by:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <TouchableOpacity 
                          style={{
                            backgroundColor: sortBy === "name" ? '#228B22' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            marginBottom: 8
                          }}
                          onPress={() => setSortBy("name")}
                        >
                          <Text style={{ color: sortBy === "name" ? 'white' : '#333', fontWeight: '500' }}>Name</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={{
                            backgroundColor: sortBy === "email" ? '#228B22' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            marginBottom: 8
                          }}
                          onPress={() => setSortBy("email")}
                        >
                          <Text style={{ color: sortBy === "email" ? 'white' : '#333', fontWeight: '500' }}>Email</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={{
                            backgroundColor: sortBy === "age" ? '#228B22' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            marginBottom: 8
                          }}
                          onPress={() => setSortBy("age")}
                        >
                          <Text style={{ color: sortBy === "age" ? 'white' : '#333', fontWeight: '500' }}>Age</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 6, marginTop: 8 }}>
                        Order:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <TouchableOpacity 
                          style={{
                            backgroundColor: sortOrder === "asc" ? '#228B22' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={() => setSortOrder("asc")}
                        >
                          <Icon name="arrow-upward" size={16} color={sortOrder === "asc" ? 'white' : '#333'} />
                          <Text style={{ color: sortOrder === "asc" ? 'white' : '#333', fontWeight: '500', marginLeft: 4 }}>
                            Ascending
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={{
                            backgroundColor: sortOrder === "desc" ? '#228B22' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={() => setSortOrder("desc")}
                        >
                          <Icon name="arrow-downward" size={16} color={sortOrder === "desc" ? 'white' : '#333'} />
                          <Text style={{ color: sortOrder === "desc" ? 'white' : '#333', fontWeight: '500', marginLeft: 4 }}>
                            Descending
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Gender Filter */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 6 }}>
                        Filter by Gender:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <TouchableOpacity 
                          style={{
                            backgroundColor: selectedGender === "male" ? '#2196F3' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={() => setSelectedGender(selectedGender === "male" ? null : "male")}
                        >
                          <Icon name="person" size={16} color={selectedGender === "male" ? 'white' : '#333'} />
                          <Text style={{ color: selectedGender === "male" ? 'white' : '#333', fontWeight: '500', marginLeft: 4 }}>
                            Male
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={{
                            backgroundColor: selectedGender === "female" ? '#E91E63' : '#e0e0e0',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            marginRight: 8,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={() => setSelectedGender(selectedGender === "female" ? null : "female")}
                        >
                          <Icon name="person" size={16} color={selectedGender === "female" ? 'white' : '#333'} />
                          <Text style={{ color: selectedGender === "female" ? 'white' : '#333', fontWeight: '500', marginLeft: 4 }}>
                            Female
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Age Range Filter */}
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 6 }}>
                        Filter by Age:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {ageRanges.map((range) => (
                          <TouchableOpacity 
                            key={range.label}
                            style={{
                              backgroundColor: selectedAgeRange === range ? '#FF9800' : '#e0e0e0',
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 16,
                              marginRight: 8,
                              marginBottom: 8,
                              flexDirection: 'row',
                              alignItems: 'center'
                            }}
                            onPress={() => setSelectedAgeRange(selectedAgeRange === range ? null : range)}
                          >
                            <Text style={{ 
                              color: selectedAgeRange === range ? 'white' : '#333', 
                              fontWeight: '500'
                            }}>
                              {range.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}
              
              {filteredUsers.length > 0 && (
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                  Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                </Text>
              )}
            </View>
          }
          ListFooterComponent={
            filteredUsers.length > 0 ? (
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: 20,
                marginBottom: 30,
              }}>
                <TouchableOpacity 
                  style={{
                    backgroundColor: currentPage === 1 ? '#B8B8B8' : '#228B22',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    minWidth: 80,
                    alignItems: 'center',
                  }}
                  onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Prev</Text>
                </TouchableOpacity>
                
                <Text style={{ fontSize: 14, color: '#666' }}>
                  {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length}
                </Text>
                
                <TouchableOpacity 
                  style={{
                    backgroundColor: currentPage === totalPages ? '#B8B8B8' : '#228B22',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    minWidth: 80,
                    alignItems: 'center',
                  }}
                  onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 30 }}>
              <Icon name="search-off" size={48} color="#666" />
              <Text style={{ fontSize: 16, color: '#666', marginTop: 12, fontWeight: '500' }}>
                No users found
              </Text>
            </View>
          }
          style={{ marginTop: 48 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Users;