import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    ImageBackground,
    Alert,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import {
    TextInput,
    Button,
    IconButton,
    Surface,
    RadioButton,
    Menu,
    Chip
} from "react-native-paper";
import { images } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';

const API_URL = API_URL_BCNKEND;

const NotificationManager = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [icon, setIcon] = useState("bell");
    const [iconBgColor, setIconBgColor] = useState("#4285F4");
    const [type, setType] = useState("general");
    const [notificationType, setNotificationType] = useState("single"); // "single" or "all"
    const [targetUserId, setTargetUserId] = useState("");
    const [iconMenuVisible, setIconMenuVisible] = useState(false);
    const [colorMenuVisible, setColorMenuVisible] = useState(false);

    // Available icon options
    const iconOptions = [
        { name: "bell", label: "Bell" },
        { name: "leaf", label: "Leaf" },
        { name: "weather-rainy", label: "Rainy" },
        { name: "weather-sunny", label: "Sunny" },
        { name: "alert", label: "Alert" }
    ];

    // Common notification colors
    const commonColors = [
        { value: "#4285F4", label: "Primary Blue" },
        { value: "#EA4335", label: "Alert Red" },
        { value: "#FBBC05", label: "Warning Yellow" },
        { value: "#34A853", label: "Success Green" },
        { value: "#9C27B0", label: "Info Purple" },
        { value: "#FF6D00", label: "Notice Orange" },
        { value: "#607D8B", label: "Neutral Gray" },
        { value: "#000000", label: "Black" }
    ];

    // Available type options
    const typeOptions = [
        { value: "general", label: "General" },
        { value: "alert", label: "Alert" },
        { value: "weather", label: "Weather" },
        { value: "reminder", label: "Reminder" },
        { value: "update", label: "Update" }
    ];

    const resetForm = () => {
        setTitle("");
        setBody("");
        setIcon("bell");
        setIconBgColor("#4285F4");
        setType("general");
        setTargetUserId("");
    };

    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert("Error", "Title is required");
            return false;
        }

        if (notificationType === "single" && !targetUserId.trim()) {
            Alert.alert("Error", "User ID is required for single user notification");
            return false;
        }

        return true;
    };

    const handleSendNotification = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const endpoint = notificationType === "single"
                ? `${API_URL}/notifications/store-notification`
                : `${API_URL}/notifications/store-notification-all`;

            const payload = {
                title,
                body,
                icon,
                icon_bg_color: iconBgColor,
                type
            };

            // Add user_id to payload if sending to a single user
            if (notificationType === "single") {
                payload.user_id = parseInt(targetUserId);
            }

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'X-API-Key': AUTH_KEY,
                    'Content-Type': 'application/json'
                }
            });

            Alert.alert(
                "Success",
                notificationType === "single"
                    ? "Notification sent successfully"
                    : "Notification sent to all users successfully"
            );
            resetForm();
        } catch (error) {
            console.error("Error sending notification:", error);
            Alert.alert(
                "Error",
                `Failed to send notification: ${error.response?.data?.error || error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    // Pre-define color circle styles to avoid inline style issues with Reanimated
    const ColorCircle = ({ color }) => (
        <View
            style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }}
        />
    );

    const SmallColorCircle = ({ color }) => (
        <View
            style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8, backgroundColor: color }}
        />
    );

    // Component to display icon with background color
    const IconWithBackground = ({ iconName, backgroundColor }) => (
        <View style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 18,
            backgroundColor: backgroundColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
        }}>
            <IconButton 
                icon={iconName} 
                size={18} 
                color="white"
                style={{ margin: 0 }}
            />
        </View>
    );

    // Custom textInput styles
    const textInputTheme = {
        roundness: 16,  // More curved corners
        colors: {
            primary: '#228B22',
        }
    };

    return (
        <ImageBackground
            source={images.background_history}
            className="flex-1 h-full w-full bg-white"
        >
            <StatusBar translucent backgroundColor="transparent" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="mt-12">
                    <SafeAreaView className="px-7 w-full h-full mb-10">
                        <View className="flex-row items-center justify-between w-full mb-3">
                            <Text className="font-pmedium text-[30px]">Notification Manager</Text>
                        </View>

                        <Surface className="p-4 rounded-lg mb-4 elevation-2 bg-white border border-gray-300">
                            <Text className="font-pmedium text-base mb-3">Send To</Text>
                            <RadioButton.Group
                                onValueChange={value => setNotificationType(value)}
                                value={notificationType}
                            >
                                <View className="flex-row">
                                    <View className="flex-row items-center mr-4">
                                        <RadioButton value="single" color="#228B22" />
                                        <Text>Single User</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <RadioButton value="all" color="#228B22" />
                                        <Text>All Users</Text>
                                    </View>
                                </View>
                            </RadioButton.Group>

                            {notificationType === "single" && (
                                <TextInput
                                    label="User ID"
                                    value={targetUserId}
                                    onChangeText={setTargetUserId}
                                    keyboardType="number-pad"
                                    mode="outlined"
                                    className="mt-2"
                                    style={{ backgroundColor: 'white' }}
                                    theme={textInputTheme}
                                />
                            )}
                        </Surface>

                        <Surface className="p-4 rounded-lg mb-4 elevation-2 bg-white border border-gray-300">
                            <Text className="font-pmedium text-base mb-3">Notification Content</Text>
                            <TextInput
                                label="Title"
                                value={title}
                                onChangeText={setTitle}
                                mode="outlined"
                                className="mb-3"
                                style={{ backgroundColor: 'white' }}
                                theme={textInputTheme}
                            />
                            <TextInput
                                label="Body"
                                value={body}
                                onChangeText={setBody}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                className="mb-3"
                                style={{ backgroundColor: 'white' }}
                                theme={textInputTheme}
                            />

                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-1 mr-2">
                                    <Text className="mb-1">Icon</Text>
                                    <Menu
                                        visible={iconMenuVisible}
                                        onDismiss={() => setIconMenuVisible(false)}
                                        anchor={
                                            <TouchableOpacity
                                                onPress={() => setIconMenuVisible(true)}
                                                className="flex-row items-center border border-gray-300 p-2 rounded-lg"
                                            >
                                                <IconWithBackground 
                                                    iconName={icon} 
                                                    backgroundColor={iconBgColor} 
                                                />
                                                <Text>{iconOptions.find(opt => opt.name === icon)?.label || "Bell"}</Text>
                                            </TouchableOpacity>
                                        }
                                    >
                                        {iconOptions.map(option => (
                                            <Menu.Item
                                                key={option.name}
                                                title={option.label}
                                                leadingIcon={option.name}
                                                onPress={() => {
                                                    setIcon(option.name);
                                                    setIconMenuVisible(false);
                                                }}
                                            />
                                        ))}
                                    </Menu>
                                </View>

                                <View className="flex-1">
                                    <Text className="mb-1">Background Color</Text>
                                    <Menu
                                        visible={colorMenuVisible}
                                        onDismiss={() => setColorMenuVisible(false)}
                                        anchor={
                                            <TouchableOpacity
                                                onPress={() => setColorMenuVisible(true)}
                                                className="flex-row items-center border border-gray-300 p-2 rounded-lg"
                                            >
                                                <SmallColorCircle color={iconBgColor} />
                                                <Text>{commonColors.find(color => color.value === iconBgColor)?.label || iconBgColor}</Text>
                                            </TouchableOpacity>
                                        }
                                    >
                                        {commonColors.map(color => (
                                            <Menu.Item
                                                key={color.value}
                                                title={color.label}
                                                onPress={() => {
                                                    setIconBgColor(color.value);
                                                    setColorMenuVisible(false);
                                                }}
                                                leadingIcon={() => <ColorCircle color={color.value} />}
                                            />
                                        ))}
                                    </Menu>
                                </View>
                            </View>

                            <View className="mb-3">
                                <Text className="mb-1">Notification Type</Text>
                                <View className="flex-row flex-wrap">
                                    {typeOptions.map(option => (
                                        <Chip
                                            key={option.value}
                                            selected={type === option.value}
                                            onPress={() => setType(option.value)}
                                            textStyle={{ color: type === option.value ? "white" : "black" }}
                                            style={{
                                                margin: 4,
                                                backgroundColor: type === option.value ? "#228B22" : "#D3D3D3",
                                                borderRadius: 20
                                            }}
                                            selectedColor="white"
                                        >
                                            {option.label}
                                        </Chip>
                                    ))}
                                </View>
                            </View>
                        </Surface>

                        <Button
                            mode="contained"
                            onPress={handleSendNotification}
                            loading={loading}
                            disabled={loading}
                            icon="send"
                            className="mt-3"
                            style={{ backgroundColor: 'forestgreen', borderRadius: 16 }}
                        >
                            Send Notification
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={resetForm}
                            className="mt-3"
                            textColor="forestgreen"
                            style={{ borderColor: "forestgreen", borderRadius: 16 }}
                        >
                            Reset Form
                        </Button>

                    </SafeAreaView>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default NotificationManager;