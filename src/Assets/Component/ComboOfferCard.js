/* eslint-disable react-native/no-inline-styles */
import React, { useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Constants, { Currency, FONTS } from '../Helpers/constant';
import { MinusIcon, Plus2Icon } from '../../../Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { CartContext, ToastContext } from '../../../App';
import { useTranslation } from 'react-i18next';
import { GetApi } from '../Helpers/Service';

/**
 * ComboOfferCard
 *
 * Two modes:
 *  1. Browse mode  — pass `combo`  (full combo object from API)
 *  2. Cart mode    — pass `cartItem` + `isCartMode` (cart entry with isCombo:true)
 */
const ComboOfferCard = ({ combo, cartItem, isCartMode }) => {
  const { t } = useTranslation();
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [, setToast] = useContext(ToastContext);

  /* ── Cart mode ── */
  if (isCartMode && cartItem) {
    const price = cartItem.offer ?? 0;
    const originalPrice = cartItem.price ?? 0;
    const mainImage = cartItem.image;
    const mainName = i18n.language === 'vi'
      ? (cartItem.vietnamiesName || cartItem.productname)
      : cartItem.productname;
    const mainUnit = cartItem.price_slot?.unit ?? '';
    const mainValue = cartItem.price_slot?.value ?? '';
    const freeProducts = cartItem.freeProducts ?? [];

    const updateCart = async updated => {
      setcartdetail(updated);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updated));
    };

    const handleMinus = async () => {
      const updated = cartdetail
        .map(i => i.productid === cartItem.productid ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0);
      await updateCart(updated);
    };

    const handlePlus = async () => {
      console.log('Available quantity for main/free product:', cartItem.product._id === cartItem.freeProducts?.[0]?.product._id);
      if (cartItem.product._id === cartItem.freeProducts?.[0]?.product._id) {
        const quantityResult = await checkQuantity(cartItem.product)

        if (quantityResult.vendorClosed) {
          setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
            name: quantityResult.vendorName || cartItem.product?.vendor?.name || 'This restaurant',
          }));
          return
        }

        if ((cartItem.qty * 2) > (quantityResult.qty ?? 0)) {
          setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
          return
        }
      } else {
        const quantityResult = await checkQuantity(cartItem.product)
        const freeQuantityResult = await checkQuantity(cartItem.freeProducts?.[0]?.product)
        console.log('Available quantity:', quantityResult, freeQuantityResult);

        if (quantityResult.vendorClosed) {
          setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
            name: quantityResult.vendorName || cartItem.product?.vendor?.name || 'This restaurant',
          }));
          return
        }

        if (freeQuantityResult.vendorClosed) {
          setToast(t('{{name}} is currently closed. Ordering is unavailable right now.', {
            name: freeQuantityResult.vendorName || cartItem.freeProducts?.[0]?.product?.vendor?.name || 'This restaurant',
          }));
          return
        }

        if (cartItem.qty + 1 > (quantityResult.qty ?? 0)) {
          setToast(t('Main product is not available in this quantity in stock. Please choose a different item.'));
          return
        }
        if (cartItem.qty + 1 >= (freeQuantityResult.qty ?? 0)) {
          setToast(t('Free product is not available in this quantity in stock. Please choose a different item.'));
          return
        }
      }

      console.log('Available quantity:', 'updated]s;dl,ps;dlpsldsldsl');
      const updated = cartdetail.map(i =>
        i.combo_id === cartItem.combo_id ? { ...i, qty: i.qty + 1 } : i,
      );
      await updateCart(updated);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updated));
    };

    const handleRemove = async () => {
      const updated = cartdetail.filter(i => i.productid !== cartItem.productid);
      await updateCart(updated);
    };

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

    return (
      <View style={styles.card}>
        {/* Green Header Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>🏷️ COMBO DEAL</Text>
          <Text style={styles.bannerPromo} numberOfLines={1}>  {cartItem.promo_text ?? ''}</Text>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.bannerRemoveBtn}>
            <Text style={styles.bannerRemoveText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Main Product */}
        <View style={styles.productRow}>
          <Image source={{ uri: mainImage }} style={styles.productImage} resizeMode="contain" />

          <View style={styles.productInfo}>
            <View style={styles.mainBadge}>
              <Text style={styles.mainBadgeText}>Main</Text>
            </View>
            <Text style={styles.productName} numberOfLines={2}>{mainName}</Text>
            <Text style={styles.unitText}>{mainValue} {mainUnit}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>{Currency}{price.toFixed(2)}</Text>
              {originalPrice > 0 && originalPrice !== price && (
                <Text style={styles.originalPrice}>{Currency}{originalPrice.toFixed(2)}</Text>
              )}
            </View>
          </View>

          {/* Qty controls */}
          <View style={styles.qtyBlock}>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepBtn, styles.stepBtnLeft]} onPress={handleMinus}>
                <MinusIcon color={Constants.white} height={14} width={14} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{cartItem.qty}</Text>
              <TouchableOpacity style={[styles.stepBtn, styles.stepBtnRight]} onPress={handlePlus}>
                <Plus2Icon color={Constants.white} height={14} width={14} />
              </TouchableOpacity>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalPrice}>{Currency}{(price * cartItem.qty).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Free Products */}
        {freeProducts.length > 0 && <View style={styles.divider} />}
        {freeProducts.map((fp, index) => {
          const fpImage = fp?.product?.varients?.[0]?.image?.[0];
          const fpName = i18n.language === 'vi'
            ? (fp?.product?.vietnamiesName || fp?.product?.name)
            : fp?.product?.name;
          const fpUnit = fp?.slot?.unit ?? '';
          const fpValue = fp?.slot?.value ?? '';
          const fpPrice = fp?.slot?.our_price ?? 0;

          return (
            <View key={fp._id || index} style={styles.freeRow}>
              <Image source={{ uri: fpImage }} style={styles.freeImage} resizeMode="contain" />
              <View style={styles.freeInfo}>
                <View style={styles.freeBadgeRow}>
                  <Text style={styles.giftIcon}>🎁</Text>
                  <Text style={styles.freeTag}>FREE</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{fpName}</Text>
                <Text style={styles.unitText}>{fpValue} {fpUnit}</Text>
              </View>
              <View style={styles.freePriceBlock}>
                {fpPrice > 0 && (
                  <Text style={styles.freePriceStrike}>{Currency}{fpPrice.toFixed(2)}</Text>
                )}
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  /* ── Browse mode ── */
  if (!combo) return null;

  const { price, promo_text, main_product, freeProducts, main_price_slot } = combo;
  const mainImage = main_product?.varients?.[0]?.image?.[0];
  const mainName = i18n.language === 'vi'
    ? (main_product?.vietnamiesName || main_product?.name)
    : main_product?.name;
  const mainUnit = main_price_slot?.unit ?? '';
  const mainValue = main_price_slot?.value ?? '';
  const originalPrice = main_price_slot?.our_price ?? 0;
  const freeOriginalPrice = combo.freeProducts?.[0]?.slot?.our_price ?? 0;

  const handleAdd = async () => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    const comboCartId = `combo_${combo._id}`;
    const existing = existingCart.find(i => i.productid === comboCartId);

    let updatedCart;
    if (existing) {
      updatedCart = existingCart.map(i =>
        i.productid === comboCartId ? { ...i, qty: i.qty + 1 } : i,
      );
    } else {
      updatedCart = [...existingCart, {
        productid: comboCartId,
        productname: mainName,
        vietnamiesName: main_product?.vietnamiesName,
        price: originalPrice,
        offer: price,
        image: mainImage,
        price_slot: main_price_slot,
        qty: 1,
        seller_id: main_product?.userid,
        isShipmentAvailable: main_product?.isShipmentAvailable,
        isInStoreAvailable: main_product?.isInStoreAvailable,
        isCurbSidePickupAvailable: main_product?.isCurbSidePickupAvailable,
        isNextDayDeliveryAvailable: main_product?.isNextDayDeliveryAvailable,
        slug: main_product?.slug,
        tax_code: main_product?.tax_code,
        tax: main_product?.tax,
        isCombo: true,
        comboId: combo._id,
        promo_text,
        freeProducts: freeProducts,
        productSource: 'COMBO',
      }];
    }

    setcartdetail(updatedCart);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
    setToast(t('Successfully added to cart.'));
  };

  const cartEntry = Array.isArray(cartdetail)
    ? cartdetail.find(i => i.productid === `combo_${combo._id}`)
    : null;
  const qty = cartEntry?.qty ?? 0;

  const handleMinus = async () => {
    const comboCartId = `combo_${combo._id}`;
    const updated = (Array.isArray(cartdetail) ? cartdetail : [])
      .map(i => i.productid === comboCartId ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0);
    setcartdetail(updated);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updated));
  };

  const handleRemove = async () => {
    const comboCartId = `combo_${combo._id}`;
    const updated = (Array.isArray(cartdetail) ? cartdetail : [])
      .filter(i => i.productid !== comboCartId);
    setcartdetail(updated);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updated));
  };

  return (
    <View style={styles.card}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🏷️ COMBO DEAL</Text>
        <Text style={styles.bannerPromo} numberOfLines={1}>  {promo_text}</Text>
        {qty > 0 && (
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.bannerRemoveBtn}>
            <Text style={styles.bannerRemoveText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.productRow}>
        <Image source={{ uri: mainImage }} style={styles.productImage} resizeMode="contain" />

        <View style={styles.productInfo}>
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>Main</Text>
          </View>
          <Text style={styles.productName} numberOfLines={2}>{mainName}</Text>
          <Text style={styles.unitText}>{mainValue} {mainUnit}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>{Currency}{(price ?? 0).toFixed(2)}</Text>
            {originalPrice > 0 && originalPrice !== price && (
              <Text style={styles.originalPrice}>{Currency}{originalPrice.toFixed(2)}</Text>
            )}
            {freeOriginalPrice > 0 && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save {Currency}{freeOriginalPrice.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.qtyBlock}>
          {qty > 0 ? (
            <>
              <View style={styles.stepper}>
                <TouchableOpacity style={[styles.stepBtn, styles.stepBtnLeft]} onPress={handleMinus}>
                  <MinusIcon color={Constants.white} height={14} width={14} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={[styles.stepBtn, styles.stepBtnRight]} onPress={handleAdd}>
                  <Plus2Icon color={Constants.white} height={14} width={14} />
                </TouchableOpacity>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalPrice}>{Currency}{((price ?? 0) * qty).toFixed(2)}</Text>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Plus2Icon color={Constants.white} height={16} width={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {freeProducts?.length > 0 && <View style={styles.divider} />}
      {freeProducts?.map((fp, index) => {
        const fpImage = fp?.product?.varients?.[0]?.image?.[0];
        const fpName = i18n.language === 'vi'
          ? (fp?.product?.vietnamiesName || fp?.product?.name)
          : fp?.product?.name;
        const fpUnit = fp?.slot?.unit ?? '';
        const fpValue = fp?.slot?.value ?? '';
        const fpPrice = fp?.slot?.our_price ?? 0;

        return (
          <View key={fp._id || index} style={styles.freeRow}>
            <Image source={{ uri: fpImage }} style={styles.freeImage} resizeMode="contain" />
            <View style={styles.freeInfo}>
              <View style={styles.freeBadgeRow}>
                <Text style={styles.giftIcon}>🎁</Text>
                <Text style={styles.freeTag}>FREE</Text>
              </View>
              <Text style={styles.productName} numberOfLines={2}>{fpName}</Text>
              <Text style={styles.unitText}>{fpValue} {fpUnit}</Text>
            </View>
            <View style={styles.freePriceBlock}>
              {fpPrice > 0 && (
                <Text style={styles.freePriceStrike}>{Currency}{fpPrice.toFixed(2)}</Text>
              )}
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Constants.white,
    borderRadius: 14,
    marginHorizontal: 10,
    marginVertical: 6,
    shadowColor: Constants.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  banner: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
    fontSize: 13,
  },
  bannerPromo: {
    color: Constants.white,
    fontFamily: FONTS.Regular,
    fontSize: 12,
    flex: 1,
  },
  bannerRemoveBtn: {
    marginLeft: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A72ABF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerRemoveText: {
    color: Constants.white,
    fontSize: 14,
    fontFamily: FONTS.Bold,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  mainBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  mainBadgeText: {
    color: '#1565C0',
    fontSize: 11,
    fontFamily: FONTS.Medium,
  },
  productName: {
    fontSize: 13,
    color: Constants.black,
    fontFamily: FONTS.Medium,
  },
  unitText: {
    fontSize: 12,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
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
    fontSize: 11,
    fontFamily: FONTS.Bold,
  },
  qtyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepper: {
    flexDirection: 'row',
    width: 120,
    height: 40,
  },
  stepBtn: {
    backgroundColor: Constants.greennew,
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnLeft: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  stepBtnRight: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  qtyText: {
    backgroundColor: Constants.greennew,
    color: Constants.white,
    flex: 1,
    textAlign: 'center',
    height: '100%',
    paddingVertical: '5%',
    fontSize: 20,
    alignSelf: 'center',
    fontFamily: FONTS.Black,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalPrice: {
    fontSize: 14,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  addBtn: {
    backgroundColor: '#2E7D32',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Constants.customgrey3,
    marginHorizontal: 12,
  },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  freeImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  freeInfo: {
    flex: 1,
    gap: 2,
  },
  freeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  giftIcon: {
    fontSize: 13,
  },
  freeTag: {
    fontSize: 12,
    color: '#2E7D32',
    fontFamily: FONTS.Bold,
  },
  freePriceBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  freePriceStrike: {
    fontSize: 12,
    color: '#6A7282',
    fontFamily: FONTS.Bold,
    textDecorationLine: 'line-through',
  },
  freeBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freeBadgeText: {
    color: Constants.white,
    fontSize: 11,
    fontFamily: FONTS.Bold,
  },
});

export default ComboOfferCard;
