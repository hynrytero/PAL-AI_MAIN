import React, { useState, useEffect, useRef, useCallback } from "react";
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
    Platform,
    ActivityIndicator,
    FlatList,
    Modal
} from "react-native";
import {
    TextInput,
    Button,
    IconButton,
    Surface,
    RadioButton,
    Menu,
    Chip,
    Searchbar,
    List,
    Avatar,
    Divider
} from "react-native-paper";
import { images } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { AUTH_KEY, API_URL_BCNKEND } from '@env';
import { debounce } from 'lodash'; // Make sure to import lodash

const API_URL = API_URL_BCNKEND;

// Pre-defined data arrays remain the same
const ICON_OPTIONS = [
    { name: "bell", label: "Bell" },
    { name: "leaf", label: "Leaf" },
    { name: "weather-rainy", label: "Rainy" },
    { name: "weather-sunny", label: "Sunny" },
    { name: "alert", label: "Alert" }
];

const COMMON_COLORS = [
    { value: "#4285F4", label: "Primary Blue" },
    { value: "#EA4335", label: "Alert Red" },
    { value: "#FBBC05", label: "Warning Yellow" },
    { value: "#34A853", label: "Success Green" },
    { value: "#9C27B0", label: "Info Purple" },
    { value: "#FF6D00", label: "Notice Orange" },
    { value: "#607D8B", label: "Neutral Gray" },
    { value: "#000000", label: "Black" }
];

const TYPE_OPTIONS = [
    { value: "general", label: "General" },
    { value: "alert", label: "Alert" },
    { value: "weather", label: "Weather" },
    { value: "reminder", label: "Reminder" },
    { value: "update", label: "Update" }
];

// Custom styles
const TEXT_INPUT_THEME = {
    roundness: 16,
    colors: {
        primary: '#228B22',
    }
};

const PRIMARY_COLOR = '#228B22';

// Extracted User Selection Modal as a separate component to prevent re-renders
const UserSelectionModal = React.memo(({
    visible,
    onClose,
    users,
    searchQuery,
    onSearchChange,
    onUserSelect,
    usersLoading
}) => {
    const searchInputRef = useRef(null);

    // Focus the search input when the modal becomes visible
    useEffect(() => {
        if (visible && searchInputRef.current) {
            // Small delay to ensure the modal is fully rendered
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [visible]);

    // Get user initials for avatar
    const getUserInitials = (user) => {
        if (!user) return "?";
        const firstInitial = user.firstname ? user.firstname.charAt(0).toUpperCase() : "";
        const lastInitial = user.lastname ? user.lastname.charAt(0).toUpperCase() : "";
        return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || "?";
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, marginTop: 20 }}>
                <View className="flex-row items-center px-4 mb-2">
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        onPress={onClose}
                    />
                    <Text className="font-pmedium text-lg">Select User</Text>
                </View>

                <Searchbar
                    ref={searchInputRef}
                    placeholder="Search by name or email"
                    onChangeText={onSearchChange}
                    value={searchQuery}
                    className="mx-4 mb-2"
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 22
                    }}
                    theme={TEXT_INPUT_THEME}
                />

                {usersLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                        <Text className="mt-2">Loading users...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.user_profiles_id.toString()}
                        ListEmptyComponent={
                            <View className="py-8 items-center">
                                <Text>No users found</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onUserSelect(item)}>
                                <List.Item
                                    title={`${item.firstname || ""} ${item.lastname || ""}`}
                                    description={item.email}
                                    left={props => (
                                        item.profile_image ? (
                                            <Avatar.Image
                                                {...props}
                                                size={40}
                                                source={{ uri: item.profile_image }}
                                            />
                                        ) : (
                                            <Avatar.Text
                                                {...props}
                                                size={40}
                                                label={getUserInitials(item)}
                                                backgroundColor={PRIMARY_COLOR}
                                            />
                                        )
                                    )}
                                    right={props => (
                                        <List.Icon {...props} icon="chevron-right" />
                                    )}
                                />
                                <Divider />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
});

