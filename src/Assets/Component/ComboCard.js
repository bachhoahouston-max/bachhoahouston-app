/* eslint-disable no-undef */
/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Constants, { Currency, FONTS } from '../Helpers/constant';
import AlarmBadge from './AlarmBadge';
import { MinusIcon, Plus2Icon, PlusIcon } from '../../../Theme';
import { GetApi } from '../Helpers/Service';
import { CartContext, ToastContext } from '../../../App';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getCountdown = endDateTime => {
  const now = new Date();
  const end = new Date(endDateTime);
  const diff = end - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false };
};

const ComboCard = ({ combo, onAddCombo, }) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [countdown, setCountdown] = useState(() => getCountdown(combo?.endDateTime));
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [cartItem, setCartItem] = useState(undefined);
  const [toast, setToast] = useContext(ToastContext);

  // console.log('Rendering ComboCard for combo:', combo);

  useEffect(() => {
    const items = Array.isArray(cartdetail)
      ? cartdetail.find(it => it?.combo_id === combo?._id)
      : undefined;
    setCartItem(items);
  }, [cartdetail])


  // const cartItem = Array.isArray(cartdetail)
  //   ? cartdetail.find(it => it?.combo_id === combo?._id)
  //   : undefined;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


  const checkQuantity = async (item) => {
    console.log('Checking quantity for item:', item._id);
    try {
      const res = await GetApi(
        `checkQuantity/${item._id}`,
      );
      return res.status ? res.data.qty : 0;
    } catch (err) {
      return 0;
    }
  };

  useEffect(() => {
    if (!combo?.endDateTime) return;
    const timer = setInterval(() => {
      const cd = getCountdown(combo.endDateTime);
      setCountdown(cd);
      if (cd.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [combo?.endDateTime]);

  if (!combo) return null;

  const { price, promo_text, main_product, free_product, main_price_slot } = combo;

  const mainImage = main_product?.varients?.[0]?.image?.[0];
  const mainUnit = main_price_slot?.unit ?? '';
  const mainValue = main_price_slot?.value ?? '';
  const originalPrice = main_price_slot?.our_price ?? 0;

  const freeItem = free_product?.[0];
  const freeImage = freeItem?.product?.varients?.[0]?.image?.[0];
  const freeUnit = freeItem?.slot?.unit ?? '';
  const freeValue = freeItem?.slot?.value ?? '';
  const freeOriginalPrice = freeItem?.slot?.our_price ?? 0;
  const totalOriginalPrice = originalPrice + freeOriginalPrice;

  const saveAmt = freeOriginalPrice > 0 ? freeOriginalPrice : (originalPrice - price);

  const calculateTimeLeft = distance => {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  // useEffect(() => {
  //   const calculateCountdown = () => {
  //     const now = new Date().getTime();
  //     const newCountdown = {};

  //     // saleData.forEach(sale => {
  //       const startDate = new Date(sale.startDateTime).getTime();
  //       const endDate = new Date(sale.endDateTime).getTime();

  //       if (now < startDate) {
  //         const distance = startDate - now;
  //         newCountdown[sale._id] = {
  //           ...calculateTimeLeft(distance),
  //           status: 'upcoming',
  //           message: 'Sale starts in',
  //         };
  //       } else if (now >= startDate && now < endDate) {
  //         const distance = endDate - now;
  //         newCountdown[sale._id] = {
  //           ...calculateTimeLeft(distance),
  //           status: 'active',
  //           message: 'Sale ends in',
  //         };
  //       } else {
  //         newCountdown[sale._id] = {
  //           status: 'expired',
  //           message: 'Sale has ended',
  //         };
  //       }
  //     // });

  //     setCountdown(newCountdown);
  //   };

  //   const calculateTimeLeft = distance => {
  //     const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  //     const hours = Math.floor(
  //       (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  //     );
  //     const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //     const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  //     return { days, hours, minutes, seconds };
  //   };

  //   if (saleData.length > 0) {
  //     calculateCountdown();
  //     const interval = setInterval(calculateCountdown, 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [combo]);

  const addCombo = async () => {
    console.log('Available quantity:', combo.main_product._id === combo.free_product?.[0]?.product._id, combo.main_product._id, combo.free_product?.[0]?.product._id);
    if (combo.main_product._id === combo.free_product?.[0]?.product._id) {
      const availableQuantity = await checkQuantity(combo.main_product);
      console.log('Available quantity for main/free product:', availableQuantity);
      if (2 > availableQuantity) {
        setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
        return
      }
    } else {
      const availableQuantity = await checkQuantity(combo.main_product)

      if (availableQuantity <= 0) {
        // setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
        setToast('Main product is not available in this quantity in stock. Please choose a different item.');
        return
      }

      const FreeavailableQuantity = await checkQuantity(combo.free_product?.[0]?.product)

      if (FreeavailableQuantity <= 0) {
        setToast('Free product is not available in this quantity in stock. Please choose a different item.');
        return
      }
    }
    const productdata = combo.main_product;
    const newProduct = {
      productid: productdata._id,
      productId: productdata._id,
      productname: productdata.name,
      vietnamiesName: productdata?.vietnamiesName,
      price: combo?.price,
      offer: combo?.price,
      image: productdata.varients[0].image[0],
      price_slot: productdata?.price_slot[0],
      qty: 1,
      seller_id: productdata.userid,
      isShipmentAvailable: productdata.isShipmentAvailable,
      isInStoreAvailable: productdata.isInStoreAvailable,
      isCurbSidePickupAvailable: productdata.isCurbSidePickupAvailable,
      isNextDayDeliveryAvailable: productdata.isNextDayDeliveryAvailable,
      slug: productdata.slug,
      tax_code: productdata.tax_code,
      tax: productdata.tax,
      freeProducts: combo?.free_product,
      combo_id: combo?._id,
      productSource: "COMBO",
      // saletype: "COMBO",
      product: productdata,
      accept_coupon: combo?.accept_coupon
    };
    console.log('Adding combo to cart:', newProduct);

    const updatedCart = [...cartdetail, newProduct];
    setcartdetail(updatedCart);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    console.log('Added to cart', cartdata);

  }

  return (
    <View style={styles.card}>

      <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <AlarmBadge currentSale={countdown} />
      </View>


      {/* Products Row */}
      <View style={styles.productsRow}>
        {/* Buy Product */}
        <View style={styles.productBox}>
          {/* <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>X {mainValue} {mainUnit}</Text>
          </View> */}
          <Image
            source={{ uri: mainImage }}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={styles.buyLabel}>
            <Text style={styles.buyLabelText}>BUY</Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowText}>→</Text>
        </View>

        {/* Free Product */}
        <View style={styles.productBox}>
          {/* <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>X {freeValue} {freeUnit}</Text>
          </View> */}
          <Image
            source={{ uri: freeImage }}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={[styles.buyLabel, styles.freeLabel]}>
            <Text style={[styles.buyLabelText, styles.freeLabelText]}>FREE</Text>
          </View>
        </View>
      </View>

      {/* Price Row */}
      <View style={styles.priceRow}>
        <Text style={styles.salePrice}>{Currency}{(price ?? 0).toFixed(2)}</Text>
        {originalPrice > 0 && (
          <Text style={styles.originalPrice}>{Currency}{totalOriginalPrice.toFixed(2)}</Text>
        )}
        {freeOriginalPrice > 0 && (
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>Save {Currency}{freeOriginalPrice.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* Promo text */}
      {promo_text ? (
        <Text style={styles.description}>{promo_text}</Text>
      ) : null}

      {/* Add Combo Button */}
      {/* <View style={{ marginTop: 'auto', position: 'relative', flex: 1 }}> */}
      {cartItem ? (
        <View
          style={[
            styles.addcov,
            // { width: 90, height: 30, alignItems: 'center' },
          ]}>
          <TouchableOpacity
            style={styles.minus}
            onPress={() => {
              const updatedCart = cartdetail
                .map(_i =>
                  _i.combo_id === combo._id
                    ? { ..._i, qty: _i.qty - 1 }
                    : _i,
                )
                .filter(_i => _i.qty > 0);

              setcartdetail(updatedCart);
              AsyncStorage.setItem(
                'cartdata',
                JSON.stringify(updatedCart),
              );
            }}>
            <MinusIcon color={Constants.white} height={16} width={16} />
          </TouchableOpacity>

          <Text style={styles.qtyText}>{cartItem.qty}</Text>

          <TouchableOpacity
            style={styles.plus3}
            onPress={async () => {
              const existingCartItem = cartdetail.find((cartItem) => cartItem.combo_id === combo._id);
              console.log('Existing cart item:', existingCartItem);
              if (combo.main_product._id === combo.free_product?.[0]?.product._id) {
                const availableQuantity = await checkQuantity(combo.main_product)
                if ((existingCartItem.qty * 2) > availableQuantity) {
                  setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
                  return
                }
              } else {
                console.log('Available quantity for main/free product:', availableQuantity);
                const availableQuantity = await checkQuantity(combo.main_product)
                const FreeavailableQuantity = await checkQuantity(combo.free_product?.[0]?.product)
                console.log('Available quantity:', availableQuantity, FreeavailableQuantity);
                if (existingCartItem.qty + 1 > availableQuantity) {
                  setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
                  return
                }
                if (existingCartItem.qty + 1 >= FreeavailableQuantity) {
                  setToast(t('Free product is not available in this quantity in stock. Please choose a different item.'));
                  return
                }
              }
              const updatedCart = cartdetail.map(_i =>
                _i.combo_id === combo._id ? { ..._i, qty: _i.qty + 1 } : _i,
              );
              console.log('Updated cart after increment:', updatedCart);

              setcartdetail(updatedCart);
              AsyncStorage.setItem(
                'cartdata',
                JSON.stringify(updatedCart),
              );
            }}>
            <Plus2Icon color={Constants.white} height={16} width={16} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={addCombo}
          activeOpacity={0.85}>
          <Text style={styles.addButtonText}>+ Add Combo Now</Text>
        </TouchableOpacity>
      )
      }
      {/* </View> */}

    </View >
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Constants.white,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 8,
    width: 260,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: Constants.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  timerIcon: {
    fontSize: 18,
  },
  endingLabel: {
    fontSize: 13,
    color: Constants.black,
    fontFamily: FONTS.Medium,
  },
  timerBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timerText: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
    fontSize: 13,
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 10
  },
  productBox: {
    flex: 1,
    alignItems: 'center',
  },
  qtyBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    alignSelf: 'center',
  },
  qtyBadgeText: {
    color: Constants.white,
    fontSize: 11,
    fontFamily: FONTS.Bold,
  },
  productImage: {
    width: 90,
    height: 90,
  },
  buyLabel: {
    backgroundColor: '#F6E27A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 6,
  },
  buyLabelText: {
    color: '#2E7D32',
    fontFamily: FONTS.Bold,
    fontSize: 14,
    fontWeight: '900',
  },
  freeLabel: {
    backgroundColor: '#2E7D32',
  },
  freeLabelText: {
    color: Constants.white,
    fontWeight: '900',
  },
  arrowContainer: {
    paddingHorizontal: 4,
  },
  arrowText: {
    fontSize: 24,
    color: Constants.customgrey,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  salePrice: {
    fontSize: 14,
    color: '#FF0000',
    fontFamily: FONTS.Bold,
    fontWeight: '900',
  },
  originalPrice: {
    fontSize: 12,
    color: '#6A7282',
    fontFamily: FONTS.Bold,
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: '#FDE2E2',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  saveText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.Bold,
  },
  description: {
    fontSize: 13,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    marginBottom: 6,
    textAlign: 'center'
  },
  addButton: {
    backgroundColor: '#F6E27A',
    borderRadius: 12,
    // paddingVertical: 12,
    alignItems: 'center',
    marginTop: 'auto',
    height: 30,
    width: 180,
    paddingTop: 4,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,

    elevation: 8,
  },
  addButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontFamily: FONTS.Bold,
    fontWeight: '700',
  },

  // pluscov: {
  //   position: 'absolute',
  //   bottom: 5,
  //   right: -6,
  //   minWidth: 40,
  //   minHeight: 40,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderRadius: 20,
  //   backgroundColor: '#2E7D32',
  // },
  addcov: {
    // position: 'absolute',
    // bottom: 5,
    // right: 10,
    // right: 5,
    flexDirection: 'row',
    height: 30,
    borderRadius: 7,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    // width: 200
  },
  minus: {
    backgroundColor: '#2E7D32',
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    backgroundColor: '#F3F3F3',
    width: 30,
    height: '100%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    // paddingTop: 5,
    textAlign: 'center',
    // textAlignVertical: 'center',
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Black,
    // justifyContent: 'center',
    // alignItems: 'center',
    // alignSelf: 'center'
  },
  plus3: {
    backgroundColor: '#2E7D32',
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
});

export default ComboCard;
