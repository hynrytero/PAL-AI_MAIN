import React, { useState } from "react";
import { TouchableOpacity, TextInput, Alert, Modal, View, Text, SafeAreaView, ScrollView, ImageBackground } from 'react-native';
import { router } from "expo-router";
import { Button, ActivityIndicator } from "react-native-paper";
import { images } from "../../constants";
import Feather from "react-native-vector-icons/Feather";
import { useAuth } from "../../context/AuthContext";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';


const API_URL = API_URL_BCNKEND;

const ManageAccount = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reEnterNewPassword, setReEnterNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailVerificationPassword, setEmailVerificationPassword] = useState("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError] = useState("");
  const { user, logout } = useAuth(); 

  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReEnterNewPassword, setShowReEnterNewPassword] = useState(false);
  const [showEmailVerificationPassword, setShowEmailVerificationPassword] = useState(false);

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\W]{8,}$/;
    return passwordRegex.test(password);
  };

  // Check if password change button should be enabled
  const isPasswordChangeEnabled = () => {
    return (
      currentPassword.length > 0 && // Current password is provided
      newPassword.length > 0 && // New password is provided
      reEnterNewPassword.length > 0 && // Confirm password is provided
      passwordErrors.newPassword === "" && // New password passes validation
      passwordErrors.confirmPassword === "" && // Confirmation password matches
      newPassword === reEnterNewPassword // Extra check that passwords match
    );
  };

  const handlePasswordChange = (password, type) => {
    if (type === 'new') {
      setNewPassword(password);
      if (!validatePassword(password)) {
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: "Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character."
        }));
      } else {
        setPasswordErrors(prev => ({ ...prev, newPassword: "" }));
      }

      // Also update confirm password error if confirm password has been entered
      if (reEnterNewPassword) {
        if (reEnterNewPassword !== password) {
          setPasswordErrors(prev => ({
            ...prev,
            confirmPassword: "Passwords don't match."
          }));
        } else {
          setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
      }
    } else if (type === 'confirm') {
      setReEnterNewPassword(password);
      if (password !== newPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: "Passwords don't match."
        }));
      } else {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm deletion.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/credentials/delete-account`, {
        method: 'POST',
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          password: deletePassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      // Success case
      Alert.alert("Account Deleted", "Your account has been successfully deleted.");
      setModalVisible(false);

      if (logout) {
        logout();
      }

      // Navigate to sign in
      router.push("/sign-in");

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete account. Please try again.");
      console.log(`ERROR:`, error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }

    if (passwordErrors.newPassword || passwordErrors.confirmPassword) {
      Alert.alert("Error", "Please fix password errors before proceeding.");
      return;
    }

    if (newPassword !== reEnterNewPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    try {
      // Show loading indicator
      setIsLoading(true);

      const response = await fetch(`${API_URL}/credentials/change-password`, {
        method: 'POST',
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      // Success case
      Alert.alert("Success", "Your password has been changed successfully.");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setReEnterNewPassword("");

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailVerificationPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }

    if (!newEmail) {
      Alert.alert("Error", "Please enter a new email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/credentials/verify-email-change`, {
        method: 'POST',
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          password: emailVerificationPassword,
          newEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate email change');
      }

      setOtpModalVisible(true);

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to initiate email change. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      Alert.alert("Error", "Please enter the OTP code.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/credentials/confirm-email-change`, {
        method: 'POST',
        headers: {
          'X-API-Key': AUTH_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          otp: otpCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      Alert.alert("Success", "Your email has been changed successfully.");
      setOtpModalVisible(false);
      setShowEmailForm(false);
      setNewEmail("");
      setOtpCode("");
      setEmailVerificationPassword("");

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputStyle = {
    borderWidth: 1,
    borderColor: '#474747',
    borderRadius: 5,
    padding: 10,
    fontSize: 18,
    color: 'black',
    marginBottom: 10,
  };

  const renderPasswordForm = () => (
    <View className="m-3">
      <View style={{ position: 'relative' }}>
        <TextInput
          style={commonInputStyle}
          placeholder="Current Password"
          placeholderTextColor="#474747"
          secureTextEntry={!showCurrentPassword}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 10, top: 15 }}
          onPress={() => setShowCurrentPassword(!showCurrentPassword)}
        >
          <Feather name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="#474747" />
        </TouchableOpacity>
      </View>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={commonInputStyle}
          placeholder="New Password"
          placeholderTextColor="#474747"
          secureTextEntry={!showNewPassword}
          value={newPassword}
          onChangeText={(text) => handlePasswordChange(text, 'new')}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 10, top: 15 }}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Feather name={showNewPassword ? "eye-off" : "eye"} size={20} color="#474747" />
        </TouchableOpacity>
      </View>
      {passwordErrors.newPassword ? (
        <Text className="text-red-500 mb-2">{passwordErrors.newPassword}</Text>
      ) : null}
      <View style={{ position: 'relative' }}>
        <TextInput
          style={commonInputStyle}
          placeholder="Re-enter New Password"
          placeholderTextColor="#474747"
          secureTextEntry={!showReEnterNewPassword}
          value={reEnterNewPassword}
          onChangeText={(text) => handlePasswordChange(text, 'confirm')}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 10, top: 15 }}
          onPress={() => setShowReEnterNewPassword(!showReEnterNewPassword)}
        >
          <Feather name={showReEnterNewPassword ? "eye-off" : "eye"} size={20} color="#474747" />
        </TouchableOpacity>
      </View>
      {passwordErrors.confirmPassword ? (
        <Text className="text-red-500 mb-2">{passwordErrors.confirmPassword}</Text>
      ) : null}
      <Button
        mode="contained"
        style={{
          borderRadius: 5,
          marginBottom: 10,
          backgroundColor: isPasswordChangeEnabled() ? "forestgreen" : "#c0c0c0"
        }}
        disabled={isLoading || !isPasswordChangeEnabled()}
        onPress={handleChangePassword}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size={20} color="white" animating={true} />
            <Text style={{ color: 'white', marginLeft: 10 }}>Changing Password...</Text>
          </View>
        ) : (
          "Change Password"
        )}
      </Button>
    </View>
  );

  const handleBack = () => {
    router.back();
  };

  return (
    <ImageBackground
      source={images.background_profile}
      className="flex-1 h-full w-full bg-white"
    >
      <ScrollView className="mt-12">
        <SafeAreaView className="px-7 w-full h-full mb-10">
          {/* New Header */}
          <View className="flex-row items-center w-full mb-7">
            <Feather
              name="chevron-left"
              size={40}
              color="black"
              onPress={handleBack}
            />
            <Text className="font-pmedium text-[30px]">Manage</Text>
          </View>

          <View className="flex-col rounded-[5px] border border-[#474747] mt-5">
            <View className="flex-row justify-between m-3">
              <Text className="text-lg">Email</Text>
              <TouchableOpacity onPress={() => setShowEmailForm(!showEmailForm)}>
                <Text className="text-lg underline">Change Email</Text>
              </TouchableOpacity>
            </View>
            {showEmailForm && (
              <View className="m-3">
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={commonInputStyle}
                    placeholder="Current Password"
                    placeholderTextColor="#474747"
                    secureTextEntry={!showEmailVerificationPassword}
                    value={emailVerificationPassword}
                    onChangeText={setEmailVerificationPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 10, top: 15 }}
                    onPress={() => setShowEmailVerificationPassword(!showEmailVerificationPassword)}
                  >
                    <Feather name={showEmailVerificationPassword ? "eye-off" : "eye"} size={20} color="#474747" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={commonInputStyle}
                  placeholder="New Email"
                  placeholderTextColor="#474747"
                  value={newEmail}
                  onChangeText={setNewEmail}
                />
                <Button
                  mode="contained"
                  style={{ borderRadius: 5, marginBottom: 10, backgroundColor: "forestgreen" }}
                  disabled={isLoading}
                  onPress={handleEmailChange}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size={20} color="white" animating={true} />
                      <Text style={{ color: 'white', marginLeft: 10 }}>Sending OTP...</Text>
                    </View>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </View>
            )}

            <View className="flex-row justify-between mb-3 mx-3">
              <Text className="text-lg">Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordForm(!showPasswordForm)}>
                <Text className="text-lg underline">Change Password</Text>
              </TouchableOpacity>
            </View>
            {apiError ? (
              <Text className="text-red-500 mb-4 text-center">{apiError}</Text>
            ) : null}
            {showPasswordForm && renderPasswordForm()}
          </View>

          <Button
            mode="outlined"
            style={{ borderRadius: 5, marginTop: 10 }}
            contentStyle={{ justifyContent: "flex-start" }}
            labelStyle={{ fontSize: 18, color: "red" }}
            onPress={() => setModalVisible(true)}
          >
            Delete Account
          </Button>
        </SafeAreaView>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: 300, padding: 20, backgroundColor: "white", borderRadius: 10 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Enter your password to confirm account deletion:</Text>
            <TextInput
              style={commonInputStyle}
              placeholder="Enter Password"
              placeholderTextColor="#474747"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
            <Button
              mode="contained"
              style={{ borderRadius: 5, marginBottom: 10, backgroundColor: "red" }}
              disabled={isLoading}
              onPress={handleDeleteAccount}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size={20} color="white" animating={true} />
                  <Text style={{ color: 'white', marginLeft: 10 }}>Deleting Account...</Text>
                </View>
              ) : (
                "Delete Account"
              )}
            </Button>
            <Button
              mode="outlined"
              style={{ borderRadius: 5 }}
              disabled={isLoading}
              onPress={() => setModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: 300, padding: 20, backgroundColor: "white", borderRadius: 10 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Enter OTP Code:</Text>
            <TextInput
              style={commonInputStyle}
              placeholder="OTP Code"
              placeholderTextColor="#474747"
              value={otpCode}
              onChangeText={setOtpCode}
            />
            <Button
              mode="contained"
              style={{ borderRadius: 5, marginBottom: 10 }}
              disabled={isLoading}
              onPress={handleVerifyOtp}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size={20} color="white" animating={true} />
                  <Text style={{ color: 'white', marginLeft: 10 }}>Verifying...</Text>
                </View>
              ) : (
                "Verify OTP"
              )}
            </Button>
            <Button
              mode="outlined"
              style={{ borderRadius: 5 }}
              onPress={() => setOtpModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default ManageAccount;