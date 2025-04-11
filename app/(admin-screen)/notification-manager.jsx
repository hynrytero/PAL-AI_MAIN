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
    Modal,
    Image
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
import * as ImagePicker from 'expo-image-picker';

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
    { value: "#4285F4", label: "Blue" },
    { value: "#EA4335", label: "Red" },
    { value: "#FBBC05", label: "Yellow" },
    { value: "#34A853", label: "Green" },
    { value: "#9C27B0", label: "Purple" },
    { value: "#FF6D00", label: "Orange" },
    { value: "#607D8B", label: "Gray" },
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
    usersLoading,
    selectedUsers,
    multiSelect
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

    // Check if a user is selected
    const isUserSelected = (userId) => {
        return selectedUsers.some(user => user.user_id === userId);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, marginTop: 20 }}>
                <View className="flex-row items-center justify-between px-4 mb-2">
                    <View className="flex-row items-center">
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            onPress={onClose}
                        />
                        <Text className="font-pmedium text-lg">
                            Select Users
                        </Text>
                    </View>

                    {selectedUsers.length > 0 && (
                        <Chip
                            mode="outlined"
                            textStyle={{ color: PRIMARY_COLOR }}
                            style={{ borderColor: PRIMARY_COLOR }}
                        >
                            {selectedUsers.length} selected
                        </Chip>
                    )}
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
                                        <IconButton
                                            {...props}
                                            icon={isUserSelected(item.user_id) ? "check-circle" : "circle-outline"}
                                            color={isUserSelected(item.user_id) ? PRIMARY_COLOR : "#757575"}
                                            size={24}
                                        />
                                    )}
                                />
                                <Divider />
                            </TouchableOpacity>
                        )}
                    />
                )}

                {selectedUsers.length > 0 && (
                    <View className="p-4 border-t border-gray-200">
                        <Button
                            mode="contained"
                            onPress={onClose}
                            style={{ backgroundColor: PRIMARY_COLOR, borderRadius: 16 }}
                        >
                            Done ({selectedUsers.length} selected)
                        </Button>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
});

