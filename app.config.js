import 'dotenv/config';

export default {
  expo: {
    name: "PAL-AI",
    slug: "PAL-AI",
    scheme: "pal-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/splash.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "dev.expo.palai",
      config: {
        googleMapsApiKey: process.env.API_MAPS // Google Maps API key for iOS
      }
    },
    android: {
      "softwareKeyboardLayoutMode": "pan",
      adaptiveIcon: {
        foregroundImage: "./assets/splash.png",
        backgroundColor: "#ffffff"
      },
      package: "dev.expo.palai",
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: process.env.API_MAPS 
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store"
    ],
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "c2a02923-aa81-4100-9b4a-40993f42ff77"
      },
      AUTH_KEY: process.env.AUTH_KEY,
      API_URL_BCNKEND: process.env.API_URL_BCNKEND,
      API_URL_AI: process.env.API_URL_AI,
      API_MAPS: process.env.API_MAPS,
      API_WEATHER: process.env.API_WEATHER
    },
    owner: "henryjankun"
  }
};