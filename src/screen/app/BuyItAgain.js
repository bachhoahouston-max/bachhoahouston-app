import React, {useCallback, useContext, useState} from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CartContext, LoadContext, UserContext} from '../../../App';
import {
  getBuyItAgainCategoryProducts,
  getPurchasedProducts,
} from '../../Assets/Helpers/buyItAgain';
import {navigate} from '../../../navigationRef';
import Constants, {FONTS} from '../../Assets/Helpers/constant';
import DriverHeader from '../../Assets/Component/DriverHeader';
import ProductCard from './ProductCard';

const BuyItAgain = () => {
  const {t} = useTranslation();
  const [user] = useContext(UserContext);
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [, setLoading] = useContext(LoadContext);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadProducts = useCallback(async (pageToLoad = 1) => {
    if (!user?._id || !user?.token) {
      navigate('Auth');
      return;
    }

    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await getBuyItAgainCategoryProducts(pageToLoad);
      setProducts(previous =>
        pageToLoad === 1 ? result.products : [...previous, ...result.products],
      );
      setPage(pageToLoad);
      setTotalPages(result.totalPages);
    } catch (error) {
      // Older deployments may not expose the paginated endpoint yet.
      if (pageToLoad === 1) {
        try {
          setProducts(await getPurchasedProducts());
        } catch (fallbackError) {
          Toast.show({
            type: 'error',
            text1:
              fallbackError?.message ||
              error?.message ||
              t('Failed to load buy it again products'),
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: error?.message || t('Failed to load buy it again products'),
        });
      }
    } finally {
      if (pageToLoad === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [setLoading, t, user?._id, user?.token]);

  useFocusEffect(
    useCallback(() => {
      loadProducts(1);
    }, [loadProducts]),
  );

  const addToCart = async product => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];
    const existingProduct = existingCart.find(
      item => item?.productid === product?._id && (item?.priceSlotIndex ?? 0) === 0,
    );
    const priceSlot = product?.price_slot?.[0] || {};

    const updatedCart = existingProduct
      ? existingCart.map(item =>
          item?.productid === product._id && (item?.priceSlotIndex ?? 0) === 0
            ? {...item, qty: item.qty + 1}
            : item,
        )
      : [
          ...existingCart,
          {
            productid: product._id,
            productname: product.name,
            vietnamiesName: product.vietnamiesName,
            price: priceSlot.other_price,
            offer: priceSlot.our_price,
            image: product?.varients?.[0]?.image?.[0] || product?.image,
            price_slot: priceSlot,
            priceSlotIndex: 0,
            qty: 1,
            seller_id: product.userid,
            isShipmentAvailable: product.isShipmentAvailable,
            isInStoreAvailable: product.isInStoreAvailable,
            isCurbSidePickupAvailable: product.isCurbSidePickupAvailable,
            isNextDayDeliveryAvailable: product.isNextDayDeliveryAvailable,
            slug: product.slug,
            tax_code: product.tax_code,
            tax: product.tax,
            productSource: 'NORMAL',
          },
        ];

    setcartdetail(updatedCart);
    await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
  };

  return (
    <SafeAreaView style={styles.container}>
      <DriverHeader item={t('Buy it again')} showback={true} showCart={true} />
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={item => String(item._id)}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {t('No previously purchased products available')}
            </Text>
          </View>
        }
        ListFooterComponent={
          page < totalPages ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadProducts(page + 1)}
              disabled={loadingMore}>
              <Text style={styles.loadMoreText}>
                {loadingMore ? t('Loading...') : t('Load more')}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({item}) => {
          const cartItem = cartdetail?.find(
            cart => cart?.productid === item?._id && (cart?.priceSlotIndex ?? 0) === 0,
          );
          return (
            <View style={styles.box}>
              <ProductCard
                item={item}
                cartItem={cartItem}
                cartdata={addToCart}
                setcartdetail={setcartdetail}
                cartdetail={cartdetail}
              />
            </View>
          );
        }}
      />
      {/* Previous shortage-only UI used the same product-card list above. */}
    </SafeAreaView>
  );
};

export default BuyItAgain;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.lightgreen,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  box: {
    width: '48%',
    marginVertical: 10,
  },
  empty: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Constants.black,
    fontSize: 20,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Constants.greennew,
  },
  loadMoreText: {
    color: Constants.white,
    fontFamily: FONTS.Bold,
    fontSize: 14,
  },
});
