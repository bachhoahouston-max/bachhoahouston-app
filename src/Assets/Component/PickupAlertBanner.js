/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {GetApi, Post} from '../Helpers/Service';
import Constants from '../Helpers/constant';
import {ToastContext} from '../../../App';

const POLL_MS = 15000;

// Live "customer arrived for pickup" banner for staff. Mirrors the push
// notification: shows every unacknowledged arrival with an Acknowledge button
// that stops the backend re-alert loop.
const PickupAlertBanner = () => {
  const {t} = useTranslation();
  const isFocused = useIsFocused();
  const [, setToast] = useContext(ToastContext);
  const [alerts, setAlerts] = useState([]);
  const [ackingId, setAckingId] = useState(null);
  const timer = useRef(null);

  const load = useCallback(() => {
    GetApi('getActivePickupAlerts').then(
      res => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setAlerts(list.filter(a => a?.status === 'waiting'));
      },
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!isFocused) {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      return;
    }
    load();
    timer.current = setInterval(load, POLL_MS);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [isFocused, load]);

  const acknowledge = alert => {
    setAckingId(alert._id);
    Post('acknowledgePickupAlert', {alertId: alert._id, source: 'in-app'}).then(
      res => {
        setAckingId(null);
        if (res?.status === false) {
          setToast(res?.message || t('Could not acknowledge, please retry'));
          load();
          return;
        }
        setToast(res?.data?.message || t('Pickup acknowledged'));
        setAlerts(prev => prev.filter(a => a._id !== alert._id));
      },
      () => {
        setAckingId(null);
        setToast(t('Could not acknowledge, please retry'));
        load();
      },
    );
  };

  if (!alerts.length) {
    return null;
  }

  return (
    <View style={{paddingHorizontal: 12, paddingTop: 10}}>
      {alerts.map(alert => {
        const car = [alert.carColor, alert.carBrand].filter(Boolean).join(' ');
        const where =
          alert.pickupType === 'curbside'
            ? `${t('Parking spot')} ${alert.parkingNo || '?'}${
                car ? ` · ${car}` : ''
              }`
            : t('In-store pickup counter');
        return (
          <View
            key={alert._id}
            style={{
              backgroundColor: '#FFF7ED',
              borderColor: Constants.saffron,
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}>
            <Text style={{fontWeight: '700', color: '#9A3412', fontSize: 14}}>
              {t('Customer waiting for pickup')}
            </Text>
            <Text style={{color: '#7C2D12', marginTop: 2}}>
              {t('Order')} {alert.orderId} {'·'} {where}
            </Text>
            <TouchableOpacity
              disabled={ackingId === alert._id}
              onPress={() => acknowledge(alert)}
              style={{
                marginTop: 10,
                backgroundColor: Constants.saffron,
                borderRadius: 8,
                paddingVertical: 9,
                alignItems: 'center',
              }}>
              {ackingId === alert._id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{color: '#fff', fontWeight: '700'}}>
                  {t('Acknowledge')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

export default PickupAlertBanner;
