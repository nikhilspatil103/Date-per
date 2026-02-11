import API_URL from '../config/api';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationService {
  async hasPermission() {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }

  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0
      });
      
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
    } catch (error) {
      console.log('Location unavailable (this is normal on web/simulator)');
      return null;
    }
  }

  async updateLocationOnServer() {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        console.log('Skipping location update - location unavailable');
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ location })
      });
      console.log('Location updated successfully');
    } catch (error) {
      console.log('Location update skipped');
    }
  }
}

export default new LocationService();
