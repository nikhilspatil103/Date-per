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
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async updateLocationOnServer() {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return;

      const token = await AsyncStorage.getItem('authToken');
      await fetch('http://192.168.1.102:3000/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ location })
      });
    } catch (error) {
      console.error('Update location error:', error);
    }
  }
}

export default new LocationService();