// Component to display selected users
const SelectedUsersList = ({ users, onRemove }) => {
    const getUserInitials = (user) => {
        if (!user) return "?";
        const firstInitial = user.firstname ? user.firstname.charAt(0).toUpperCase() : "";
        const lastInitial = user.lastname ? user.lastname.charAt(0).toUpperCase() : "";
        return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || "?";
    };

    return (
        <View className="mt-2">
            <Text className="text-gray-600 mb-1">Selected Users ({users.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {users.map(user => (
                    <Chip
                        key={user.user_id}
                        avatar={
                            user.profile_image ? (
                                <Avatar.Image
                                    size={24}
                                    source={{ uri: user.profile_image }}
                                />
                            ) : (
                                <Avatar.Text
                                    size={24}
                                    label={getUserInitials(user)}
                                    backgroundColor={PRIMARY_COLOR}
                                    labelStyle={{ fontSize: 12 }}
                                />
                            )
                        }
                        onClose={() => onRemove(user)}
                        style={{ marginRight: 8, marginBottom: 8, backgroundColor: '#E8F5E9' }}
                    >
                        {user.firstname} {user.lastname}
                    </Chip>
                ))}
            </ScrollView>
        </View>
    );
};

const NotificationManager = () => {
    const { user } = useAuth();

    // Form states
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [icon, setIcon] = useState("bell");
    const [iconBgColor, setIconBgColor] = useState("#4285F4");
    const [type, setType] = useState("general");
    const [notificationType, setNotificationType] = useState("multiple");
    const [imageUri, setImageUri] = useState(null);

    // Multi-user selection
    const [selectedUsers, setSelectedUsers] = useState([]);

    // UI control states
    const [iconMenuVisible, setIconMenuVisible] = useState(false);
    const [colorMenuVisible, setColorMenuVisible] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);

    // User selection states
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Fetch users when component mounts or notification type changes
    useEffect(() => {
        if (notificationType === "multiple") {
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
        // Toggle selection
        const isSelected = selectedUsers.some(selectedUser =>
            selectedUser.user_id === user.user_id
        );

        if (isSelected) {
            // Remove from selected users
            setSelectedUsers(selectedUsers.filter(selectedUser =>
                selectedUser.user_id !== user.user_id
            ));
        } else {
            // Add to selected users
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    // Remove user from selection
    const removeSelectedUser = (userToRemove) => {
        setSelectedUsers(selectedUsers.filter(user =>
            user.user_id !== userToRemove.user_id
        ));
    };

    // Image picker function
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Reset form function
    const resetForm = () => {
        setTitle("");
        setBody("");
        setIcon("bell");
        setIconBgColor("#4285F4");
        setType("general");
        setSelectedUsers([]);
        setImageUri(null);
    };

    // Form validation
    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert("Error", "Title is required");
            return false;
        }

        // Validate field lengths according to database schema
        if (title.length > 255) {
            Alert.alert("Error", "Title must be less than 255 characters");
            return false;
        }

        if (body.length > 500) {
            Alert.alert("Error", "Body must be less than 500 characters");
            return false;
        }

        if (notificationType === "multiple" && selectedUsers.length === 0) {
            Alert.alert("Error", "Please select at least one user");
            return false;
        }

        return true;
    };

    // Image upload function
    const uploadImageToCloud = async (imageUri) => {
        const formData = new FormData();
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg'
        });

        try {
            console.log('Starting image upload...');
            console.log('FormData contents:', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'photo.jpg'
            });

            const response = await fetch(`${API_URL}/admin/notif/upload`, {
                method: 'POST',
                headers: {
                    'X-API-Key': AUTH_KEY,
                    'Accept': 'application/json',
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed with response:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: errorText
                });
                throw new Error(`Upload failed with status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Upload response data:', data);
            
            if (!data || !data.imageUrl) {
                console.error('Invalid response format:', data);
                throw new Error('No image URL received from server. Response format: ' + JSON.stringify(data));
            }

            return data.imageUrl;
        } catch (error) {
            console.error('Upload failed with details:', {
                error: error.message,
                stack: error.stack,
                imageUri: imageUri,
                formData: formData
            });
            throw error;
        }
    };

    // Handle sending notification
    const handleSendNotification = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            let endpoint, pushEndpoint;
            let imageUrl = null;

            if (imageUri) {
                try {
                    console.log('Attempting to upload image:', imageUri);
                    imageUrl = await uploadImageToCloud(imageUri);
                    console.log('Image uploaded successfully. URL:', imageUrl);
                } catch (error) {
                    console.error('Image upload error details:', {
                        error: error.message,
                        stack: error.stack,
                        imageUri: imageUri
                    });
                    Alert.alert(
                        "Upload Error",
                        `Failed to upload image: ${error.message}\n\nPlease try again or contact support if the problem persists.`
                    );
                    setLoading(false);
                    return;
                }
            }

            console.log("Final imageUrl:", imageUrl);

            if (notificationType === "all") {
                endpoint = `${API_URL}/notifications/store-notification-all`;
                pushEndpoint = `${API_URL}/admin/push-notify/broadcast`;

                // Prepare notification data
                const notificationData = {
                    title: title.trim(),
                    body: body.trim(),
                    icon: icon,
                    icon_bg_color: iconBgColor,
                    type: type,
                    data: {
                        imageUrl: imageUrl,
                        type: type,
                        timestamp: new Date().toISOString()
                    }
                };

                // Store notification in database
                await axios.post(endpoint, notificationData, {
                    headers: {
                        'X-API-Key': AUTH_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                // Send push notification to all users
                await axios.post(pushEndpoint, {
                    title: title.trim(),
                    body: body.trim(),
                    data: {
                        type: type,
                        icon: icon,
                        icon_bg_color: iconBgColor,
                        imageUrl: imageUrl
                    }
                }, {
                    headers: {
                        'X-API-Key': AUTH_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                Alert.alert(
                    "Success",
                    "Notification sent to all users successfully"
                );
            } else if (notificationType === "multiple") {
                endpoint = `${API_URL}/notifications/store-notification`;
                pushEndpoint = `${API_URL}/admin/push-notify/notify`;

                // Send database notifications and push notifications to each selected user
                const promises = selectedUsers.map(async user => {
                    // Prepare notification data
                    const notificationData = {
                        user_id: parseInt(user.user_id),
                        title: title.trim(),
                        body: body.trim(),
                        icon: icon,
                        icon_bg_color: iconBgColor,
                        type: type,
                        data: {
                            imageUrl: imageUrl,
                            type: type,
                            timestamp: new Date().toISOString()
                        }
                    };

                    await axios.post(endpoint, notificationData, {
                        headers: {
                            'X-API-Key': AUTH_KEY,
                            'Content-Type': 'application/json'
                        }
                    });

                    // Then send push notification if the user has a push token
                    if (user.push_token) {
                        await axios.post(pushEndpoint, {
                            user_id: parseInt(user.user_id),
                            title: title.trim(),
                            body: body.trim(),
                            data: {
                                type: type,
                                icon: icon,
                                icon_bg_color: iconBgColor,
                                imageUrl: imageUrl
                            }
                        }, {
                            headers: {
                                'X-API-Key': AUTH_KEY,
                                'Content-Type': 'application/json'
                            }
                        });
                    }
                });

                await Promise.all(promises);

                Alert.alert(
                    "Success",
                    `Notifications sent successfully to ${selectedUsers.length} users`
                );
            }

            resetForm();
        } catch (error) {
            console.error("Error sending notification:", {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            Alert.alert(
                "Error",
                `Failed to send notification: ${error.response?.data?.error || error.message}\n\nPlease try again or contact support if the problem persists.`
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
            borderRadius: 12.5,
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
        <View style={{ width: 25, height: 25, borderRadius: 12.5, backgroundColor: color, marginRight: 8 }} />
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
                            <Text className="font-pmedium text-[30px]">Notice Board</Text>
                        </View>

                        {/* Target Selection Section */}
                        <Surface className="p-4 rounded-lg mb-4 elevation-2 bg-white border border-gray-300">
                            <Text className="font-pmedium text-base mb-3">Send To</Text>
                            <RadioButton.Group
                                onValueChange={value => {
                                    setNotificationType(value);
                                    setSelectedUsers([]);
                                }}
                                value={notificationType}
                            >
                                <View className="flex-row flex-wrap">
                                    <View className="flex-row items-center mr-4 mb-2">
                                        <RadioButton value="multiple" color={PRIMARY_COLOR} />
                                        <Text>Select Users</Text>
                                    </View>
                                    <View className="flex-row items-center mb-2">
                                        <RadioButton value="all" color={PRIMARY_COLOR} />
                                        <Text>All Users</Text>
                                    </View>
                                </View>
                            </RadioButton.Group>

                            {notificationType === "multiple" && (
                                <View className="mt-2">
                                    <TouchableOpacity
                                        onPress={() => setUserModalVisible(true)}
                                        className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            <IconButton
                                                icon="account-group"
                                                size={24}
                                                color={PRIMARY_COLOR}
                                                style={{ margin: 0 }}
                                            />
                                            <Text className={selectedUsers.length > 0 ? "font-pmedium" : "text-gray-500"}>
                                                {selectedUsers.length > 0
                                                    ? `${selectedUsers.length} users selected`
                                                    : "Select users"}
                                            </Text>
                                        </View>
                                        <IconButton
                                            icon="chevron-right"
                                            size={24}
                                            color="#666"
                                        />
                                    </TouchableOpacity>

                                    {selectedUsers.length > 0 && (
                                        <>
                                            <SelectedUsersList
                                                users={selectedUsers}
                                                onRemove={removeSelectedUser}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setSelectedUsers([])}
                                                className="flex-row items-center justify-end mt-1"
                                            >
                                                <Text className="text-red-600 text-sm">Clear All</Text>
                                            </TouchableOpacity>
                                        </>
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

                            {/* Image Selection */}
                            <View className="mb-3">
                                <Text className="mb-1">Image (Optional)</Text>
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <IconButton
                                            icon="image"
                                            size={24}
                                            color={PRIMARY_COLOR}
                                            style={{ margin: 0 }}
                                        />
                                        <Text className={imageUri ? "font-pmedium" : "text-gray-500"}>
                                            {imageUri ? "Image selected" : "Select an image"}
                                        </Text>
                                    </View>
                                    <IconButton
                                        icon="chevron-right"
                                        size={24}
                                        color="#666"
                                    />
                                </TouchableOpacity>

                                {imageUri && (
                                    <View className="mt-2">
                                        <Image
                                            source={{ uri: imageUri }}
                                            style={{ width: '100%', height: 200, borderRadius: 8 }}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setImageUri(null)}
                                            className="absolute top-2 right-2 bg-gray-400 p-1 flex items-center justify-center"
                                            style={{ width: 24, height: 24 }}
                                        >
                                            <IconButton
                                                icon="close"
                                                size={16}
                                                color="white"
                                                style={{ margin: 0 }}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

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
                                                className="flex-row items-center border border-gray-300 p-2 rounded-lg"
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
                                                className="flex-row items-center border border-gray-300 p-2 rounded-lg"
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
                            Send NotificationF
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

                {/* User Selection Modal */}
                <UserSelectionModal
                    visible={userModalVisible}
                    onClose={() => setUserModalVisible(false)}
                    users={filteredUsers}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearch}
                    onUserSelect={selectUser}
                    usersLoading={usersLoading}
                    selectedUsers={selectedUsers}
                    multiSelect={true}
                />
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default NotificationManager;