/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */

import Geocoder from 'react-native-geocoding';
Geocoder.init("AIzaSyCPpmAHIqh2WVs3nN9c3op0J2vq9qgRaJs");

const GetCurrentAddressByLatLong = (props) => {
  console.log(props);
  let address = '';
  return new Promise((resolve, reject) => {
    Geocoder.from(props.lat, props.long)
      .then(json => {
        let results = json.results;
        console.log(results);
        // const { lat, lng } = results[0].geometry.location;
        const l = results.filter(
          (f) =>
            f.geometry.location.lat === props.lat &&
            f.geometry.location.lng === props.long,
        );
        console.log('l----------->', l);
        address = results;
        resolve({ results, latlng: props });
      })
      .catch(error => console.warn(error));
    return address;
  });
};

export default GetCurrentAddressByLatLong;
