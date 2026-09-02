/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import Constants, {Currency, FONTS} from '../../Assets/Helpers/constant';
import {navigate} from '../../../navigationRef';
import {useIsFocused} from '@react-navigation/native';
import {LoadContext, UserContext} from '../../../App';
import {Post} from '../../Assets/Helpers/Service';
import {useTranslation} from 'react-i18next';
import moment from 'moment-timezone';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {Dropdown} from 'react-native-element-dropdown';
import {Toast} from 'toastify-react-native';
import LabelWithColon from '../../Assets/Helpers/LabelWithColon';
import EmployeeHeader from '../../Assets/Component/EmployeeHeader';
import OrderReady from '../../Assets/Component/OrderReady';
import PickupAlertBanner from '../../Assets/Component/PickupAlertBanner';
import {
  BRAND,
  PICKUP_FILTER_OPTIONS,
  statusStyle,
  fmtDate,
} from '../../Assets/Helpers/orderUtils';

const LIMIT = 20;

const Orders = () => {
  const {t} = useTranslation();
  const isFocused = useIsFocused();
  const [, setLoading] = useContext(LoadContext);
  const [user] = useContext(UserContext);

  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [lastCount, setLastCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // filters — mirror grocerypickup-admin/pages/orders.js
  const [orderId, setOrderId] = useState('');
  const [pickupOption, setPickupOption] = useState('All');
  const [orderDate, setOrderDate] = useState(null);
  const [pickupDate, setPickupDate] = useState(null);
  const [datePickerFor, setDatePickerFor] = useState(null); // 'order' | 'pickup'

  const buildBody = () => {
    const body = {};
    if (orderDate) {
      body.curentDate = moment
        .tz(orderDate, 'America/Chicago')
        .startOf('day')
        .toISOString();
    }
    if (pickupOption) body.PickupOption = pickupOption;
    if (orderId.trim()) body.orderId = orderId.trim();
    if (pickupDate) body.pickupDate = moment(pickupDate).toISOString();
    return body;
  };

  const fetchOrders = (p = 1) => {
    setPage(p);
    setLoading(true);
    Post(`NewgetOrderBySeller?page=${p}&limit=${LIMIT}`, buildBody())
      .then(res => {
        setLoading(false);
        const data = res?.data || [];
        setLastCount(data.length);
        setList(prev => (p === 1 ? data : [...prev, ...data]));
      })
      .catch(err => {
        setLoading(false);
        if (p === 1) setList([]);
        Toast.error(err?.message || t('Failed to load orders'));
      });
  };

  useEffect(() => {
    if (isFocused) fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // re-query whenever a filter changes (debounced for the text field)
  useEffect(() => {
    if (!isFocused) return;
    const id = setTimeout(() => fetchOrders(1), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, pickupOption, orderDate, pickupDate]);

  const resetFilters = () => {
    setOrderId('');
    setPickupOption('All');
    setOrderDate(null);
    setPickupDate(null);
  };

  const loadMore = () => {
    if (lastCount === LIMIT) fetchOrders(page + 1);
  };

  const deleteOrder = id => {
    setLoading(true);
    Post(`delete-order/${id}`, null)
      .then(() => {
        setLoading(false);
        Toast.success(t('Order deleted successfully'));
        fetchOrders(1);
      })
      .catch(err => {
        setLoading(false);
        Toast.error(err?.message || t('Failed to delete order'));
      });
  };

  const methodLabel = item =>
    item?.isOrderPickup
      ? t('In Store Pickup')
      : item?.isDriveUp
      ? t('Curbside Pickup')
      : item?.isLocalDelivery
      ? t('Next Day Local Delivery')
      : item?.isShipmentDelivery
      ? t('Shipping')
      : t('Delivery');

  const renderItem = ({item}) => {
    const s = statusStyle(item?.status);
    return (
      <View style={styles.box}>
        <View style={styles.topRow}>
          <View style={{flexDirection: 'row', flex: 1}}>
            <Image
              source={
                item?.user?.img
                  ? {uri: `${item?.user?.img}`}
                  : require('../../Assets/Images/profile.png')
              }
              style={styles.avatar}
            />
            <View style={{flex: 1}}>
              <Text style={styles.name}>{item?.user?.username}</Text>
              <Text style={styles.method}>{methodLabel(item)}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, {backgroundColor: s.bg}]}>
            <Text style={[styles.statusPillTxt, {color: s.text}]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.kvRow}>
          <LabelWithColon labelKey="Order ID" textStyle={styles.kvBold} />
          <Text style={styles.kvVal}>{item?.orderId || item?._id}</Text>
        </View>
        {!!item?.dateOfDelivery && (
          <View style={styles.kvRow}>
            <LabelWithColon labelKey="Delivery Date" textStyle={styles.kvBold} />
            <Text style={styles.kvVal}>{fmtDate(item?.dateOfDelivery)}</Text>
          </View>
        )}
        <View style={styles.kvRow}>
          <LabelWithColon labelKey="Order Date" textStyle={styles.kvBold} />
          <Text style={styles.kvVal}>
            {moment(item?.createdAt).format('MM-DD-YYYY')}
          </Text>
        </View>
        {!!item?.Local_address?.address && (
          <View style={styles.kvRow}>
            <LabelWithColon labelKey="Location" textStyle={styles.kvBold} />
            <Text style={styles.kvVal}>{item?.Local_address?.address}</Text>
          </View>
        )}

        <View style={styles.prodList}>
          {item?.productDetail?.map((prod, i) => (
            <View key={i} style={styles.prodRow}>
              <Image
                source={
                  (
                    Array.isArray(prod.image) ? prod.image[0] : prod.image
                  )
                    ? {
                        uri: Array.isArray(prod.image)
                          ? prod.image[0]
                          : prod.image,
                      }
                    : require('../../Assets/Images/veg.png')
                }
                style={styles.prodImg}
                resizeMode="contain"
              />
              <View style={{flex: 1}}>
                <Text style={styles.prodName}>{prod?.product?.name}</Text>
                <View style={styles.prodMeta}>
                  <Text style={styles.prodMetaTxt}>
                    {t('Qty')}: {prod?.qty}
                  </Text>
                  <Text style={styles.prodPrice}>
                    {Currency}
                    {Number(prod?.price ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.qtyTxt}>
              {t('Items')}: {item?.productDetail?.length}
            </Text>
            <Text style={styles.amount}>
              {Currency}
              {item?.total}
            </Text>
          </View>
          <OrderReady row={item} getProducts={() => fetchOrders(1)} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => navigate('EmployeeOrderDetail', {order: item})}>
            <Text style={styles.detailsTxt}>{t('View Details')}</Text>
          </TouchableOpacity>
          {user?.type === 'ADMIN' && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteOrder(item._id)}>
              <Text style={styles.deleteTxt}>{t('Delete Order')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <EmployeeHeader item={t('My orders')} />
      <PickupAlertBanner />

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(v => !v)}>
          <Text style={styles.filterToggleTxt}>
            {showFilters ? t('Hide Filters') : t('Filter Orders')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => fetchOrders(1)}>
          <Text style={styles.refreshTxt}>{t('Refresh')}</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <TextInput
            style={styles.filterInput}
            value={orderId}
            onChangeText={setOrderId}
            placeholder={t('Search by order ID')}
            placeholderTextColor={Constants.customgrey}
          />
          <Dropdown
            style={styles.filterDropdown}
            data={PICKUP_FILTER_OPTIONS}
            value={pickupOption}
            onChange={it => setPickupOption(it.value)}
            labelField="label"
            valueField="value"
            selectedTextStyle={{color: Constants.black, fontSize: 13}}
            maxHeight={260}
          />
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setDatePickerFor('order')}>
              <Text style={styles.dateBtnTxt}>
                {orderDate
                  ? moment(orderDate).format('MM-DD-YYYY')
                  : t('Order Date')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setDatePickerFor('pickup')}>
              <Text style={styles.dateBtnTxt}>
                {pickupDate
                  ? moment(pickupDate).format('MM-DD-YYYY')
                  : t('Pickup Date')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetTxt}>{t('Reset Filters')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <DateTimePickerModal
        isVisible={!!datePickerFor}
        mode="date"
        date={
          (datePickerFor === 'pickup' ? pickupDate : orderDate) || new Date()
        }
        onConfirm={d => {
          if (datePickerFor === 'pickup') setPickupDate(d);
          else setOrderDate(d);
          setDatePickerFor(null);
        }}
        onCancel={() => setDatePickerFor(null)}
      />

      <FlatList
        data={list}
        style={{marginBottom: 70}}
        keyExtractor={(item, i) => item?._id || String(i)}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>{t('No Order Available')}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Orders;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Constants.lightgrey},
  box: {backgroundColor: Constants.white, marginVertical: 8, padding: 18},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  avatar: {
    marginRight: 10,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: Constants.lightgrey,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
  },
  name: {color: Constants.black, fontFamily: FONTS.Bold, fontSize: 14},
  method: {color: Constants.saffron, fontSize: 13, fontFamily: FONTS.Medium},
  statusPill: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999},
  statusPillTxt: {fontFamily: FONTS.Bold, fontSize: 10},
  kvRow: {flexDirection: 'row', marginHorizontal: 4, marginVertical: 4},
  kvBold: {color: Constants.black, fontSize: 14, fontFamily: FONTS.Bold, alignSelf: 'center'},
  kvVal: {color: Constants.black, fontSize: 14, flex: 1},
  prodList: {marginVertical: 6, gap: 10},
  prodRow: {flexDirection: 'row', gap: 10},
  prodImg: {height: 50, width: 50},
  prodName: {color: Constants.black, fontSize: 14, fontFamily: FONTS.Medium},
  prodMeta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 4},
  prodMetaTxt: {fontFamily: FONTS.Bold, color: Constants.black},
  prodPrice: {fontFamily: FONTS.Bold, color: Constants.black},
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  qtyTxt: {color: Constants.black, fontSize: 13, fontFamily: FONTS.Bold},
  amount: {color: Constants.saffron, fontSize: 16, fontFamily: FONTS.Bold, marginTop: 2},
  actionRow: {flexDirection: 'row', gap: 10, marginTop: 12},
  detailsBtn: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailsTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 13},
  deleteBtn: {
    borderWidth: 1,
    borderColor: Constants.red,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  deleteTxt: {color: Constants.red, fontFamily: FONTS.Medium, fontSize: 13},
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterToggle: {
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterToggleTxt: {color: '#fff', fontFamily: FONTS.Medium, fontSize: 13},
  refreshTxt: {color: BRAND, fontFamily: FONTS.Bold, fontSize: 15},
  filterPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Constants.black,
  },
  filterDropdown: {
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  dateRow: {flexDirection: 'row', gap: 10},
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Constants.customgrey3,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateBtnTxt: {color: Constants.black, fontFamily: FONTS.Regular, fontSize: 13},
  resetBtn: {
    backgroundColor: BRAND,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetTxt: {color: '#fff', fontFamily: FONTS.Medium, fontSize: 13},
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height - 260,
  },
  emptyTxt: {color: Constants.black, fontSize: 18, fontFamily: FONTS.Bold},
});