const NotificationManager = () => {
    const { user } = useAuth();

    // Form states
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [icon, setIcon] = useState("bell");
    const [iconBgColor, setIconBgColor] = useState("#4285F4");
    const [type, setType] = useState("general");
    const [notificationType, setNotificationType] = useState("single");
    const [targetUserId, setTargetUserId] = useState("");

    // UI control states
    const [iconMenuVisible, setIconMenuVisible] = useState(false);
    const [colorMenuVisible, setColorMenuVisible] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);

    // User selection states
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);

    // Fetch users when component mounts or notification type changes
    useEffect(() => {
        if (notificationType === "single") {
            fetchUsers();
        }
    }, [notificationType]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await axios.get(`${API_URL}/admin/notif/fetch-user`, {
                headers: {
                    'X-API-Key': AUTH_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.data) {
                setUsers(response.data.data);
                setFilteredUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "Failed to load users. Please try again.");
        } finally {
            setUsersLoading(false);
        }
    };

    // Debounced filter function to prevent excessive re-renders
    const filterUsers = useCallback(
        debounce((query) => {
            const lowercasedQuery = query.toLowerCase().trim();

            if (!lowercasedQuery) {
                setFilteredUsers(users);
                return;
            }

            const filtered = users.filter(user =>
                (user.firstname && user.firstname.toLowerCase().includes(lowercasedQuery)) ||
                (user.lastname && user.lastname.toLowerCase().includes(lowercasedQuery)) ||
                (user.email && user.email.toLowerCase().includes(lowercasedQuery))
            );

            setFilteredUsers(filtered);
        }, 300),
        [users]
    );

    // Separated search handler that only updates the state
    const handleSearch = (query) => {
        setSearchQuery(query);
        filterUsers(query);
    };

    // User selection handler
    const selectUser = (user) => {
        setSelectedUser(user);
        setTargetUserId(user.user_id.toString());
        setUserModalVisible(false);
    };

    // Reset form function
    const resetForm = () => {
        setTitle("");
        setBody("");
        setIcon("bell");
        setIconBgColor("#4285F4");
        setType("general");
        setTargetUserId("");
        setSelectedUser(null);
    };

    // Form validation
    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert("Error", "Title is required");
            return false;
        }

        if (notificationType === "single" && !targetUserId.trim()) {
            Alert.alert("Error", "User selection is required for single user notification");
            return false;
        }

        return true;
    };

    // Handle sending notification
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

            if (notificationType === "single") {
                payload.user_id = parseInt(targetUserId);
            }

            await axios.post(endpoint, payload, {
                headers: {
                    'X-API-Key': AUTH_KEY,
                    'Content-Type': 'application/json'
                }
            });

            Alert.alert(
                "Success",
                notificationType === "single"
                    ? `Notification sent successfully to ${selectedUser ? selectedUser.firstname + " " + selectedUser.lastname : "user #" + targetUserId}`
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

    // Get user initials for avatar
    const getUserInitials = (user) => {
        if (!user) return "?";
        const firstInitial = user.firstname ? user.firstname.charAt(0).toUpperCase() : "";
        const lastInitial = user.lastname ? user.lastname.charAt(0).toUpperCase() : "";
        return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || "?";
    };

    // Component to display icon with background color
    const IconWithBackground = ({ iconName, backgroundColor }) => (
        <View style={{
            width: 25,
            height: 25,
            borderRadius: 18,
            backgroundColor: backgroundColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
        }}>
            <IconButton
                icon={iconName}
                size={13}
                color="white"
                style={{ margin: 0 }}
                iconColor="white"
            />
        </View>
    );

    // Color circle components
    const ColorCircle = ({ color }) => (
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }} />
    );

    const SmallColorCircle = ({ color }) => (
        <View style={{ width: 25, height: 25, borderRadius: 10, marginRight: 8, backgroundColor: color }} />
    );

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

                        {/* Target Selection Section */}
                        <Surface className="p-4 rounded-lg mb-4 elevation-2 bg-white border border-gray-300">
                            <Text className="font-pmedium text-base mb-3">Send To</Text>
                            <RadioButton.Group
                                onValueChange={value => {
                                    setNotificationType(value);
                                    if (value === "all") {
                                        setSelectedUser(null);
                                        setTargetUserId("");
                                    }
                                }}
                                value={notificationType}
                            >
                                <View className="flex-row">
                                    <View className="flex-row items-center mr-4">
                                        <RadioButton value="single" color={PRIMARY_COLOR} />
                                        <Text>Single User</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <RadioButton value="all" color={PRIMARY_COLOR} />
                                        <Text>All Users</Text>
                                    </View>
                                </View>
                            </RadioButton.Group>

                            {notificationType === "single" && (
                                <View className="mt-2">
                                    <TouchableOpacity
                                        onPress={() => setUserModalVisible(true)}
                                        className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            {selectedUser ? (
                                                <>
                                                    <Avatar.Text
                                                        size={40}
                                                        label={getUserInitials(selectedUser)}
                                                        backgroundColor={PRIMARY_COLOR}
                                                    />
                                                    <View className="ml-2">
                                                        <Text className="font-pmedium">
                                                            {selectedUser.firstname} {selectedUser.lastname}
                                                        </Text>
                                                        <Text className="text-gray-600 text-sm">
                                                            {selectedUser.email}
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <IconButton
                                                        icon="account-search"
                                                        size={24}
                                                        color={PRIMARY_COLOR}
                                                        style={{ margin: 0 }}
                                                    />
                                                    <Text className="text-gray-500">Select a user</Text>
                                                </>
                                            )}
                                        </View>
                                        <IconButton
                                            icon="chevron-right"
                                            size={24}
                                            color="#666"
                                        />
                                    </TouchableOpacity>

                                    {selectedUser && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedUser(null);
                                                setTargetUserId("");
                                            }}
                                            className="flex-row items-center justify-end mt-1"
                                        >
                                            <Text className="text-red-600 text-sm">Clear Selection</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </Surface>

                        {/* Notification Content Section */}
                        <Surface className="p-4 rounded-lg mb-4 elevation-2 bg-white border border-gray-300">
                            <Text className="font-pmedium text-base mb-3">Notification Content</Text>
                            <TextInput
                                label="Title"
                                value={title}
                                onChangeText={setTitle}
                                mode="outlined"
                                className="mb-3"
                                style={{ backgroundColor: 'white' }}
                                theme={TEXT_INPUT_THEME}
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
                                theme={TEXT_INPUT_THEME}
                            />

                            <View className="flex-row justify-between items-start mb-3">
                                {/* Icon Selection */}
                                <View className="flex-1 mr-2">
                                    <Text className="mb-1">Icon</Text>
                                    <Menu
                                        visible={iconMenuVisible}
                                        onDismiss={() => setIconMenuVisible(false)}
                                        anchor={
                                            <TouchableOpacity
                                                onPress={() => setIconMenuVisible(true)}
                                                className="flex-row items-center border border-gray-500 p-2 rounded-lg"
                                            >
                                                <IconWithBackground
                                                    iconName={icon}
                                                    backgroundColor={iconBgColor}
                                                />
                                                <Text className="ml-2">{ICON_OPTIONS.find(opt => opt.name === icon)?.label || "Bell"}</Text>
                                            </TouchableOpacity>
                                        }
                                    >
                                        {ICON_OPTIONS.map(option => (
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

                                {/* Color Selection */}
                                <View className="flex-1">
                                    <Text className="mb-1">Background Color</Text>
                                    <Menu
                                        visible={colorMenuVisible}
                                        onDismiss={() => setColorMenuVisible(false)}
                                        anchor={
                                            <TouchableOpacity
                                                onPress={() => setColorMenuVisible(true)}
                                                className="flex-row items-center border border-gray-500 p-2 rounded-lg"
                                            >
                                                <SmallColorCircle color={iconBgColor} />
                                                <Text className="ml-2">{COMMON_COLORS.find(color => color.value === iconBgColor)?.label || iconBgColor}</Text>
                                            </TouchableOpacity>
                                        }
                                    >
                                        {COMMON_COLORS.map(color => (
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

                            {/* Notification Type Selection */}
                            <View className="mb-3">
                                <Text className="mb-1">Notification Type</Text>
                                <View className="flex-row flex-wrap">
                                    {TYPE_OPTIONS.map(option => (
                                        <Chip
                                            key={option.value}
                                            selected={type === option.value}
                                            onPress={() => setType(option.value)}
                                            textStyle={{ color: type === option.value ? "white" : "black" }}
                                            style={{
                                                margin: 4,
                                                backgroundColor: type === option.value ? PRIMARY_COLOR : "#D3D3D3",
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

                        {/* Action Buttons */}
                        <Button
                            mode="contained"
                            onPress={handleSendNotification}
                            loading={loading}
                            disabled={loading}
                            icon="send"
                            className="mt-3"
                            style={{ backgroundColor: PRIMARY_COLOR, borderRadius: 16 }}
                        >
                            Send Notification
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={resetForm}
                            className="mt-3"
                            textColor={PRIMARY_COLOR}
                            style={{ borderColor: PRIMARY_COLOR, borderRadius: 16 }}
                        >
                            Reset Form
                        </Button>
                    </SafeAreaView>
                </ScrollView>

                {/* User Selection Modal*/}
                <UserSelectionModal
                    visible={userModalVisible}
                    onClose={() => setUserModalVisible(false)}
                    users={filteredUsers}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearch}
                    onUserSelect={selectUser}
                    usersLoading={usersLoading}
                />
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default NotificationManager;