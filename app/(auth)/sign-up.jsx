import {
  View,
  Text,
  Image,
  ImageBackground,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import axios from "axios";
import { Checkbox, TextInput } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';
import {
  getAllRegions,
  getProvincesByRegion,
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
} from "@aivangogh/ph-address";
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = API_URL_BCNKEND;
const { width, height } = Dimensions.get('window');

const SignUp = () => {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    birthdate: "",
    email: "",
    mobilenumber: "",
    username: "",
    password: "",
    confirmpassword: "",
    yearsOfExperience: "",
    streetAddress: "",
    region: "",
    regionCode: "",
    province: "",
    provinceCode: "",
    city: "",
    cityCode: "",
    barangay: "",
  });

  const [addressData, setAddressData] = useState({
    regions: [],
    provinces: [],
    cities: [],
    barangays: [],
  });

  const [isLoading, setIsLoading] = useState({
    regions: true,
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

  const [isFormValid, setIsFormValid] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
          console.error("Error fetching regions:", error);
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
      if (form.region && !addressData.provinces.some(p => p.code === form.regionCode)) {
        try {
          setIsLoading(prev => ({ ...prev, provinces: true }));
          setAddressErrors(prev => ({ ...prev, provinces: "" }));
          const selectedRegion = addressData.regions.find(r => r.value === form.region);
          if (selectedRegion) {
            const regionCode = selectedRegion.code;
            if (isMounted) {
              setForm(prev => ({ ...prev, regionCode }));
            }

            const provincesData = getProvincesByRegion(regionCode);
            if (isMounted) {
              const formattedProvinces = provincesData.map(province => ({
                label: province.name,
                value: province.name,
                code: province.psgcCode
              }));
              setAddressData(prev => ({ ...prev, provinces: formattedProvinces }));
              setForm(prev => ({ ...prev, province: "", provinceCode: "", city: "", cityCode: "", barangay: "" }));
            }
          }
        } catch (error) {
          console.error("Error fetching provinces:", error);
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, provinces: "Failed to load provinces. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, provinces: false }));
          }
        }
      } else if (!form.region) {
        setAddressData(prev => ({ ...prev, provinces: [] }));
      }
    };

    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, [form.region]);

  // Update cities when province changes
  useEffect(() => {
    let isMounted = true;
    const fetchCities = async () => {
      if (form.province && !addressData.cities.some(c => c.code === form.provinceCode)) {
        try {
          setIsLoading(prev => ({ ...prev, cities: true }));
          setAddressErrors(prev => ({ ...prev, cities: "" }));
          const selectedProvince = addressData.provinces.find(p => p.value === form.province);
          if (selectedProvince) {
            const provinceCode = selectedProvince.code;
            if (isMounted) {
              setForm(prev => ({ ...prev, provinceCode }));
            }

            const citiesData = getMunicipalitiesByProvince(provinceCode);
            if (isMounted) {
              const formattedCities = citiesData.map(city => ({
                label: city.name,
                value: city.name,
                code: city.psgcCode
              }));
              setAddressData(prev => ({ ...prev, cities: formattedCities }));
              setForm(prev => ({ ...prev, city: "", cityCode: "", barangay: "" }));
            }
          }
        } catch (error) {
          console.error("Error fetching cities:", error);
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, cities: "Failed to load cities. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, cities: false }));
          }
        }
      } else if (!form.province) {
        setAddressData(prev => ({ ...prev, cities: [] }));
      }
    };

    fetchCities();
    return () => {
      isMounted = false;
    };
  }, [form.province]);

  // Update barangays when city changes
  useEffect(() => {
    let isMounted = true;
    const fetchBarangays = async () => {
      if (form.city && !addressData.barangays.some(b => b.code === form.cityCode)) {
        try {
          setIsLoading(prev => ({ ...prev, barangays: true }));
          setAddressErrors(prev => ({ ...prev, barangays: "" }));
          const selectedCity = addressData.cities.find(c => c.value === form.city);
          if (selectedCity) {
            const cityCode = selectedCity.code;
            if (isMounted) {
              setForm(prev => ({ ...prev, cityCode }));
            }

            const barangaysData = getBarangaysByMunicipality(cityCode);
            if (isMounted) {
              const formattedBarangays = barangaysData.map(barangay => ({
                label: barangay.name,
                value: barangay.name,
                code: barangay.psgcCode
              }));
              setAddressData(prev => ({ ...prev, barangays: formattedBarangays }));
              setForm(prev => ({ ...prev, barangay: "" }));
            }
          }
        } catch (error) {
          console.error("Error fetching barangays:", error);
          if (isMounted) {
            setAddressErrors(prev => ({ ...prev, barangays: "Failed to load barangays. Please try again." }));
          }
        } finally {
          if (isMounted) {
            setIsLoading(prev => ({ ...prev, barangays: false }));
          }
        }
      } else if (!form.city) {
        setAddressData(prev => ({ ...prev, barangays: [] }));
      }
    };

    fetchBarangays();
    return () => {
      isMounted = false;
    };
  }, [form.city]);

  const data = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const [expanded, setExpanded] = React.useState(true);
  const handlePress = () => setExpanded(!expanded);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [conPasswordVisible, setConPasswordVisible] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const togglePasswordVisibility = () => setSecureText(!secureText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGender, setSelectedGender] = useState(null);
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // for form handling
  const [error, setError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [birthdateError, setBirthdateError] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [yearsOfExperienceError, setYearsOfExperienceError] = useState("");

  // Form Content Validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobileNumber = (number) => {
    const mobileRegex = /^09\d{9}$/;
    return mobileRegex.test(number);
  };

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\W]{8,}$/;
    return passwordRegex.test(password);
  };

  const validatePasswordIdentity = (Password) => {
    return Password === form.confirmpassword;
  };

  const validateConfirmPassword = (confirmPassword) => {
    return confirmPassword === form.password;
  };

  const validateBirthdate = (birthdate) => {
    // Check if the date format is MM/DD/YYYY
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateRegex.test(birthdate)) return false;

    // Convert string to Date object
    const [month, day, year] = birthdate.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    // Check if it's a valid date (e.g., not 02/31/2024)
    if (date.getMonth() !== month - 1) return false;

    // Check if the date is not in the future
    const today = new Date();
    if (date > today) return false;

    // Check if the person is at least 18 years old
    const minAge = 18;
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - minAge);
    return date <= minDate;
  };

  const validateText = (name) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name);
  };

  const validateYearsOfExperience = (years) => {
    const yearsNum = parseInt(years);
    return !isNaN(yearsNum) && yearsNum >= 0;
  };

  // Separate useEffect for form validation
  useEffect(() => {
    const validateForm = () => {
      const isValid = 
        form.firstname.trim() !== "" &&
        form.lastname.trim() !== "" &&
        validateText(form.firstname) &&
        validateText(form.lastname) &&
        validateText(form.username) &&
        validateBirthdate(form.birthdate) &&
        validateEmail(form.email) &&
        validateMobileNumber(form.mobilenumber) &&
        form.username.trim() !== "" &&
        validatePassword(form.password) &&
        form.password === form.confirmpassword &&
        validateYearsOfExperience(form.yearsOfExperience) &&
        form.region !== "" &&
        form.province !== "" &&
        form.city !== "" &&
        form.barangay !== "" &&
        isChecked;

      setIsFormValid(isValid);
    };

    validateForm();
  }, [form, isChecked]);

  // Simplified form update function
  const updateForm = (updates) => {
    setForm(prev => {
      const newForm = { ...prev, ...updates };
      return newForm;
    });
  };

  // Update form handlers to use batched updates
  const handleChangeFirstName = (e) => {
    updateForm({ firstname: e });
    if (!validateText(e)) {
      setFirstNameError("Firstname can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setFirstNameError("");
    }
  };

  const handleChangeLastName = (e) => {
    updateForm({ lastname: e });
    if (!validateText(e)) {
      setLastNameError("Lastname can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setLastNameError("");
    }
  };

  const handleChangeUsername = (e) => {
    updateForm({ username: e });
    if (!validateText(e)) {
      setUsernameError("Username can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setUsernameError("");
    }
  };

  const handleChangeEmail = (e) => {
    updateForm({ email: e });
    if (!validateEmail(e)) {
      setError("Invalid email format");
    } else {
      setError("");
    }
  };

  const handleChangeMobile = (e) => {
    if (/^\d*$/.test(e) && e.length <= 11) {
      updateForm({ mobilenumber: e });
      if (!validateMobileNumber(e)) {
        setMobileError("Invalid mobile number.");
      } else {
        setMobileError("");
      }
    }
  };

  const handleChangePassword = (e) => {
    updateForm({ password: e });
    if (!validatePassword(e)) {
      setPasswordError(
        "Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character."
      );
    } else {
      setPasswordError("");
    }
    if (!validatePasswordIdentity(e) && form.confirmpassword !== "") {
      setConfirmPasswordError("Password doesn't match.");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPassword = (e) => {
    updateForm({ confirmpassword: e });
    if (!validateConfirmPassword(e)) {
      setConfirmPasswordError("Password doesn't match.");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleChangeYearsOfExperience = (e) => {
    if (e.length <= 2) {
      updateForm({ yearsOfExperience: e });
      const num = parseInt(e);
      if (isNaN(num) || num < 0) {
        setYearsOfExperienceError("Please enter a valid number");
      } else {
        setYearsOfExperienceError("");
      }
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    
    // Format the date as MM/DD/YYYY
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    
    updateForm({ birthdate: formattedDate });
    
    if (formattedDate.length === 10) {
      if (!validateBirthdate(formattedDate)) {
        setBirthdateError("Invalid birthdate. Must be at least 18 years old.");
      } else {
        setBirthdateError("");
      }
    }
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/signup/pre-signup`,
        {
          username: form.username,
          email: form.email,
          password: form.password,
          firstname: form.firstname,
          lastname: form.lastname,
          birthdate: form.birthdate,
          gender: selectedGender,
          mobilenumber: form.mobilenumber,
          yearsOfExperience: form.yearsOfExperience,
          region: form.region,
          province: form.province,
          city: form.city,
          barangay: form.barangay,
        },
        {
          headers: {
            'X-API-Key': AUTH_KEY
          }
        }
      );

      router.push({
        pathname: "/sign-up-otp",
        params: { email: form.email },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{
      flex: 1,
    }}>
      <ImageBackground
        source={images.background_signup}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingVertical: height * 0.04,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{
              width: '100%',
              paddingHorizontal: width * 0.05,
              maxWidth: 500,
              alignSelf: 'center',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: height * 0.01,
                marginTop: height * 0.03,
              }}>
                <Image
                  source={images.logo}
                  resizeMode="contain"
                  style={{
                    width: width * 0.3,
                    height: width * 0.3,
                    maxWidth: 100,
                    maxHeight: 100,
                    marginRight: 10,
                  }}
                />
                <Text style={{
                  fontSize: Math.min(width * 0.06, 28),
                  fontWeight: '700',
                }}>PAL-AI</Text>
              </View>
              <Text style={{
                fontSize: Math.min(width * 0.8, 28),
                fontWeight: '600',
                marginBottom: 2,
              }}>Sign-Up</Text>
              <Text style={{
                fontSize: Math.min(width * 0.04, 18),
                marginBottom: height * 0.02,
              }}>Please enter the details.</Text>

              <Text style={{
                fontSize: Math.min(width * 0.045, 18),
                fontWeight: '600',
                marginTop: 5,
                marginBottom: 5,
              }}>User Information</Text>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>

                <TextInput
                  label="First Name"
                  value={form.firstname}
                  onChangeText={handleChangeFirstName}
                  style={{ width: '48%' }}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  dense={width < 360}
                  error={!!firstNameError}
                />
                <TextInput
                  label="Last Name"
                  value={form.lastname}
                  onChangeText={handleChangeLastName}
                  style={{ width: '48%' }}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  dense={width < 360}
                  error={!!lastNameError}
                />
              </View>

              {firstNameError && form.firstname.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{firstNameError}</Text>
              )}

              {lastNameError && form.lastname.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{lastNameError}</Text>
              )}

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  style={{ width: '48%' }}
                >
                  <TextInput
                    label="Birthdate"
                    value={form.birthdate}
                    editable={false}
                    style={{ width: '100%' }}
                    mode="outlined"
                    activeOutlineColor="#006400"
                    outlineColor="#CBD2E0"
                    textColor="#2D3648"
                    error={!!birthdateError}
                    dense={width < 360}
                  />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <View style={{
                  width: '48%',
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#CBD2E0',
                  borderRadius: 5,
                  padding: 8,
                  justifyContent: 'center',
                  height: width < 360 ? 48 : 56,
                }}>
                  <Dropdown
                    style={{ flex: 1 }}
                    placeholderStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    selectedTextStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    inputSearchStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    iconStyle={{ marginRight: 8 }}
                    data={data}
                    labelField="label"
                    valueField="value"
                    placeholder="Gender"
                    value={selectedGender}
                    onChange={(item) => {
                      setSelectedGender(item.value);
                      setValue(item.value);
                    }}
                  />
                </View>
              </View>

              {birthdateError && form.birthdate.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{birthdateError}</Text>
              )}

              <TextInput
                label="Email"
                value={form.email}
                onChangeText={handleChangeEmail}
                style={{ width: '100%', marginBottom: 8 }}
                mode="outlined"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                error={!!error}
                dense={width < 360}
              />

              {error && form.email.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{error}</Text>
              )}

              <TextInput
                label="Mobile Number"
                value={form.mobilenumber}
                keyboardType="numeric"
                onChangeText={handleChangeMobile}
                style={{ width: '100%', marginBottom: 8 }}
                mode="outlined"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                error={!!mobileError}
                dense={width < 360}
              />

              {mobileError && form.mobilenumber.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{mobileError}</Text>
              )}

              <TextInput
                label="Username"
                value={form.username}
                onChangeText={handleChangeUsername}
                style={{ width: '100%', marginBottom: 8 }}
                mode="outlined"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                error={!!usernameError}
                dense={width < 360}
              />

              {usernameError && form.username.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{usernameError}</Text>
              )}

              <TextInput
                label="Years of Farming Experience"
                value={form.yearsOfExperience}
                onChangeText={handleChangeYearsOfExperience}
                keyboardType="numeric"
                style={{ width: '100%', marginBottom: 8 }}
                mode="outlined"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                error={!!yearsOfExperienceError}
                dense={width < 360}
              />

              {yearsOfExperienceError && form.yearsOfExperience.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{yearsOfExperienceError}</Text>
              )}

              <Text style={{
                fontSize: Math.min(width * 0.045, 18),
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 12,
              }}>Address Information</Text>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <View style={{
                  width: '48%',
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#CBD2E0',
                  borderRadius: 5,
                  padding: 8,
                  justifyContent: 'center',
                  height: width < 360 ? 48 : 56,
                }}>
                  <Dropdown
                    style={{ flex: 1 }}
                    placeholderStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    selectedTextStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    inputSearchStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    iconStyle={{ marginRight: 8 }}
                    data={addressData.regions}
                    labelField="label"
                    valueField="value"
                    placeholder={isLoading.regions ? "Loading..." : "Region"}
                    value={form.region}
                    onChange={(item) => {
                      setForm({ ...form, region: item.value, regionCode: item.code, province: "", provinceCode: "", city: "" });
                    }}
                    disable={isLoading.regions}
                    loading={isLoading.regions}
                    errorMessage={addressErrors.regions}
                  />
                </View>

                <View style={{
                  width: '48%',
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#CBD2E0',
                  borderRadius: 5,
                  padding: 8,
                  justifyContent: 'center',
                  height: width < 360 ? 48 : 56,
                }}>
                  <Dropdown
                    style={{ flex: 1 }}
                    placeholderStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    selectedTextStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    inputSearchStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    iconStyle={{ marginRight: 8 }}
                    data={addressData.provinces}
                    labelField="label"
                    valueField="value"
                    placeholder={isLoading.provinces ? "Loading..." : "Province"}
                    value={form.province}
                    onChange={(item) => {
                      setForm({ ...form, province: item.value, provinceCode: item.code, city: "" });
                    }}
                    disabled={!form.region || isLoading.provinces}
                    loading={isLoading.provinces}
                    errorMessage={addressErrors.provinces}
                  />
                </View>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <View style={{
                  width: '48%',
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#CBD2E0',
                  borderRadius: 5,
                  padding: 8,
                  justifyContent: 'center',
                  height: width < 360 ? 48 : 56,
                }}>
                  <Dropdown
                    style={{ flex: 1 }}
                    placeholderStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    selectedTextStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    inputSearchStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    iconStyle={{ marginRight: 8 }}
                    data={addressData.cities}
                    labelField="label"
                    valueField="value"
                    placeholder={isLoading.cities ? "Loading..." : "City/Municipality"}
                    value={form.city}
                    onChange={(item) => {
                      setForm({ ...form, city: item.value, cityCode: item.code });
                    }}
                    disabled={!form.province || isLoading.cities}
                    loading={isLoading.cities}
                    errorMessage={addressErrors.cities}
                  />
                </View>

                <View style={{
                  width: '48%',
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#CBD2E0',
                  borderRadius: 5,
                  padding: 8,
                  justifyContent: 'center',
                  height: width < 360 ? 48 : 56,
                }}>
                  <Dropdown
                    style={{ flex: 1 }}
                    placeholderStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    selectedTextStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    inputSearchStyle={{ fontSize: Math.min(width * 0.035, 16) }}
                    iconStyle={{ marginRight: 8 }}
                    data={addressData.barangays}
                    labelField="label"
                    valueField="value"
                    placeholder={isLoading.barangays ? "Loading..." : "Barangay"}
                    value={form.barangay}
                    onChange={(item) => {
                      setForm({ ...form, barangay: item.value });
                    }}
                    disabled={!form.city || isLoading.barangays}
                    loading={isLoading.barangays}
                    errorMessage={addressErrors.barangays}
                  />
                </View>
              </View>

              <Text style={{
                fontSize: Math.min(width * 0.045, 18),
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 5,
              }}>User Password</Text>

              <TextInput
                label="Password"
                value={form.password}
                onChangeText={handleChangePassword}
                secureTextEntry={!passwordVisible}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? "eye-off" : "eye"}
                    color="#006400"
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
                style={{ width: '100%', marginBottom: 8 }}
                mode="outlined"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                error={!!passwordError}
                dense={width < 360}
              />

              {passwordError && form.password.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{passwordError}</Text>
              )}

              <TextInput
                label="Confirm Password"
                value={form.confirmpassword}
                onChangeText={handleConfirmPassword}
                secureTextEntry={!conPasswordVisible}
                right={
                  <TextInput.Icon
                    icon={conPasswordVisible ? "eye-off" : "eye"}
                    color="#006400"
                    onPress={() => setConPasswordVisible(!conPasswordVisible)}
                  />
                }
                style={{ width: '100%', marginBottom: 20 }}
                mode="outlined"
                activeOutlineColor="#006400"
                outlineColor="#CBD2E0"
                textColor="#2D3648"
                error={!!confirmPasswordError}
                dense={width < 360}
              />

              {confirmPasswordError && form.confirmpassword.length > 0 && (
                <Text style={{
                  color: 'red',
                  fontSize: Math.min(width * 0.03, 14),
                  marginBottom: 8,
                }}>{confirmPasswordError}</Text>
              )}

              <View style={{
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Checkbox
                  status={isChecked ? "checked" : "unchecked"}
                  onPress={() => setIsChecked(!isChecked)}
                  color="#006400"
                />
                <Text style={{
                  marginLeft: 8,
                  fontSize: Math.min(width * 0.035, 16),
                }}>
                  I agree to the{" "}
                  <Link
                    href="/terms-and-condition"
                    style={{
                      color: '#006400',
                      fontWeight: '500',
                    }}
                  >
                    Terms and Conditions
                  </Link>
                </Text>
              </View>

              <CustomButton
                title="Sign Up"
                handlePress={handleSignUp}
                containerStyles={{
                  width: '100%',
                  marginTop: height * 0.03,
                  height: Math.min(height * 0.06, 50),
                }}
                isLoading={isSubmitting}
                disabled={!isFormValid}
              />

              <View style={{
                alignItems: 'center',
                marginTop: height * 0.02,
              }}>
                <Text style={{
                  fontSize: Math.min(width * 0.035, 16),
                  color: '#4B4B4B',
                }}>
                  Already a user?{" "}
                  <Link
                    href="/sign-in"
                    style={{
                      fontWeight: '600',
                      color: '#006400',
                    }}
                  >
                    Log in
                  </Link>
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default SignUp;