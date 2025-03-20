import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeatherCard from "../../components/SmallCard";
import { images, icons } from "../../constants";
import { weatherApi } from "../api/weather-api";
import { useFocusEffect } from "@react-navigation/native";

const Home = () => {
  const { width, height } = useWindowDimensions();
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Storage keys
  const WEATHER_DATA_KEY = 'weather_data';
  const LOCATION_DATA_KEY = 'location_data';
  const LAST_FETCH_TIME_KEY = 'last_fetch_time';

  // Cache expiration time (in milliseconds) - 1hr ni
  const CACHE_EXPIRATION = 60 * 60 * 1000;

  // Update clock in real-time every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(clockInterval);
  }, []);

  // Load cached data
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [weatherDataJson, locationDataJson, lastFetchTimeJson] = await Promise.all([
          AsyncStorage.getItem(WEATHER_DATA_KEY),
          AsyncStorage.getItem(LOCATION_DATA_KEY),
          AsyncStorage.getItem(LAST_FETCH_TIME_KEY)
        ]);

        if (weatherDataJson && locationDataJson && lastFetchTimeJson) {
          const cachedWeatherData = JSON.parse(weatherDataJson);
          const cachedLocation = JSON.parse(locationDataJson);
          const cachedLastFetchTime = JSON.parse(lastFetchTimeJson);
          const now = new Date().getTime();

          // Check if cache is still valid
          if (now - cachedLastFetchTime < CACHE_EXPIRATION) {
            setWeatherData(cachedWeatherData);
            setLocation(cachedLocation);
            setLastFetchTime(cachedLastFetchTime);
            setLoading(false);
            console.log("Using cached weather data");
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Error loading cached data:", error);
        return false;
      }
    };

    loadCachedData().then(hasCachedData => {
      if (!hasCachedData) {
        fetchLocationAndWeather();
      }
    });
  }, []);

  const saveDataToCache = async (weatherData, location) => {
    const now = new Date().getTime();
    try {
      await Promise.all([
        AsyncStorage.setItem(WEATHER_DATA_KEY, JSON.stringify(weatherData)),
        AsyncStorage.setItem(LOCATION_DATA_KEY, JSON.stringify(location)),
        AsyncStorage.setItem(LAST_FETCH_TIME_KEY, JSON.stringify(now))
      ]);
      setLastFetchTime(now);
      console.log("Weather data cached successfully");
    } catch (error) {
      console.error("Error caching data:", error);
    }
  };

  const fetchLocationAndWeather = async (forceRefresh = false) => {
    // If not forcing refresh and we have recent data, use cached data
    if (!forceRefresh && lastFetchTime) {
      const now = new Date().getTime();
      if (now - lastFetchTime < CACHE_EXPIRATION && weatherData) {
        console.log("Using existing data, no need to refresh");
        setRefreshing(false);
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);

    // Request permission to access location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      Alert.alert(
        "Location Error",
        "Please enable location permissions to get accurate weather data.",
        [{ text: "OK" }]
      );
      setLoading(false);
      return;
    }

    try {
      // Fetch current location with high accuracy
      const locationData = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000, // Allow cached location up to 10 seconds old to improve performance
      });

      const coordinates = {
        latitude: Number(locationData.coords.latitude),
        longitude: Number(locationData.coords.longitude),
      };

      setLocation(coordinates);

      // Fetch weather data
      const data = await weatherApi.fetchWeather(
        coordinates.latitude,
        coordinates.longitude
      );

      setWeatherData(data);

      // Cache the new data
      saveDataToCache(data, coordinates);
    } catch (error) {
      console.error("Error fetching location or weather data:", error);
      setErrorMsg("Unable to fetch weather data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocationAndWeather(true);
  }, []);

  // Refresh data when screen comes into focus, but only if cache is expired
  useFocusEffect(
    useCallback(() => {
      if (lastFetchTime) {
        const now = new Date().getTime();
        if (now - lastFetchTime > CACHE_EXPIRATION || !weatherData) {
          console.log("Cache expired, refreshing data");
          fetchLocationAndWeather();
        }
      } else if (!weatherData) {
        fetchLocationAndWeather();
      }
    }, [lastFetchTime, weatherData])
  );

  // Helper functions
  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getWeatherIcon = (iconCode) => {
    return { uri: `https://openweathermap.org/img/wn/${iconCode}@2x.png` };
  };

  const formatDay = (timestamp) => {
    const forecastDate = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Normalize dates to midnight for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    forecastDate.setHours(0, 0, 0, 0);

    if (forecastDate.getTime() === today.getTime()) {
      return "Today";
    } else if (forecastDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return forecastDate.toLocaleDateString("en-US", { weekday: "long" });
    }
  };

  // Format date in a more detailed way
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Loading state
  if (loading) {
    return (
      <ImageBackground
        source={images.backgroundmain}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.03 }}
      >
        <ActivityIndicator size="large" color="#24609B" />
        <Text style={{ fontSize: 18, color: '#24609B', marginTop: 16 }}>
          Loading weather data...
        </Text>
      </ImageBackground>
    );
  }

  // Error state
  if (errorMsg || !weatherData) {
    return (
      <ImageBackground
        source={images.backgroundmain}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.03 }}
      >
        <Text style={{ fontSize: 18, color: '#24609B', textAlign: 'center', paddingHorizontal: 16 }}>
          {errorMsg || "Unable to load weather data. Please try again."}
        </Text>
      </ImageBackground>
    );
  }

  const currentWeather = weatherData.list[0];
  const hourlyForecast = weatherData.list.slice(0, 24);

  // Get forecasts for 3 days 
  const dailyForecast = weatherData.list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000).toDateString();
    // Skip today 
    if (date !== new Date().toDateString() && !acc.some(i => new Date(i.dt * 1000).toDateString() === date)) {
      acc.push(item);
    }
    return acc.slice(0, 3); // pila ka days
  }, []);

  // Calculate responsive dimensions
  const cardWidth = width * 0.25;
  const horizontalPadding = width * 0.05;
  const contentWidth = width - (horizontalPadding * 2);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={images.backgroundmain}
        style={{ flex: 1 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.03 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 39 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#24609B"]}
              tintColor="#24609B"
              title="Pulling for fresh weather data..."
              titleColor="#5284B7"
            />
          }
        >
          <ImageBackground
            source={images.backgroundweather}
            style={{
              backgroundColor: '#C4E2FF',
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              overflow: 'hidden'
            }}
            resizeMode="cover"
          >
            <View style={{
              paddingHorizontal: horizontalPadding,
              paddingTop: height * 0.06,
              paddingBottom: height * 0.02,
              alignItems: 'center'
            }}>
              {/* Location and time header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                marginVertical: height * 0.02
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={icons.pin}
                    style={{ height: 25, width: 25, marginRight: 12 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 20, color: '#24609B', fontWeight: '600' }}>
                    {weatherData.city.name}
                  </Text>
                </View>
                <Text style={{ color: '#24609B' }}>
                  Today{" "}
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </View>

              {/* Current weather */}
              <Image
                source={getWeatherIcon(currentWeather.weather[0].icon)}
                style={{ height: height * 0.15, width: height * 0.15, marginBottom: height * 0.01 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 50, color: '#24609B', fontWeight: '500' }}>
                {Math.round(currentWeather.main.temp)}°
              </Text>
              <Text style={{ fontSize: 18, color: '#24609B', marginBottom: height * 0.01 }}>
                {capitalizeFirstLetter(currentWeather.weather[0].description)}
              </Text>

              {/* Weather details */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#D3E9FF',
                width: '100%',
                borderRadius: 5,
                padding: 10,
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: height * 0.02
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                  <Image
                    source={icons.eye1}
                    style={{ height: 25, width: 25, marginRight: 8 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 16, color: '#24609B' }}>
                    {currentWeather.main.humidity}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={icons.drop}
                    style={{ height: 25, width: 25, marginRight: 8 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 16, color: '#24609B' }}>
                    {`${Math.round(currentWeather.pop * 100 || 0)}%`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                  <Image
                    source={icons.wind}
                    style={{ height: 25, width: 25, marginRight: 8 }}
                    resizeMode="contain"
                  /><Text style={{ fontSize: 16, color: '#24609B' }}>
                    {Math.round(currentWeather.wind.speed)} m/s</Text>
                </View>
              </View>

              {/* 3-day forecast */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#D3E9FF',
                width: '100%',
                borderRadius: 5,
                padding: 10,
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: height * 0.02
              }}>
                {dailyForecast.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#5284B7',
                      width: '30%',
                      aspectRatio: 1,
                      borderRadius: 5,
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 12,
                      overflow: 'hidden',
                      marginHorizontal: index === 1 ? '3%' : 0 // Add space between cards
                    }}
                  >
                    <Image
                      source={getWeatherIcon(item.weather[0].icon)}
                      style={{
                        position: 'absolute',
                        bottom: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        opacity: 0.6
                      }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: '500',
                        fontSize: 14,
                        textAlign: 'center'
                      }}
                      numberOfLines={1}
                    >
                      {formatDay(item.dt)}
                    </Text>
                    <Text style={{ fontSize: 36, color: 'white' }}>
                      {Math.round(item.main.temp)}°
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ImageBackground>

          {/* Hourly Forecast */}
          <View style={{
            paddingHorizontal: horizontalPadding,
            marginTop: height * 0.02
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              paddingVertical: 12
            }}>
              <Text style={{ fontWeight: '700', fontSize: 16, marginBottom:0, marginLeft: 7}}>Today</Text>
              <Text style={{ fontWeight: '500' }}> {formatDate(currentTime)} </Text>
            </View>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={{
                backgroundColor: '#D3E9FF',
                borderRadius: 5,
                padding: 12,
                marginBottom: 20
              }}
              contentContainerStyle={{
                paddingRight: 12
              }}
            >
              {hourlyForecast.map((item, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: '#7BAFE3',
                    padding: 10,
                    borderRadius: 5,
                    alignItems: 'center',
                    marginRight: 10,
                    width: 70
                  }}
                >
                  <Text style={{ color: 'white', marginBottom: 5 }}>
                    {new Date(item.dt * 1000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Image
                    source={{
                      uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
                    }}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: 'white', fontSize: 16 }}>
                    {Math.round(item.main.temp)}°
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Home;