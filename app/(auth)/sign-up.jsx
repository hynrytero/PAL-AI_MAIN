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
  StyleSheet,
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
    { label: "Prefer not to say", value: "unspecified" },
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

  const validateConfirmPassword = (confirmpassword) => {
    return confirmpassword !== form.password;
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

  // Form handlers
  const handleChangeEmail = (e) => {
    setForm({ ...form, email: e });
    if (!validateEmail(e)) {
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

  const isFormValid =
    form.firstname.trim() !== "" &&
    form.lastname.trim() !== "" &&
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
  };

  const handleConfirmPassword = (e) => {
    setForm({ ...form, confirmpassword: e });
    if (validateConfirmPassword(e)) {
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ImageBackground
          source={images.background_signup}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContainer}>
                <View style={styles.logoContainer}>
                  <Image
                    source={images.logo}
                    resizeMode="contain"
                    style={styles.logo}
                  />
                  <Text style={styles.appTitle}>PAL-AI</Text>
                </View>
                <Text style={styles.signUpTitle}>Sign-Up</Text>
                <Text style={styles.formDescription}>Please enter the details.</Text>

                <View style={styles.rowContainer}>
                  <TextInput
                    label="First Name"
                    value={form.firstname}
                    onChangeText={(e) => setForm({ ...form, firstname: e })}
                    style={styles.halfWidthInput}
                    mode="outlined"
                    activeOutlineColor="#006400"
                    outlineColor="#CBD2E0"
                    textColor="#2D3648"
                    dense={width < 360}
                  />
                  <TextInput
                    label="Last Name"
                    value={form.lastname}
                    onChangeText={(e) => setForm({ ...form, lastname: e })}
                    style={styles.halfWidthInput}
                    mode="outlined"
                    activeOutlineColor="#006400"
                    outlineColor="#CBD2E0"
                    textColor="#2D3648"
                    dense={width < 360}
                  />
                </View>

                <View style={styles.rowContainer}>
                  <TextInput
                    label="Birthdate (MM/DD/YYYY)"
                    value={form.birthdate}
                    keyboardType="numeric"
                    onChangeText={handleBirthdate}
                    style={styles.halfWidthInput}
                    mode="outlined"
                    activeOutlineColor="#006400"
                    outlineColor="#CBD2E0"
                    textColor="#2D3648"
                    error={!!birthdateError}
                    maxLength={10}
                    dense={width < 360}
                  />

                  <View style={styles.dropdownContainer}>
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.dropdownPlaceholder}
                      selectedTextStyle={styles.dropdownSelectedText}
                      inputSearchStyle={styles.dropdownSearchInput}
                      iconStyle={styles.dropdownIcon}
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
                  <Text style={styles.errorText}>{birthdateError}</Text>
                )}

                <TextInput
                  label="Email"
                  value={form.email}
                  onChangeText={handleChangeEmail}
                  style={styles.fullWidthInput}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  error={!!error}
                  dense={width < 360}
                />

                {error && form.email.length > 0 && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <TextInput
                  label="Mobile Number"
                  value={form.mobilenumber}
                  keyboardType="numeric"
                  onChangeText={handleChangeMobile}
                  style={styles.fullWidthInput}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  error={!!mobileError}
                  dense={width < 360}
                />

                {mobileError && form.mobilenumber.length > 0 && (
                  <Text style={styles.errorText}>{mobileError}</Text>
                )}

                <TextInput
                  label="Username"
                  value={form.username}
                  onChangeText={(e) => setForm({ ...form, username: e })}
                  style={styles.fullWidthInput}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  dense={width < 360}
                />

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
                  style={styles.fullWidthInput}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  error={!!passwordError}
                  dense={width < 360}
                />

                {passwordError && form.password.length > 0 && (
                  <Text style={styles.errorText}>{passwordError}</Text>
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
                  style={styles.fullWidthInput}
                  mode="outlined"
                  activeOutlineColor="#006400"
                  outlineColor="#CBD2E0"
                  textColor="#2D3648"
                  error={!!confirmPasswordError}
                  dense={width < 360}
                />

                {confirmPasswordError && form.confirmpassword.length > 0 && (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                )}

                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={isChecked ? "checked" : "unchecked"}
                    onPress={() => setIsChecked(!isChecked)}
                    color="#006400"
                  />
                  <Text style={styles.termsText}>
                    I agree to the{" "}
                    <Link
                      href="/terms-and-condition"
                      style={styles.termsLink}
                    >
                      Terms and Conditions
                    </Link>
                  </Text>
                </View>

                <CustomButton
                  title="Sign Up"
                  handlePress={handleSignUp}
                  containerStyles={styles.signUpButton}
                  isLoading={isSubmitting}
                  disabled={!isFormValid}
                />

                <View style={styles.loginLinkContainer}>
                  <Text style={styles.loginText}>
                    Already a user?{" "}
                    <Link
                      href="/sign-in"
                      style={styles.loginLink}
                    >
                      Log in</Link>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: height * 0.04,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: width * 0.05,
    maxWidth: 500,
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    maxWidth: 100,
    maxHeight: 100,
    marginRight: 10,
  },
  appTitle: {
    fontSize: Math.min(width * 0.06, 28),
    fontWeight: '700',
  },
  signUpTitle: {
    fontSize: Math.min(width * 0.06, 28),
    fontWeight: '600',
    marginBottom: 5,
  },
  formDescription: {
    fontSize: Math.min(width * 0.04, 18),
    marginBottom: height * 0.02,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  halfWidthInput: {
    width: '48%',
  },
  fullWidthInput: {
    width: '100%',
    marginBottom: 8,
  },
  dropdownContainer: {
    width: '48%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#CBD2E0',
    borderRadius: 5,
    padding: 8,
    justifyContent: 'center',
    height: width < 360 ? 48 : 56,
  },
  dropdown: {
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: Math.min(width * 0.035, 16),
  },
  dropdownSelectedText: {
    fontSize: Math.min(width * 0.035, 16),
  },
  dropdownSearchInput: {
    fontSize: Math.min(width * 0.035, 16),
  },
  dropdownIcon: {
    marginRight: 8,
  },
  errorText: {
    color: 'red',
    fontSize: Math.min(width * 0.03, 14),
    marginBottom: 8,
  },
  checkboxContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    marginLeft: 8,
    fontSize: Math.min(width * 0.035, 16),
  },
  termsLink: {
    color: '#006400',
    fontWeight: '500',
  },
  signUpButton: {
    width: '100%',
    marginTop: height * 0.03,
    height: Math.min(height * 0.06, 50),
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  loginText: {
    fontSize: Math.min(width * 0.035, 16),
    color: '#4B4B4B',
  },
  loginLink: {
    fontWeight: '600',
    color: '#006400',
  },
});

export default SignUp;