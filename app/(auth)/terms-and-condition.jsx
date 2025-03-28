import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";

const TermsAndCondition = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Icon
          name="chevron-left"
          size={40}
          color="black"
          onPress={() => router.back()}
        />
        <Text style={styles.heading}>Terms and Conditions</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to PAL-AI Rice Leaf Disease Management System mobile application. By downloading, installing, or using this application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use this application.
          </Text>

          <Text style={styles.sectionTitle}>2. Application Purpose</Text>
          <Text style={styles.paragraph}>
            The Rice Leaf Disease Management System is designed to help farmers and agricultural professionals identify, monitor, and manage diseases affecting rice plants through image recognition and analysis technology. The application provides diagnostic information, treatment recommendations, and preventive measures based on the images and data submitted by users.
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            You may be required to create an account to access certain features of the application. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Collection and Privacy</Text>
          <Text style={styles.paragraph}>
            The application collects and processes images of rice plants, geographical location data (if permitted), and user-provided information about farming practices. This data is used to improve disease recognition capabilities, provide localized recommendations, and develop region-specific disease management strategies. All personal data is processed in accordance with our Privacy Policy, which is incorporated by reference into these Terms and Conditions.
          </Text>

          <Text style={styles.sectionTitle}>5. User-Generated Content</Text>
          <Text style={styles.paragraph}>
            By uploading images and data to the application, you grant us a non-exclusive, worldwide, royalty-free license to use, store, display, reproduce, modify, and distribute such content for the purpose of providing and improving our services. You represent and warrant that you own or have the necessary rights to share the content you submit and that such content does not violate the rights of any third party.
          </Text>

          <Text style={styles.sectionTitle}>6. Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            The disease identification and management recommendations provided by this application are based on machine learning algorithms and agricultural research. While we strive for accuracy, we cannot guarantee that all diagnoses will be correct or that all recommendations will be effective in all circumstances. The application should be used as a support tool, not as a replacement for professional agricultural consultation.
          </Text>

          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, crop losses, or other agricultural damages, resulting from your use or inability to use the application or any content provided therein.
          </Text>

          <Text style={styles.sectionTitle}>8. Modifications to the Application</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify, suspend, or discontinue the application or any service to which it connects, with or without notice and without liability to you. We may also update these Terms and Conditions from time to time. Continued use of the application after any such changes shall constitute your consent to such changes.
          </Text>

          <Text style={styles.sectionTitle}>9. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms and Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which the application provider is established, without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms and Conditions, please contact us through the support section of the application or via the contact information provided on our website.
          </Text>
          
          <Text style={[styles.paragraph, styles.lastUpdated]}>
            Last updated: March 21, 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#006400", 
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: "#333",
  },
  lastUpdated: {
    marginTop: 20,
    fontStyle: "italic",
    color: "#666",
  },
});

export default TermsAndCondition;