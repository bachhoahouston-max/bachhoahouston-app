import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AlarmClock, ArrowBigRight, Plus, Zap } from 'lucide-react-native';
import Constants, { Currency, FONTS } from '../Helpers/constant';
import { MinusIcon, Plus2Icon } from '../../../Theme';
import { GetApi } from '../Helpers/Service';
import { CartContext, ToastContext } from '../../../App';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const saleGreen = '#216831';
const saleGold = '#F6E27A';

const getCountdown = endDateTime => {
  const remaining = new Date(endDateTime).getTime() - Date.now();
  const totalMinutes = Math.max(0, Math.floor((remaining || 0) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${days}d : ${hours}h : ${minutes}m`;
};

const ComboCard = ({ combo }) => {
  const { t } = useTranslation();
  const endDateTime = combo?.endDateTime;
  const [countdown, setCountdown] = useState(() => getCountdown(endDateTime));
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [, setToast] = useContext(ToastContext);
  const cartItem = Array.isArray(cartdetail)
    ? cartdetail.find(item => item?.combo_id === combo?._id)
    : undefined;

  const checkQuantity = async (item) => {
    console.log('Checking quantity for item:', item._id);
    try {
      const res = await GetApi(
        `checkQuantity/${item._id}`,
      );
      return res.status ? res.data : { qty: 0 };
    } catch (err) {
      return { qty: 0 };
    }
  };

  useEffect(() => {
    setCountdown(getCountdown(endDateTime));
    if (!endDateTime || !(new Date(endDateTime).getTime() > Date.now())) return;

    const timer = setInterval(() => {
      setCountdown(getCountdown(endDateTime));
      if (new Date(endDateTime).getTime() <= Date.now()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endDateTime]);

  if (!combo) return null;

  const { price, promo_text, main_product, free_product, main_price_slot } = combo;
  const mainImage = main_product?.varients?.[0]?.image?.[0];
  const freeItem = free_product?.[0];
  const freeImage = freeItem?.product?.varients?.[0]?.image?.[0];
  const originalPrice = main_price_slot?.our_price ?? 0;
  const freeOriginalPrice = freeItem?.slot?.our_price ?? 0;
  const totalOriginalPrice = originalPrice + freeOriginalPrice;

  const addCombo = async () => {
    console.log('Available quantity:', combo.main_product._id === combo.free_product?.[0]?.product._id, combo.main_product._id, combo.free_product?.[0]?.product._id);
    if (combo.main_product._id === combo.free_product?.[0]?.product._id) {
      const quantityResult = await checkQuantity(combo.main_product);
      console.log('Available quantity for main/free product:', quantityResult);

      if (quantityResult.vendorClosed) {
        setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
          name: quantityResult.vendorName || combo.main_product?.vendor?.name || 'This restaurant',
        }));
        return
      }

      if ((quantityResult.qty ?? 0) < 2) {
        setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
        return
      }
    } else {
      const quantityResult = await checkQuantity(combo.main_product)

      if (quantityResult.vendorClosed) {
        setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
          name: quantityResult.vendorName || combo.main_product?.vendor?.name || 'This restaurant',
        }));
        return
      }

      if ((quantityResult.qty ?? 0) <= 0) {
        // setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
        setToast('Main product is not available in this quantity in stock. Please choose a different item.');
        return
      }

      const freeQuantityResult = await checkQuantity(combo.free_product?.[0]?.product)

      if (freeQuantityResult.vendorClosed) {
        setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
          name: freeQuantityResult.vendorName || combo.free_product?.[0]?.product?.vendor?.name || 'This restaurant',
        }));
        return
      }

      if ((freeQuantityResult.qty ?? 0) <= 0) {
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
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#0F3D2E', '#256C32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}>
        <View style={styles.bannerTitle}>
          <Zap size={23} color={saleGold} fill={saleGold} />
          <Text accessibilityRole="header" style={styles.bannerTitleText}>
            {t('Flash sale')}
          </Text>
        </View>
        <View style={styles.timerPill}>
          <View style={styles.timerContent}>
            <AlarmClock size={13} color="#342717" />
            <Text style={styles.timerText}>{countdown}</Text>
          </View>
        </View>
        <Text style={styles.bannerNote}>{t('Limited time only!')}</Text>
      </LinearGradient>

      <View style={styles.productsRow}>
        <View style={styles.productBox}>
          <Image
            source={mainImage ? { uri: mainImage } : undefined}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={styles.buyLabel}>
            <Text style={styles.buyLabelText}>{t('Buy')}</Text>
          </View>
        </View>

        <ArrowBigRight
          size={29}
          fill={saleGreen}
          color={saleGreen}
          style={styles.arrow}
        />

        <View style={styles.productBox}>
          <Image
            source={freeImage ? { uri: freeImage } : undefined}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={[styles.buyLabel, styles.freeLabel]}>
            <Text style={[styles.buyLabelText, styles.freeLabelText]}>{t('Free')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.salePrice}>{Currency}{(price ?? 0).toFixed(2)}</Text>
        {originalPrice > 0 && (
          <Text style={styles.originalPrice}>{Currency}{totalOriginalPrice.toFixed(2)}</Text>
        )}
        {freeOriginalPrice > 0 && (
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>
              {t('Save {{amount}}', { amount: Currency + freeOriginalPrice.toFixed(2) })}
            </Text>
          </View>
        )}
      </View>

      {promo_text ? <Text style={styles.description}>{promo_text}</Text> : null}

      {cartItem ? (
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            accessibilityRole="button"
            accessibilityLabel={t('Decrease quantity')}
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
            style={styles.quantityButton}
            accessibilityRole="button"
            accessibilityLabel={t('Increase quantity')}
            onPress={async () => {
              const existingCartItem = cartItem;
              console.log('Existing cart item:', existingCartItem);
              if (combo.main_product._id === combo.free_product?.[0]?.product._id) {
                const quantityResult = await checkQuantity(combo.main_product)

                if (quantityResult.vendorClosed) {
                  setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
                    name: quantityResult.vendorName || combo.main_product?.vendor?.name || 'This restaurant',
                  }));
                  return
                }

                if ((existingCartItem.qty * 2) > (quantityResult.qty ?? 0)) {
                  setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
                  return
                }
              } else {
                const quantityResult = await checkQuantity(combo.main_product)
                const freeQuantityResult = await checkQuantity(combo.free_product?.[0]?.product)
                console.log('Available quantity:', quantityResult, freeQuantityResult);

                if (quantityResult.vendorClosed) {
                  setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
                    name: quantityResult.vendorName || combo.main_product?.vendor?.name || 'This restaurant',
                  }));
                  return
                }

                if (freeQuantityResult.vendorClosed) {
                  setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
                    name: freeQuantityResult.vendorName || combo.free_product?.[0]?.product?.vendor?.name || 'This restaurant',
                  }));
                  return
                }

                if (existingCartItem.qty + 1 > (quantityResult.qty ?? 0)) {
                  setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
                  return
                }
                if (existingCartItem.qty + 1 >= (freeQuantityResult.qty ?? 0)) {
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
          accessibilityRole="button"
          style={styles.addButton}
          onPress={addCombo}
          activeOpacity={0.85}>
          <Plus size={19} color={saleGreen} />
          <Text style={styles.addButtonText}>{t('Add Combo Now')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Constants.white,
    borderColor: '#EEE4DE',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minHeight: 35,
    borderBottomColor: '#DCBE62',
    borderBottomWidth: 2,
  },
  bannerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerTitleText: {
    flexShrink: 1,
    color: Constants.white,
    fontFamily: FONTS.Bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  timerPill: {
    borderRadius: 99,
    borderColor: '#F2D27A',
    borderWidth: 1,
    padding: 1,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F2D27A',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  timerText: {
    color: '#342717',
    fontFamily: FONTS.Bold,
    fontVariant: ['tabular-nums'],
    fontSize: 10,
  },
  bannerNote: {
    flex: 1,
    color: Constants.white,
    fontFamily: FONTS.Bold,
    fontSize: 9,
    textAlign: 'right',
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 2,
  },
  productBox: {
    flex: 1,
    maxWidth: 215,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    aspectRatio: 0.78,
  },
  arrow: {
    marginBottom: 14,
  },
  buyLabel: {
    backgroundColor: saleGold,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: -12,
  },
  buyLabelText: {
    color: saleGreen,
    fontFamily: FONTS.Bold,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  freeLabel: {
    backgroundColor: '#08783D',
  },
  freeLabelText: {
    color: Constants.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: 14,
    marginTop: 4,
  },
  salePrice: {
    fontSize: 20,
    color: '#C9232E',
    fontFamily: FONTS.Bold,
  },
  originalPrice: {
    fontSize: 11,
    color: '#656870',
    fontFamily: FONTS.Medium,
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    alignSelf: 'center',
    backgroundColor: '#D91F32',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  saveText: {
    color: Constants.white,
    fontSize: 11,
    fontFamily: FONTS.Bold,
  },
  description: {
    fontSize: 11,
    color: '#20242B',
    fontFamily: FONTS.Bold,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  addButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: '95%',
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 4,
    backgroundColor: saleGold,
    borderBottomColor: '#CDB75B',
    borderBottomWidth: 2,
    borderRadius: 20,
  },
  addButtonText: {
    flexShrink: 1,
    color: saleGreen,
    fontSize: 13,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    minHeight: 32,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 4,
  },
  quantityButton: {
    backgroundColor: saleGreen,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    backgroundColor: '#F3F3F3',
    minWidth: 32,
    paddingHorizontal: 3,
    paddingVertical: 4,
    textAlign: 'center',
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
});

export default ComboCard;
