import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { images } from "../../constants";
import axios from "axios";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const API_URL = API_URL_BCNKEND;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const SignInOTP = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const router = useRouter();
  const { email } = useLocalSearchParams();

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleApiError = (error) => {
    const errorMessage = error.response?.data?.message || "An error occurred";
    Alert.alert("Error", errorMessage);
    console.log('Error: ', error);
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await axios.post(
        `${API_URL}/forgotpassword/resend-password-otp`,
        { email },
        { headers: { 'X-API-Key': AUTH_KEY } }
      );

      Alert.alert("Success", "Verification code resent successfully");
      setTimeLeft(RESEND_COOLDOWN);
      setCanResend(false);

      setTimeout(() => {
        setCanResend(true);
      }, RESEND_COOLDOWN * 1000);

    } catch (error) {
      handleApiError(error);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.match(/^[0-9]?$/)) {  // Only allow single digits
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input if a digit was entered
      if (value && index < OTP_LENGTH - 1) {
        otpRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && index > 0 && otp[index] === '') {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const validateInput = () => {
    const verificationCode = otp.join('');
    if (verificationCode.length !== OTP_LENGTH) {
      Alert.alert("Error", "Please enter the complete verification code");
      return false;
    }
    if (!email) {
      Alert.alert("Error", "Email information is missing");
      return false;
    }
    return true;
  };

  const handleVerification = async () => {
    if (!validateInput()) return;

    const verificationCode = otp.join('');
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_URL}/forgotpassword/verify-otp`,
        { email, otp: verificationCode },
        { headers: { 'X-API-Key': AUTH_KEY } }
      );

      if (response.status === 200) {
        Alert.alert(
          "Success",
          "OTP verified successfully",
          [{ 
            text: "OK", 
            onPress: () => router.push({
              pathname: "/change-password",
              params: { email: email }
            })
          }]
        );
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOtpInputs = () => {
    return otp.map((digit, index) => (
      <TextInput
        key={index}
        ref={(el) => (otpRefs.current[index] = el)}
        value={digit}
        onChangeText={(value) => handleOtpChange(index, value)}
        onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
        keyboardType="numeric"
        maxLength={1}
        style={{
          width: 45,
          height: 45,
          borderWidth: 1,
          borderColor: '#E5E5E5',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 18,
          backgroundColor: 'white',
        }}
      />
    ));
  };

  const renderResendOption = () => {
    return (
      <TouchableOpacity
        onPress={handleResend}
        disabled={!canResend}
        style={{ marginTop: 16 }}
      >
        <Text style={{ color: '#777777', fontSize: 16 }}>
          {canResend ? (
            <>
              Didn't receive the code?{' '}
              <Text style={{ color: '#2E8B57', fontWeight: '600' }}>Resend</Text>
            </>
          ) : (
            <>
              Waiting to resend code{' '}
              <Text style={{ color: '#2E8B57', fontWeight: '600' }}>({timeLeft}s)</Text>
            </>
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={images.background_signup}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      resizeMode="cover"
    >
      {/* Header with green background */}
      <View style={{
        height: 180,
        backgroundColor: 'transparent',
        position: 'relative',
      }}>

        {/* Header content */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 83,
        }}>
          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Icon name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '600',
            marginRight: 24,
          }}>
            Verify Account
          </Text>
        </View>
      </View>

      {/* Main content */}
      <View style={{
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60
      }}>
        {/* Logo */}
        <Image
          source={images.logo}
          style={{ width: 120, height: 120, marginBottom: 32 }}
          resizeMode="contain"
        />

        {/* OTP Message */}
        <Text style={{
          textAlign: 'center',
          color: '#777777',
          fontSize: 16,
          marginBottom: 8,
        }}>
          We've sent an OTP to your email account
        </Text>

        {email && (
          <Text style={{
            textAlign: 'center',
            fontWeight: '500',
            fontSize: 16,
            marginBottom: 32,
          }}>
            {email}
          </Text>
        )}

        {/* OTP Input Fields */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          paddingHorizontal: 16,
          marginBottom: 24,
        }}>
          {renderOtpInputs()}
        </View>

        {/* Resend OTP */}
        {renderResendOption()}

        {/* Verify Button */}
        <TouchableOpacity
          style={{
            backgroundColor: 'forestgreen',
            width: '100%',
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 36,
          }}
          onPress={handleVerification}
          disabled={isSubmitting}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
            {isSubmitting ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default SignInOTP;