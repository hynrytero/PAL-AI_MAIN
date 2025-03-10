import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import WeatherCard from "../../components/SmallCard";
import { images, icons } from "../../constants";
import { weatherApi } from "../api/weather-api";
import { useFocusEffect } from "@react-navigation/native";

const Home = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock in real-time every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(clockInterval);
  }, []);

  const fetchLocationAndWeather = async () => {
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
    } catch (error) {
      console.error("Error fetching location or weather data:", error);
      setErrorMsg("Unable to fetch weather data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLocationAndWeather();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLocationAndWeather();
    }, [])
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
    // Map icon codes to local images if needed
    // For now, using the API icons
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

  // Format date in a more detailed way (e.g., "Monday, March 3, 2025")
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
        className="flex-1 h-full justify-center items-center"
        resizeMode="cover"
        imageStyle={{ opacity: 0.03 }}
      >
        <ActivityIndicator size="large" color="#24609B" />
        <Text className="text-lg text-[#24609B] mt-4">
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
        className="flex-1 h-full justify-center items-center"
        resizeMode="cover"
        imageStyle={{ opacity: 0.03 }}
      >
        <Text className="text-lg text-[#24609B] text-center px-4">
          {errorMsg || "Unable to load weather data. Please try again."}
        </Text>
      </ImageBackground>
    );
  }

  const currentWeather = weatherData.list[0];
  const dailyForecast = weatherData.list.slice(1, 4);
  const hourlyForecast = weatherData.list.slice(0, 24);

  return (
    <ImageBackground
      source={images.backgroundmain}
      className="flex-1 h-full"
      resizeMode="cover"
      imageStyle={{ opacity: 0.03 }}
    >
      <ScrollView 
        className="mb-[50px]"
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={images.backgroundweather}
          className="h-auto bg-[#C4E2FF] rounded-b-[30px] overflow-hidden"
          resizeMode="cover"
        >
          <View className="w-full h-auto px-7 pt-12 pb-4 rounded-b-[30px] flex-col items-center">
            {/* Location and time header */}
            <View className="flex-row items-start justify-between w-full my-5">
              <View className="flex-row w-auto items-center">
                <Image
                  source={icons.pin}
                  className="h-[25px] w-[25px] mr-3"
                  resizeMode="contain"
                />
                <Text className="font-psemibold text-[20px] text-[#24609B]">
                  {weatherData.city.name}
                </Text>
              </View>
              <Text className="text-[#24609B]">
                Today{" "}
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            </View>
            
            {/* Current weather */}
            <Image
              source={getWeatherIcon(currentWeather.weather[0].icon)}
              className="h-[150px] w-[150px]"
              resizeMode="contain"
            />
            <Text className="font-pmedium text-[50px] text-[#24609B]">
              {Math.round(currentWeather.main.temp)}°
            </Text>
            <Text className="text-lg text-[#24609B]">
              {capitalizeFirstLetter(currentWeather.weather[0].description)}
            </Text>

            {/* Weather details */}
            <View className="flex-row mx-7 mt-5 bg-[#D3E9FF] w-full rounded-[5px] p-[5px] justify-between items-center">
              <View className="flex-row w-auto items-center">
                <Image
                  source={icons.eye1}
                  className="h-[25px] w-[25px] mr-3"
                  resizeMode="contain"
                />
                <Text className="text-lg text-[#24609B]">
                  {currentWeather.main.humidity}%
                </Text>
              </View>
              <View className="flex-row w-auto items-center">
                <Image
                  source={icons.drop}
                  className="h-[25px] w-[25px] mr-3"
                  resizeMode="contain"
                />
                <Text className="text-lg text-[#24609B]">
                  {`${Math.round(currentWeather.pop * 100 || 0)}%`}
                </Text>
              </View>
              <View className="flex-row w-auto items-center">
                <Image
                  source={icons.wind}
                  className="h-[25px] w-[25px] mr-3"
                  resizeMode="contain"
                />
                <Text className="text-lg text-[#24609B]">
                  {Math.round(currentWeather.wind.speed)} m/s
                </Text>
              </View>
            </View>

            {/* 3-day forecast */}
            <View className="flex-row mx-7 mt-5 bg-[#D3E9FF] w-full rounded-[5px] p-[10px] justify-between items-center">
              {dailyForecast.map((item, index) => (
                <View
                  key={index}
                  className="bg-[#5284B7] w-[100px] rounded-[5px] justify-center items-center p-3 overflow-hidden"
                >
                  <Image
                    source={images.circlesun}
                    className="absolute bottom-[-50] right-[-30]"
                  />
                  <Text className="text-white font-pmedium text-md">
                    {formatDay(item.dt)}
                  </Text>
                  <Text className="font-pregular text-[40px] text-white">
                    {Math.round(item.main.temp)}°
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ImageBackground>

        {/* Hourly Forecast */}
        <View className="w-full h-auto pl-7">
          <View className="flex-row justify-between w-full py-3 pr-7">
            <Text className="font-psemibold">Today</Text>
            <Text className="font-pmedium">
              {formatDate(currentTime)}
            </Text>
          </View>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            className="flex-row bg-blue-200 rounded-[5px] p-3 w-[370px] overflow-scroll mr-7"
          >
            {hourlyForecast.map((item, index) => (
              <WeatherCard
                key={index}
                time={new Date(item.dt * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                image={{
                  uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
                }}
                degrees={Math.round(item.main.temp)}
                bgcolor="#7BAFE3"
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Home;