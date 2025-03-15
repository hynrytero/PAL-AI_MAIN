import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { storeRecommenderApi } from "../api/nearby-api";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { API_MAPS } from '@env';

const GOOGLE_MAPS_API_KEY = API_MAPS;

const Nearby = () => {
    const [region, setRegion] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const locationSubscription = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        requestLocationPermission();
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const setupLocationTracking = async () => {
            if (isNavigating) {
                if (locationSubscription.current) {
                    await locationSubscription.current.remove();
                }

                const subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    async (location) => {
                        if (!isMounted) return;

                        const newUserLocation = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        };
                        setUserLocation(newUserLocation);

                        if (selectedStore) {
                            await fetchRoute(newUserLocation, selectedStore);
                        }
                    }
                );

                locationSubscription.current = subscription;
            } else {
                if (locationSubscription.current) {
                    await locationSubscription.current.remove();
                    locationSubscription.current = null;
                }
            }
        };

        setupLocationTracking();

        return () => {
            isMounted = false;
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, [isNavigating, selectedStore]);

    const decodePolyline = (encoded) => {
        const points = [];
        let index = 0, lat = 0, lng = 0;

        while (index < encoded.length) {
            let shift = 0, result = 0;

            let byte;
            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;

            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            points.push({
                latitude: lat * 1e-5,
                longitude: lng * 1e-5,
            });
        }

        return points;
    };

    const fetchRoute = async (origin, destination) => {
        setRouteLoading(true);
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.geometry.location.lat},${destination.geometry.location.lng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
            );

            const result = await response.json();

            if (!result.routes || result.routes.length === 0) {
                throw new Error('No routes found');
            }

            if (result.routes.length) {
                const route = result.routes[0];
                const points = decodePolyline(route.overview_polyline.points);
                setRouteCoordinates(points);

                const leg = route.legs[0];
                setRouteDetails({
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: leg.steps.map(step => ({
                        distance: step.distance.text,
                        duration: step.duration.text,
                        instructions: step.html_instructions.replace(/<[^>]*>/g, ''),
                    }))
                });

                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(points, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            Alert.alert('Error', 'Unable to fetch route. Please try again.');

            if (isNavigating) {
                setIsNavigating(false);
            }
        } finally {
            setRouteLoading(false);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                getUserLocation();
            } else {
                setLoading(false); // Stop loading if permission denied
                Alert.alert(
                    "Location Permission Required",
                    "To use this feature, please enable location access in your settings.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Settings", onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to request location permissions.');
        }
    };

    const getUserLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            const userCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setUserLocation(userCoords);
            setRegion({
                ...userCoords,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });

            fetchNearbyStores(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error('Error getting user location:', error);
            setLoading(false);
            Alert.alert('Error', 'Unable to get your location. Please check your device settings.');
        }
    };

    const fetchNearbyStores = async (latitude, longitude) => {
        try {
            const storesData = await storeRecommenderApi.fetchNearbyStores(latitude, longitude);
            if (storesData) {
                setStores(storesData);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            Alert.alert('Error', 'Unable to fetch nearby stores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleNavigation = async () => {
        if (!isNavigating) {
            if (!selectedStore || !userLocation) {
                Alert.alert("Select a Store", "Please select a store to navigate.");
                return;
            }

            try {
                await fetchRoute(userLocation, selectedStore);
                setIsNavigating(true);
            } catch (error) {
                Alert.alert('Error', 'Unable to start navigation. Please try again.');
            }
        } else {
            setIsNavigating(false);
            setRouteCoordinates(null);
            setRouteDetails(null);

            if (mapRef.current && userLocation) {
                setTimeout(() => {
                    mapRef.current.animateToRegion({
                        ...userLocation,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }, 500);
                }, 100);
            }
        }
    };

    const renderHeader = () => (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 23,
            backgroundColor: "transparent",
            borderBottomWidth: 1,
            borderBottomColor: "#rgba(0, 0, 0, 0.1)"
        }}>
            <TouchableOpacity onPress={() => router.back()}>
                <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: "600", marginLeft: 15,  paddingBottom : 0 }}>
                {isNavigating ? "Navigation" : "Agricultural Stores"}
            </Text>
        </View>
    );

    const renderStoreInfo = () => {
        if (!selectedStore) return null;

        return (
            <View style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
                width: "90%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
            }}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {selectedStore.name}
                </Text>
                <Text style={{ marginTop: 5, color: "#666" }}>
                    {selectedStore.vicinity}
                </Text>
                {routeDetails && (
                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#eee" }}>
                        <Text style={{ fontWeight: "500" }}>
                            {routeDetails.distance} • {routeDetails.duration}
                        </Text>
                        {routeDetails.steps[0] && (
                            <Text numberOfLines={2} style={{ marginTop: 5, color: "#666" }}>
                                Next: {routeDetails.steps[0].instructions}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            {renderHeader()}

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text style={{ marginTop: 10, color: "#666" }}>Loading nearby stores...</Text>
                    </View>
                ) : region ? (
                    <View style={{ flex: 1 }}>
                        <MapView
                            ref={mapRef}
                            style={{ flex: 1 }}
                            region={region}
                            provider={PROVIDER_GOOGLE}
                            showsUserLocation={true}
                            showsCompass={true}
                            onPress={() => !isNavigating && setSelectedStore(null)}
                        >
                            {stores.map((store, index) => (
                                <Marker
                                    key={index}
                                    coordinate={{
                                        latitude: store.geometry.location.lat,
                                        longitude: store.geometry.location.lng,
                                    }}
                                    title={store.name}
                                    description={store.vicinity}
                                    onPress={() => !isNavigating && setSelectedStore(store)}
                                    pinColor={selectedStore === store ? "#e74c3c" : "#27ae60"}
                                />
                            ))}
                            {routeCoordinates && (
                                <Polyline
                                    coordinates={routeCoordinates}
                                    strokeColor="#0066cc"
                                    strokeWidth={5}
                                />
                            )}
                        </MapView>
                    </View>
                ) : (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text>Unable to access location. Please try again.</Text>
                        <TouchableOpacity
                            style={{
                                marginTop: 15,
                                backgroundColor: "#0066cc",
                                paddingVertical: 10,
                                paddingHorizontal: 15,
                                borderRadius: 5,
                            }}
                            onPress={requestLocationPermission}
                        >
                            <Text style={{ color: "white", fontWeight: "600" }}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom panel */}
                {selectedStore && (
                    <View style={{
                        position: "absolute",
                        bottom: 47,
                        left: 0,
                        right: 0,
                        alignItems: "center",
                        padding: 15,
                    }}>
                        {renderStoreInfo()}

                        <TouchableOpacity
                            style={{
                                backgroundColor: isNavigating ? "#e74c3c" : "forestgreen",
                                paddingVertical: 12,
                                paddingHorizontal: 20,
                                borderRadius: 8,
                                width: "90%",
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                opacity: routeLoading ? 0.7 : 1,
                            }}
                            onPress={toggleNavigation}
                            disabled={routeLoading}
                        >
                            {routeLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon
                                        name={isNavigating ? "close" : "directions"}
                                        size={20}
                                        color="#fff"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                                        {isNavigating ? "End Navigation" : "Start Navigation"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default Nearby;