import React, { useState, useEffect } from "react";
import { TouchableOpacity, TextInput, Alert, Platform, StyleSheet, Picker } from 'react-native';
import { router } from "expo-router";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Image,
} from "react-native";
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from "react-native-vector-icons/MaterialIcons";
import { images } from "../../constants";
import Feather from "react-native-vector-icons/Feather";
import { Button, Menu } from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';
import {
  getAllRegions,
  getProvincesByRegion,
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
} from "@aivangogh/ph-address";
import { Dropdown } from "react-native-element-dropdown";

const API_URL = API_URL_BCNKEND;

const Profile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    contactNumber: '',
    birthdate: '',
    gender: '',
    image: '',
    addressId: null,
    yearsExperience: null,
    region: '',
    province: '',
    city: '',
    barangay: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [contactNumber, setContactNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addressData, setAddressData] = useState({
    regions: [],
    provinces: [],
    cities: [],
    barangays: [],
  });

  const [isLoading, setIsLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false,
  });

  const [addressErrors, setAddressErrors] = useState({
    regions: "",
    provinces: "",
    cities: "",
    barangays: "",
  });

  const [imageMenuVisible, setImageMenuVisible] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setError(null);

      const response = await axios.get(`${API_URL}/profile/fetch-profile/${user.id}`, {
        headers: {
          'X-API-Key': AUTH_KEY,
        }
      });

      if (response.data.success) {
        const profileData = response.data.data;
        setUserData({
          ...profileData,
          region: profileData.address?.region || '',
          province: profileData.address?.province || '',
          city: profileData.address?.city || '',
          barangay: profileData.address?.barangay || ''
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile data');
      }
    } catch (error) {
      setError(error.message || 'Failed to load profile data');
      Alert.alert(
        'Error',
        error.message,
        [{ text: 'OK', onPress: () => setError(null) }]
      );
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    setFirstName(userData.firstname);
    setLastName(userData.lastname);
    setContactNumber(userData.contactNumber);
    setYearsExperience(userData.yearsExperience?.toString() || "");
    setRegion(userData.region || "");
    setProvince(userData.province || "");
    setCity(userData.city || "");
    setBarangay(userData.barangay || "");

    if (userData.birthdate) {
      setBirthDate(new Date(userData.birthdate));
    }
  }, [userData]);

  // Fetch regions on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchRegions = async () => {
      if (addressData.regions.length === 0) {
        try {
          setIsLoading(prev => ({ ...prev, regions: true }));
          setAddressErrors(prev => ({ ...prev, regions: "" }));
          const regionsData = getAllRegions();
          if (isMounted) {
            const formattedRegions = regionsData.map(region => ({
              label: region.name,
              value: region.name,
              code: region.psgcCode
            }));
            setAddressData(prev => ({ ...prev, regions: formattedRegions }));
          }
        } catch (error) {
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, regions: "Failed to load regions. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, regions: false }));
          }
        }
      }
    };

    fetchRegions();
    return () => {
      isMounted = false;
    };
  }, [addressData.regions.length]);

  // Update provinces when region changes
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      if (region && !addressData.provinces.some(p => p.code === region)) {
        try {
          setIsLoading(prev => ({ ...prev, provinces: true }));
          setAddressErrors(prev => ({ ...prev, provinces: "" }));
          const selectedRegion = addressData.regions.find(r => r.value === region);
          if (selectedRegion) {
            const regionCode = selectedRegion.code;
            const provincesData = getProvincesByRegion(regionCode);
            if (isMounted) {
              const formattedProvinces = provincesData.map(province => ({
                label: province.name,
                value: province.name,
                code: province.psgcCode
              }));
              setAddressData(prev => ({ ...prev, provinces: formattedProvinces }));

              // If this is a user-initiated change, reset the dependent fields
              if (region !== userData.region) {
                setProvince('');
                setCity('');
                setBarangay('');
              }
            }
          }
        } catch (error) {
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, provinces: "Failed to load provinces. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, provinces: false }));
          }
        }
      } else {
        setAddressData(prev => ({ ...prev, provinces: [] }));
      }
    };

    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, [region, addressData.regions]);

  // Update cities when province changes
  useEffect(() => {
    let isMounted = true;
    const fetchCities = async () => {
      if (province && !addressData.cities.some(c => c.code === province)) {
        try {
          setIsLoading(prev => ({ ...prev, cities: true }));
          setAddressErrors(prev => ({ ...prev, cities: "" }));
          const selectedProvince = addressData.provinces.find(p => p.value === province);
          if (selectedProvince) {
            const provinceCode = selectedProvince.code;
            const citiesData = getMunicipalitiesByProvince(provinceCode);
            if (isMounted) {
              const formattedCities = citiesData.map(city => ({
                label: city.name,
                value: city.name,
                code: city.psgcCode
              }));
              setAddressData(prev => ({ ...prev, cities: formattedCities }));

              // If this is a user-initiated change, reset the dependent fields
              if (province !== userData.province) {
                setCity('');
                setBarangay('');
              }
            }
          }
        } catch (error) {
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, cities: "Failed to load cities. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, cities: false }));
          }
        }
      } else {
        setAddressData(prev => ({ ...prev, cities: [] }));
      }
    };

    fetchCities();
    return () => {
      isMounted = false;
    };
  }, [province, addressData.provinces]);

  // Update barangays when city changes
  useEffect(() => {
    let isMounted = true;
    const fetchBarangays = async () => {
      if (city && !addressData.barangays.some(b => b.code === city)) {
        try {
          setIsLoading(prev => ({ ...prev, barangays: true }));
          setAddressErrors(prev => ({ ...prev, barangays: "" }));
          const selectedCity = addressData.cities.find(c => c.value === city);
          if (selectedCity) {
            const cityCode = selectedCity.code;
            const barangaysData = getBarangaysByMunicipality(cityCode);
            if (isMounted) {
              const formattedBarangays = barangaysData.map(barangay => ({
                label: barangay.name,
                value: barangay.name,
                code: barangay.psgcCode
              }));
              setAddressData(prev => ({ ...prev, barangays: formattedBarangays }));

              // If this is a user-initiated change, reset the dependent field
              if (city !== userData.city) {
                setBarangay('');
              }
            }
          }
        } catch (error) {
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, barangays: "Failed to load barangays. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, barangays: false }));
          }
        }
      } else {
        setAddressData(prev => ({ ...prev, barangays: [] }));
      }
    };

    fetchBarangays();
    return () => {
      isMounted = false;
    };
  }, [city, addressData.cities]);

  const formatDateForServer = (date) => {
    const d = new Date(date);
    const timezoneOffset = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() + timezoneOffset);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateAddress = () => {
    if (!region || !province || !city || !barangay) {
      Alert.alert("Error", "Please complete all address fields");
      return false;
    }
    return true;
  };

  const handleApplyChanges = () => {
    if (!validateAddress()) return;

    Alert.alert(
      "Confirm Changes",
      "Are you sure you want to apply these changes?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              let imageUrl = userData.image;

              if (profileImage && profileImage !== userData.image) {
                const formData = new FormData();
                formData.append('image', {
                  uri: profileImage,
                  type: 'image/jpeg',
                  name: 'profile.jpg'
                });

                const uploadResponse = await fetch(`${API_URL}/profile/upload-profile`, {
                  method: 'POST',
                  headers: {
                    'X-API-Key': AUTH_KEY,
                  },
                  body: formData,
                });

                if (!uploadResponse.ok) {
                  throw new Error('Failed to upload image');
                }

                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.imageUrl;
              }

              const updatedProfile = {
                userId: user.id,
                firstname: firstName,
                lastname: lastName,
                birthdate: formatDateForServer(birthDate),
                contactNumber: contactNumber,
                image: imageUrl,
                addressId: userData.addressId,
                yearsExperience: parseInt(yearsExperience) || null,
                region: region,
                province: province,
                city: city,
                barangay: barangay
              };

              const updateResponse = await axios.put(
                `${API_URL}/profile/update`,
                updatedProfile,
                {
                  headers: {
                    'X-API-Key': AUTH_KEY,
                  }
                }
              );

              if (updateResponse.data.success) {
                // Update the userData state with new address information
                setUserData(prev => ({
                  ...prev,
                  region: region,
                  province: province,
                  city: city,
                  barangay: barangay
                }));

                Alert.alert(
                  "Success",
                  "Profile updated successfully",
                  [
                    {
                      text: "OK",
                      onPress: () => router.back()
                    }
                  ]
                );
              } else {
                throw new Error(updateResponse.data.message || 'Failed to update profile');
              }
            } catch (error) {
              let errorMessage = "Failed to update profile";
              if (error.response?.data?.message?.includes('address')) {
                errorMessage = "Failed to update address. Please try again.";
              }
              Alert.alert("Error", errorMessage, [{ text: "OK" }]);
            }
          }
        }
      ]
    );
  };

  // Camera capture function
  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Image picker function for gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthDate(currentDate);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ImageBackground
      source={images.background_profile}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView className="mt-10">
        <SafeAreaView className="px-6 w-full h-full mb-12">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Feather name="chevron-left" size={36} color="black" onPress={handleBack} />
            <Text className="font-bold text-[28px] ml-3 text-gray-800">Edit Profile</Text>
          </View>

          {/* Profile Picture */}
          <View className="items-center mb-8">
            <Menu
              visible={imageMenuVisible}
              onDismiss={() => setImageMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setImageMenuVisible(true)} className="relative">
                  <Image
                    source={
                      profileImage
                        ? { uri: profileImage }
                        : userData.image
                          ? { uri: userData.image }
                          : images.Default_Profile
                    }
                    resizeMode="cover"
                    className="w-[140px] h-[140px] rounded-full border-4 border-gray-300 shadow-md"
                  />
                  <View className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-2">
                    <Icon name="camera-alt" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              }
              contentStyle={{
                marginTop: 150,
                marginLeft: -80,
                width: 180,
                paddingVertical: 4,
                backgroundColor: 'white',
                borderRadius: 8,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              <Menu.Item
                title="Take Photo"
                leadingIcon="camera"
                onPress={() => {
                  setImageMenuVisible(false);
                  takePhoto();
                }}
                titleStyle={{ fontSize: 13 }}
              />
              <Menu.Item
                title="Choose from Gallery"
                leadingIcon="image-multiple"
                onPress={() => {
                  setImageMenuVisible(false);
                  pickImage();
                }}
                titleStyle={{ fontSize: 13 }}
              />
              {profileImage && (
                <Menu.Item
                  title="Remove Photo"
                  leadingIcon="delete"
                  onPress={() => {
                    setImageMenuVisible(false);
                    setProfileImage(null);
                  }}
                  titleStyle={{ fontSize: 13 }}
                />
              )}
            </Menu>
            <Text className="text-2xl font-semibold text-gray-900 mt-4">
              {userData.firstname}
            </Text>
          </View>

          {/* About Section */}
          <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
            <Text className="text-xl font-semibold text-gray-800 mb-2">About</Text>

            {/* First and Last Name */}
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="text-base text-gray-700">First Name</Text>
                <TextInput
                  className="border border-gray-400 rounded-md p-1 pl-3 mt-2 text-sm text-gray-800"
                  placeholder="Firstname"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View className="w-[48%]">
                <Text className="text-base text-gray-700">Last Name</Text>
                <TextInput
                  className="border border-gray-400 rounded-md p-1 pl-3 mt-2 text-sm text-gray-800"
                  placeholder="Lastname"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Birth Date */}
            <View className="mb-4">
              <Text className="text-base text-gray-700">Birth Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <TextInput
                  className="border border-gray-400 rounded-md p-1 pl-3 mt-2 text-sm text-gray-800"
                  placeholder="Birth Date"
                  placeholderTextColor="#9ca3af"
                  value={birthDate ? birthDate.toISOString().split('T')[0] : ""}
                  editable={false}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthDate || new Date()}
                  mode="date"
                  display="default"
                  timeZoneOffsetInMinutes={0}
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Contact Number */}
            <View className="mb-2">
              <Text className="text-base text-gray-700">Contact Number</Text>
              <TextInput
                className="border border-gray-400 rounded-md p-1 pl-3 mt-2 text-sm text-gray-800"
                placeholder="Contact Number"
                placeholderTextColor="#9ca3af"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="numeric"
              />
            </View>

            {/* Years of Experience */}
            <View className="mb-4">
              <Text className="text-base text-gray-700">Years of Experience</Text>
              <TextInput
                className="border border-gray-400 rounded-md p-1 pl-3 mt-2 text-sm text-gray-800"
                placeholder="Years of Experience"
                placeholderTextColor="#9ca3af"
                value={yearsExperience}
                onChangeText={setYearsExperience}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Address Information */}
          <View className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <Text className="text-xl font-semibold text-gray-800 mb-2">Address</Text>

            <View className="mb-2">
              <Text className="text-base text-gray-600">Region</Text>
              <View className="border border-gray-400 rounded-md p-2 mt-1">
                <Dropdown
                  style={{ flex: 1 }}
                  placeholderStyle={{ fontSize: 14 }}
                  selectedTextStyle={{ fontSize: 14 }}
                  inputSearchStyle={{ fontSize: 14 }}
                  iconStyle={{ marginRight: 8 }}
                  data={addressData.regions}
                  labelField="label"
                  valueField="value"
                  placeholder={isLoading.regions ? "Loading..." : "Select Region"}
                  value={region}
                  onChange={(item) => setRegion(item.value)}
                  disable={isLoading.regions}
                  loading={isLoading.regions}
                  errorMessage={addressErrors.regions}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-base text-gray-600">Province</Text>
              <View className="border border-gray-400 rounded-md p-2 mt-1">
                <Dropdown
                  style={{ flex: 1 }}
                  placeholderStyle={{ fontSize: 14 }}
                  selectedTextStyle={{ fontSize: 14 }}
                  inputSearchStyle={{ fontSize: 14 }}
                  iconStyle={{ marginRight: 8 }}
                  data={addressData.provinces}
                  labelField="label"
                  valueField="value"
                  placeholder={isLoading.provinces ? "Loading..." : "Select Province"}
                  value={province}
                  onChange={(item) => setProvince(item.value)}
                  disabled={!region || isLoading.provinces}
                  loading={isLoading.provinces}
                  errorMessage={addressErrors.provinces}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-base text-gray-600">City</Text>
              <View className="border border-gray-400 rounded-md p-2 mt-1">
                <Dropdown
                  style={{ flex: 1 }}
                  placeholderStyle={{ fontSize: 14 }}
                  selectedTextStyle={{ fontSize: 14 }}
                  inputSearchStyle={{ fontSize: 14 }}
                  iconStyle={{ marginRight: 8 }}
                  data={addressData.cities}
                  labelField="label"
                  valueField="value"
                  placeholder={isLoading.cities ? "Loading..." : "Select City"}
                  value={city}
                  onChange={(item) => setCity(item.value)}
                  disabled={!province || isLoading.cities}
                  loading={isLoading.cities}
                  errorMessage={addressErrors.cities}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-base text-gray-600">Barangay</Text>
              <View className="border border-gray-400 rounded-md p-2 mt-1">
                <Dropdown
                  style={{ flex: 1 }}
                  placeholderStyle={{ fontSize: 14 }}
                  selectedTextStyle={{ fontSize: 14 }}
                  inputSearchStyle={{ fontSize: 14 }}
                  iconStyle={{ marginRight: 8 }}
                  data={addressData.barangays}
                  labelField="label"
                  valueField="value"
                  placeholder={isLoading.barangays ? "Loading..." : "Select Barangay"}
                  value={barangay}
                  onChange={(item) => setBarangay(item.value)}
                  disabled={!city || isLoading.barangays}
                  loading={isLoading.barangays}
                  errorMessage={addressErrors.barangays}
                />
              </View>
            </View>
          </View>

        {/* Apply Changes Button */}
        <View className="mt-6">
          <Button
            mode="contained"
            style={{ borderRadius: 8, backgroundColor: "forestgreen" }}
            contentStyle={{ paddingVertical: 10 }}
            labelStyle={{ fontSize: 16, fontWeight: "bold" }}
            onPress={handleApplyChanges}
          >
            {"Apply Changes"}
          </Button>
        </View>
      </SafeAreaView>
    </ScrollView>
    </ImageBackground >
  );
};

const styles = StyleSheet.create({
  profileImageContainer: {
    position: 'relative',
    width: 150,
    height: 150,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default Profile;