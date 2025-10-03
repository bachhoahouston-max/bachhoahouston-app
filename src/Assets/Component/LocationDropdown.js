/* eslint-disable react-native/no-inline-styles */
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PermissionsAndroid,
  Image,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Constants from '../Helpers/constant';
import Geocoder from 'react-native-geocoding';
import {
  request,
  PERMISSIONS,
} from 'react-native-permissions';
import { LocationIcon } from '../../../Theme';
import GooglePlacesSDK from 'react-native-google-places-sdk';
GooglePlacesSDK.initialize('AIzaSyCPpmAHIqh2WVs3nN9c3op0J2vq9qgRaJs');
Geocoder.init("AIzaSyCPpmAHIqh2WVs3nN9c3op0J2vq9qgRaJs");

const LocationDropdown = props => {
  const [showList, setShowList] = useState(false);
  const [prediction, setPredictions] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState({});
  const refInput = useRef(null);
  useEffect(() => {
    setAddress(props.value);
  }, [props.value]);

  useEffect(() => {
    getLocation();
  }, []);
  useEffect(() => {
    if (props?.focus) {
      console.log(props?.focus);
      refInput.current.focus();
    } else {
      // refInput.current?.blur();
    }
  }, [props]);

  const getLocation = async (text) => {
    try {
      if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(async result => {
          console.log(result);
          if (result === 'granted') {
            GooglePlacesInput(text)
          }
        });
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log(PermissionsAndroid.RESULTS.GRANTED, granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the location');
        } else {
          console.log('location permission denied');
          // alert("Location permission denied");
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const GooglePlacesInput = async text => {

    GooglePlacesSDK.fetchPredictions(
      text, // query
      // { countries: ["in", "us"] } // filters
    )
      .then((predictions) => {
        setPredictions(predictions);
        setShowList(true);
        console.log(predictions)

      })
      .catch((error) => console.log(error));
  };


  const checkLocation = async add => {
    Geocoder.from(add)
      .then(json => {

        let locations = json.results;
        console.log(locations);
        if (locations.length > 0) {
          console.log(locations);
          const lat = locations[0].geometry.location;

          const components = locations[0].address_components;
          console.log(components);
          const country = components.find(item =>
            item.types.includes('country'),
          );
          const city =
            components.find(comp => comp.types.includes('locality'))?.long_name
            ||
            components.find(comp => comp.types.includes('postal_town'))
              ?.long_name ||
            components.find(comp =>
              comp.types.includes('administrative_area_level_3'),
            )?.long_name ||
            components.find(comp =>
              comp.types.includes('administrative_area_level_2'),
            )?.long_name ||
            components.find(comp =>
              comp.types.includes('sublocality_level_1'),
            )?.long_name ||
            components.find(comp =>
              comp.types.includes('sublocality'),
            )?.long_name ||
            components.find(comp =>
              comp.types.includes('neighborhood'),
            )?.long_name;
          console.log(city)

          let state = components.find(item =>
            item.types.includes('administrative_area_level_1'),
          );


          // ✅ Combine state with country or city
          const fullLocation = {
            lat,
            add,
            city: city || '',
            country: country?.long_name || '',
            state: state?.long_name || '',
          };

          // 🔁 Call parent function with all values
          console.log(fullLocation)
          props.getLocationValue(
            fullLocation.lat,
            fullLocation.add,
            fullLocation.city,
            fullLocation.country,
            fullLocation.state
          );

          setLocation(lat);
        }
      })
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Constants.white,
          height: 30,
          width: Dimensions.get('window').width - 110,
        }}>
        <View
          style={[
            styles.amountTimeMainView,
          ]}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={address}
              ref={refInput}
              placeholder={props?.placeholder || 'Address'}
              placeholderTextColor={Constants.customgrey}
              numberOfLines={5}
              style={[
                styles.amountTime,
                styles.editjobinput,
                { color: Constants.black },
              ]}
              onBlur={() => {
                props.setIsFocus(false);
                setShowList(false);
              }}
              onFocus={() => {
                props.setIsFocus(props.focus);
              }}
              onChangeText={location => {
                GooglePlacesInput(location);
                setAddress(location);
              }}
            />
          </View>
        </View>
      </View>
      {prediction != '' && showList && (
        <View style={prediction && styles.list}>
          {prediction.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: Constants.lightgrey,
              }}
              onPress={() => console.log('pressed')}>

              <LocationIcon
                height={18}
                width={18}
                color={Constants.white}
                style={{ marginHorizontal: 5 }}
              />
              <Text
                style={styles.item}
                onPress={() => {
                  console.log('pressed');
                  console.log('item==>', item);
                  console.log('itemdec==>', item.description);
                  refInput.current?.blur();
                  setAddress(item?.description);
                  checkLocation(item?.description);
                  setShowList(false);
                  setTimeout(() => {
                    props.setIsFocus(false);
                  }, 300);
                }}>
                {item?.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>


  );
};

const styles = StyleSheet.create({
  editjobinput: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    marginLeft: 2,
  },
  amountTimeMainView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  amountTime: {
    color: Constants.white,
    fontSize: 16,
    marginLeft: 5,
  },
  list: {
    marginVertical: 10,
    position: 'absolute',
    top: 20,
    width: '100%',
    borderColor: Constants.lightgrey,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: Constants.saffron,
    zIndex: 10,
  },
  item: {
    fontSize: 13,
    height: 'auto',
    marginVertical: 5,
    width: Dimensions.get('window').width - 100,
    flexWrap: 'wrap',
    zIndex: 30,
    flex: 1,
    color: Constants.white,
  },
  validateBorder: {
    borderBottomColor: Constants.red,
    borderBottomWidth: 1,
    paddingBottom: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});

export default LocationDropdown;
