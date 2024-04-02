/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import ReactNativeBiometrics, {BiometryTypes} from 'react-native-biometrics';
const StartScreen = () => {
  const [currentLat, setCurrentLat] = useState('');
  const [currentLng, setCurrentLng] = useState('');
  const [currentAlt, setCurrentAlt] = useState('');
  const [insideSqubix, setInsideSqubix] = useState(false);

  const geofenceRadiusKm = 0.05;
  const rnBiometrics = new ReactNativeBiometrics({
    allowDeviceCredentials: true,
  });
  const squbixLocation = {
    latitude: 20.3493896,
    longitude: 85.8077888,
    altitude: 34.80000305175781,
  };
  const getDistanceFromLatLonInKm = useCallback((lat1, lon1, lat2, lon2) => {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  }, []);
  const checkGeofence = useCallback(
    (currentLat, currentLng, currentAlt) => {
      const distanceFromCenter = getDistanceFromLatLonInKm(
        currentLat,
        currentLng,
        squbixLocation.latitude,
        squbixLocation.longitude,
      );
      const altitudeDifference = Math.abs(currentAlt - squbixLocation.altitude);
      if (distanceFromCenter <= geofenceRadiusKm && altitudeDifference <= 10) {
        console.log('Inside geofence');
        rnBiometrics.isSensorAvailable().then(resultObject => {
          const {available, biometryType} = resultObject;

          if (available && biometryType === BiometryTypes.TouchID) {
            console.log('TouchID is supported');
          } else if (available && biometryType === BiometryTypes.FaceID) {
            console.log('FaceID is supported');
          } else if (available && biometryType === BiometryTypes.Biometrics) {
            console.log('Biometrics is supported');
            rnBiometrics
              .simplePrompt({promptMessage: 'Confirm fingerprint'})
              .then(resultObject => {
                const {success} = resultObject;

                if (success) {
                  console.log('Successful biometrics provided.');
                  console.log('User Is Inside Squbix.');

                  console.log(
                    'Latitude : ' +
                      currentLat +
                      'Longitude :' +
                      currentLng +
                      ' Altitude :' +
                      currentAlt +
                      '',
                  );
                } else {
                  console.log('user cancelled biometric prompt');
                }
              })
              .catch(() => {
                console.log('biometrics failed');
              });
          } else {
            console.log('Biometrics not supported');
          }
        });
      } else {
        console.log('Outside geofence');
      }
    },
    [
      getDistanceFromLatLonInKm,
      rnBiometrics,
      squbixLocation.latitude,
      squbixLocation.longitude,
      squbixLocation.altitude,
    ],
  );
  const getCurrentLocationAndCheckGeofence = useCallback(() => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude, altitude} = position.coords;
        checkGeofence(latitude, longitude, altitude);
      },
      error => {
        console.log(error.code, error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  }, [checkGeofence]);

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization('whenInUse');
        getLocation();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This App needs to Access your location',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocation();
        } else {
          console.log('Location permission denied');
        }
      }
    };

    const getLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          console.log(position);
          setCurrentLat(position?.coords?.latitude);
          setCurrentLng(position?.coords?.longitude);
          setCurrentAlt(position?.coords?.altitude);
        },
        error => {
          console.log(error.code, error.message);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    getCurrentLocationAndCheckGeofence();
  }, [currentLat, currentLng, currentAlt, getCurrentLocationAndCheckGeofence]);
  return (
    <View style={{ flex: 1,}}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'pink',
        }}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
          Current Location:
        </Text>
        <Text style={{fontSize: 16}}>Latitude: {currentLat}</Text>
        <Text style={{fontSize: 16}}>Longitude: {currentLng}</Text>
        <Text style={{fontSize: 16}}>Altitude: {currentAlt}</Text>
      </View>
    </View>
  );
};

export default StartScreen;
