/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import Video from 'react-native-video';
import {useTranslation} from 'react-i18next';
import Toast from 'react-native-toast-message';
import {Post} from '../Helpers/Service';
import Constants from '../Helpers/constant';

// Repeating buzz pattern (ms): wait, vibrate, wait, vibrate…
const VIBRATION_PATTERN = [0, 700, 400, 700, 400, 700];
// Runaway safety: stop the ring + buzz after this long even if left untouched.
const MAX_ALERT_MS = 120000;
// Looping ringtone that plays while the alert modal is open — same audio as the
// push notification sound (android res/raw/pickup_alert.wav, iOS bundle).
const RING = require('../sound/pickup_alert.wav');

// Global foreground alert for the "I'm Here" push. App.js emits 'pickupAlert'
// (from the OneSignal foreground + click listeners); this pops a modal, rings +
// buzzes the device, and offers Acknowledge / Close.
const notify = msg => Toast.show({type: 'info', text1: msg});

const PickupAlertModal = () => {
  const {t} = useTranslation();
  const [alert, setAlert] = useState(null);
  const [ringing, setRinging] = useState(false);
  const [acking, setAcking] = useState(false);
  const stopTimer = useRef(null);

  const stopAlarm = () => {
    Vibration.cancel();
    setRinging(false);
    if (stopTimer.current) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
  };

  const dismiss = () => {
    stopAlarm();
    setAcking(false);
    setAlert(null);
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('pickupAlert', data => {
      if (!data) return;
      stopAlarm();
      setAlert(data);
      setRinging(true);
      Vibration.vibrate(VIBRATION_PATTERN, true);
      stopTimer.current = setTimeout(stopAlarm, MAX_ALERT_MS);
    });
    return () => {
      sub.remove();
      stopAlarm();
    };
  }, []);

  const acknowledge = () => {
    if (!alert?.alertId) {
      dismiss();
      return;
    }
    setAcking(true);
    stopAlarm();
    Post('acknowledgePickupAlert', {alertId: alert.alertId, source: 'in-app'}).then(
      res => {
        setAcking(false);
        if (res?.status === false) {
          notify(res?.message || t('Could not acknowledge, please retry'));
        } else {
          notify(res?.data?.message || t('Pickup acknowledged'));
        }
        dismiss();
      },
      () => {
        setAcking(false);
        notify(t('Could not acknowledge, please retry'));
        dismiss();
      },
    );
  };

  if (!alert) return null;

  const car = [alert.carColor, alert.carBrand].filter(Boolean).join(' ');
  const where =
    alert.pickupType === 'curbside'
      ? `${t('Parking spot')} ${alert.parkingNo || '?'}${car ? ` · ${car}` : ''}`
      : t('In-store pickup counter');

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent>
      {ringing && (
        <Video
          source={RING}
          repeat
          paused={false}
          volume={1.0}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          style={{width: 0, height: 0}}
          onError={e => console.log('[pickup] ring sound error', e)}
        />
      )}
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 22,
          }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#9A3412',
              textAlign: 'center',
            }}>
            {t('Customer waiting for pickup')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: '#7C2D12',
              textAlign: 'center',
              marginTop: 8,
            }}>
            {t('Order')} {alert.orderId || ''}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#444',
              textAlign: 'center',
              marginTop: 4,
            }}>
            {where}
          </Text>

          <View style={{flexDirection: 'row', marginTop: 22, gap: 12}}>
            <TouchableOpacity
              onPress={dismiss}
              disabled={acking}
              style={{
                flex: 1,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                backgroundColor: '#fff',
              }}>
              <Text style={{color: '#374151', fontWeight: '700'}}>
                {t('Close')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={acknowledge}
              disabled={acking}
              style={{
                flex: 1,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                backgroundColor: Constants.saffron || '#F59E0B',
              }}>
              {acking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{color: '#fff', fontWeight: '800'}}>
                  {t('Acknowledge')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PickupAlertModal;
