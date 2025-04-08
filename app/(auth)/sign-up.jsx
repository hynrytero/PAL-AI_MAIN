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
} from "react-native";
import React, { useState } from "react";
import { Link, router } from "expo-router";
import axios from "axios";
import { Checkbox, TextInput } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

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
  });

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

  // Form handlers
  const handleChangeEmail = (e) => {
    setForm({ ...form, email: e });

    if (!validateText(e)) {
      setError("Email can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setError("");
    }

    if (!validateText(e)) {
      setError("Invalid email format");
    } else {
      setError("");
    }

  };

  const handleBirthdate = (e) => {
    // Allow only numbers and forward slash
    if (/^[\d/]*$/.test(e)) {
      // Auto-format the date as user types
      let formatted = e;
      if (e.length === 2 && form.birthdate.length === 1) formatted += '/';
      if (e.length === 5 && form.birthdate.length === 4) formatted += '/';

      setForm({ ...form, birthdate: formatted });

      if (formatted.length === 10) {
        if (!validateBirthdate(formatted)) {
          setBirthdateError("Invalid birthdate. Must be at least 18 years old.");
        } else {
          setBirthdateError("");
        }
      }
    }
  };

  const handleChangeFirstName = (e) => {
    setForm({ ...form, firstname: e });
    if (!validateText(e)) {
      setFirstNameError("Firtsname can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setFirstNameError("");
    }
  };

  const handleChangeLastName = (e) => {
    setForm({ ...form, lastname: e });
    if (!validateText(e)) {
      setLastNameError("Lastname can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setLastNameError("");
    }
  };

  const handleChangeUsername = (e) => {
    setForm({ ...form, username: e });
    if (!validateText(e)) {
      setUsernameError("Username can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setUsernameError("");
    }
  };

  const isFormValid =
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
    isChecked;

  const handleChangeMobile = (e) => {
    if (/^\d*$/.test(e) && e.length <= 11) {
      setForm({ ...form, mobilenumber: e });
      if (!validateMobileNumber(e)) {
        setMobileError("Invalid mobile number.");
      } else {
        setMobileError("");
      }
    }
  };

  const handleChangePassword = (e) => {
    setForm({ ...form, password: e });

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
    setForm({ ...form, confirmpassword: e });

    if (!validateConfirmPassword(e)) {
      setConfirmPasswordError("Password doesn't match.");
    } else {
      setConfirmPasswordError("");
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
      console.log("Error: ", error);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ImageBackground
          source={images.background_signup}
          style={{
            flex: 1,
            width: '100%',
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
                  marginBottom: height * 0.02,
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
                  marginBottom: 5,
                }}>Sign-Up</Text>
                <Text style={{
                  fontSize: Math.min(width * 0.04, 18),
                  marginBottom: height * 0.02,
                }}>Please enter the details.</Text>

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
                  <TextInput
                    label="Birthdate (MM/DD/YYYY)"
                    value={form.birthdate}
                    keyboardType="numeric"
                    onChangeText={handleBirthdate}
                    style={{ width: '48%' }}
                    mode="outlined"
                    activeOutlineColor="#006400"
                    outlineColor="#CBD2E0"
                    textColor="#2D3648"
                    error={!!birthdateError}
                    maxLength={10}
                    dense={width < 360}
                  />

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
                  style={{ width: '100%', marginBottom: 8 }}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;