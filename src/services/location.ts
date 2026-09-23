// Location service with real GPS functionality
let Location: any = null;
const SERVER_URL = process.env.EXPO_PUBLIC_RELAY_SERVER_URL || "http://localhost:3000/api/location";
try {
  Location = require('expo-location');

} catch (error) {
  console.log('expo-location not available, using mock location');
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export const getCurrentLocation = async (): Promise<LocationData> => {
  if (Location) {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Location error:', error);
      throw error;
    }
  } else {
    // Mock location for web/demo
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: Date.now(),
    };
  }
};

export const watchLocation = (callback: (location: LocationData) => void) => {
  if (Location) {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location: any) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );
  } else {
    // Mock watch for demo
    const interval = setInterval(() => {
      callback({
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        accuracy: 10,
        timestamp: Date.now(),
      });
    }, 5000);

    return {
      remove: () => clearInterval(interval),
    };
  }
};

// Add this to src/services/location.ts (with your existing code)
export const getCurrentLocationAPI = async (req: any, res: any) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return res.json({ error: 'Location permission denied' });
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    res.json({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    });
  } catch (error) {
    res.json({
      latitude: 12.9716,  // Bangalore fallback
      longitude: 77.5946,
    });
  }
};
export const sendLocationToServerOnce = async () => {
  const loc = await getCurrentLocation(); // uses your existing function
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: loc.latitude,
        longitude: loc.longitude,
      }),
    });
    console.log("Location sent to server:", loc.latitude, loc.longitude);
  } catch (e) {
    console.log("Error sending location:", e);
  }
}; 