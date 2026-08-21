/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import Constants, { Currency, FONTS } from '../../Assets/Helpers/constant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext, LoadContext } from '../../../App';
import { CartFilledIcon, MinusIcon, Plus2Icon } from '../../../Theme';
import DriverHeader from '../../Assets/Component/DriverHeader';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../../navigationRef';
import { GetApi } from '../../Assets/Helpers/Service';
import RenderHTML from 'react-native-render-html';
import ProductCard from './ProductCard';
import Toast from 'react-native-toast-message';
import moment from 'moment';
// import { SafeAreaView } from 'react-native-safe-area-context';
import ImageView from "react-native-image-viewing";
import i18n from 'i18next';
import Video from 'react-native-video';
import { Play } from 'lucide-react-native';

const Preview = props => {
  const productid = props?.route?.params;
  console.log('productid', productid);
  const { t } = useTranslation();
  console.log(productid);
  const [currentproduct, setcurrentproduct] = useState({});
  const [cartdetail, setcartdetail] = useContext(CartContext);
  const [loading, setLoading] = useContext(LoadContext);
  const [selectedslot, setsselectedslot] = useState();
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [productdata, setproductdata] = useState();
  const isVendorClosed =
    productdata?.vendor?.type === 'restaurant' && productdata?.vendor?.isOpen === false;
  const [isInCart, setIsInCart] = useState(false);
  const [availableQty, setAvailableQty] = useState(0);
  const [productList, SetProductList] = useState([]);
  const [productReviews, setProductReviews] = useState([]);
  const scrollRef = useRef(null);
  const [images, setImages] = useState([])
  const [imageIndex, setImageIndex] = useState(0)
  const [visibleImg, setVisibleImg] = useState(false)
  const [mediaList, setMediaList] = useState([])
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null)
  // const [isFlashSale, setIsFlashSale] = useState(false)


  const sumdata =
    cartdetail && cartdetail.length > 0
      ? cartdetail.reduce((a, item) => {
        return Number(a) + Number(item?.offer) * Number(item?.qty);
      }, 0)
      : null;
  console.log(sumdata);

  useEffect(() => {
    if (productid) {
      getProductById();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [productid]);
  useEffect(() => {
    if (cartdetail.length > 0) {
      const cartItem = cartdetail.find(
        f =>
          f.productid === productdata?._id &&
          (f.priceSlotIndex ?? 0) === selectedSlotIndex,
      );

      if (cartItem) {
        console.log('enter');
        setIsInCart(true);
        setAvailableQty(cartItem.qty);
        setcurrentproduct(cartItem);
      } else {
        setIsInCart(false);
        setAvailableQty(0);
        setcurrentproduct({});
      }
    } else {
      setIsInCart(false);
      setAvailableQty(0);
      setcurrentproduct({});
    }
  }, [cartdetail, productdata, selectedSlotIndex]);

  const getProductById = () => {
    setLoading(true);
    // GetApi(`getProductById/${productid}`).then(
    GetApi(`getProductByslug/${productid}`).then(
      async res => {
        setLoading(false);
        console.log('product data', res);
        if (res.status) {
          const medias = res.data.varients.flatMap(item => [
            ...(item.image || []).map(url => ({ type: "image", url })),
            ...(item.video || []).map(url => ({ type: "video", url }))
          ]);
          console.log(medias)
          setMediaList(medias)
          getProductByIdActiveFlashSale(res.data._id, res.data);
          setProductReviews(res.data?.reviews);
          // setProductReviews([...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews, ...res.data?.reviews] || []);

          // setproductdata(res.data);
          // if (res?.data?.price_slot && res?.data?.price_slot?.length > 0) {
          //   setsselectedslot(res?.data?.price_slot[0]);
          // }
        }
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const getProductByIdActiveFlashSale = (pro_id, pro_data) => {
    // GetApi(`getProductById/${productid}`).then(
    GetApi(`getFlashSaleByProduct/${pro_id}`).then(
      async res => {
        setLoading(false);
        // console.log('product data', res);
        if (res.status) {
          pro_data.price_slot.forEach(element => {
            if (JSON.stringify(element) === JSON.stringify(res.data.price_slot)) {

              element.isFlashSale = true;
              element.other_price = element.our_price; // Retain the original other_price
              element.our_price = res.data.price;
            }

          });
          setproductdata(pro_data);
          if (pro_data?.price_slot && pro_data?.price_slot?.length > 0) {
            setsselectedslot(pro_data?.price_slot[0]);
            setSelectedSlotIndex(0);
          }

        } else {
          setproductdata(pro_data);
          if (pro_data?.price_slot && pro_data?.price_slot?.length > 0) {
            setsselectedslot(pro_data?.price_slot[0]);
            setSelectedSlotIndex(0);
          }
        }
      },
      err => {
        setproductdata(pro_data);
        if (pro_data?.price_slot && pro_data?.price_slot?.length > 0) {
          setsselectedslot(pro_data?.price_slot[0]);
          setSelectedSlotIndex(0);
        }
        setLoading(false);
        console.log(err);
      },
    );
  };


  useEffect(() => {
    console.log('productReviews', productReviews);
  }, [productReviews]);

  const getproductByCategory = async (category_id, product_id) => {
    console.log('category_id', category_id);
    console.log('product_id', product_id);

    GetApi(
      `getProductBycategoryId?category=${category_id}&product_id=${product_id}`,
    ).then(
      async res => {
        setLoading(false);
        console.log(res);
        const sameItem = res?.data?.filter(f => f._id !== productid);
        SetProductList(sameItem);
      },
      err => {
        setLoading(false);
        console.log(err);
      },
    );
  };

  const checkQuantity = async () => {
    try {
      const res = await GetApi(
        `checkQuantity/${productdata._id}`,
      );
      return res.status ? res.data : { qty: 0 };
    } catch (err) {
      return { qty: 0 };
    }
  };

  useEffect(() => {
    if (productdata && productdata?.category?.slug) {
      getproductByCategory(productdata?.category?.slug, productdata?._id);
    }
  }, [productdata]);

  console.log('cartdetail', cartdetail);
  console.log('currentproduct', currentproduct);

  const cartdata = async () => {
    console.log('selectedslot', selectedslot);

    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];


    // Check if the exact product with selected price_slot exists
    const existingProduct = existingCart.find(
      f =>
        f.productid === productdata._id &&
        (f.priceSlotIndex ?? 0) === selectedSlotIndex,
    );


    if (!existingProduct) {

      const newProduct = {
        // ...productdata,
        // qty: availableQty || 1,
        // price: selectedslot.our_price,
        // price_slot: selectedslot,
        productid: productdata._id,
        productname: productdata.name,
        vietnamiesName: productdata?.vietnamiesName,
        price: selectedslot.other_price,
        offer: selectedslot.our_price,
        price_slot: selectedslot,
        priceSlotIndex: selectedSlotIndex,
        image: productdata.varients[0].image[0],
        qty: 1,
        seller_id: productdata.userid,
        isShipmentAvailable: productdata.isShipmentAvailable,
        isInStoreAvailable: productdata.isInStoreAvailable,
        isCurbSidePickupAvailable: productdata.isCurbSidePickupAvailable,
        isNextDayDeliveryAvailable: productdata.isNextDayDeliveryAvailable,
        slug: productdata.slug,
        productSource: selectedslot.isFlashSale ? "SALE" : "NORMAL",
      };

      const updatedCart = [...existingCart, newProduct];
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
      console.log('Product added to cart:', newProduct);
    } else {
      console.log(
        'Product already in cart with this price slot:',
        existingProduct,
      );
    }
  };

  const cartdata2 = async productdata => {
    const existingCart = Array.isArray(cartdetail) ? cartdetail : [];

    const existingProduct = existingCart.find(
      f =>
        f.productid === productdata._id &&
        (f.priceSlotIndex ?? 0) === 0,
    );

    if (!existingProduct) {
      const newProduct = {
        productid: productdata._id,
        productname: productdata.name,
        vietnamiesName: productdata?.vietnamiesName,
        price: productdata?.price_slot[0]?.other_price,
        offer: productdata?.price_slot[0]?.our_price,
        image: productdata.varients[0].image[0],
        price_slot: productdata?.price_slot[0],
        priceSlotIndex: 0,
        qty: 1,
        seller_id: productdata.userid,
        isShipmentAvailable: productdata.isShipmentAvailable,
        isInStoreAvailable: productdata.isInStoreAvailable,
        isCurbSidePickupAvailable: productdata.isCurbSidePickupAvailable,
        isNextDayDeliveryAvailable: productdata.isNextDayDeliveryAvailable,
        slug: productdata.slug,
        tax_code: productdata.tax_code,
        tax: productdata.tax,
        productSource: productdata?.productSource || "NORMAL",
      };

      const updatedCart = [...existingCart, newProduct];
      setcartdetail(updatedCart);
      await AsyncStorage.setItem('cartdata', JSON.stringify(updatedCart));
      console.log('Product added to cart:', newProduct);
    } else {
      console.log(
        'Product already in cart with this price slot:',
        existingProduct,
      );
      let stringdata = cartdetail.map(_i => {
        if (_i?.productid == productdata._id) {
          console.log('enter');
          return { ..._i, qty: _i?.qty + 1 };
        } else {
          return _i;
        }
      });
      console.log(stringdata);
      setcartdetail(stringdata);
      await AsyncStorage.setItem('cartdata', JSON.stringify(stringdata));
    }
    // navigate('Cart');
    Toast.show({
      type: 'success',
      text1: t('Product added to cart successfully!'),
    })
  };

  const formatPricePerUnit = (price, quantity, unit) => {
    let unitText = '';
    let factor = 1;

    switch (unit?.toLowerCase()) {
      case 'kg':
        unitText = '1 kg';
        factor = 1; // 1 kg = 1000 g → 100 g = 1/10 of the price
        break;
      case 'gm':
        unitText = '100 gms';
        factor = 100; // Convert the given grams into 100 gms equivalent
        break;
      case 'litre':
        unitText = '1 liter';
        factor = 1; // 1 litre = 1000 ml → 100 ml = 1/10 of the price
        break;
      case 'liter':
        unitText = '1 liter';
        factor = 1; // 1 litre = 1000 ml → 100 ml = 1/10 of the price
        break;
      case 'ml':
        unitText = '100 ml';
        factor = 100; // Convert the given ml into 100 ml equivalent
        break;
      case 'piece':
        unitText = 'per piece';
        factor = 1; // Price remains the same
        break;
      case 'pack':
        unitText = 'per pack';
        factor = 1; // Price remains the same
        break;
      case 'lb':
        unitText = '1 lb';
        factor = 1; // Assuming you want price per 1 lb
        break;
      case 'each':
        unitText = 'each';
        factor = 1; // Price per item
        break;
      case 'case':
        unitText = 'case';
        factor = 1; // Price per item
        break;
      default:
        return 'Invalid unit';
    }

    const calculatedPrice = (price / quantity) * factor;
    return `${Currency} ${calculatedPrice.toFixed(2)} / ${unitText}`;
  };

  const renderReview = ({ item }) => {
    const reviewImages = (item?.images || []).map(uri => ({ uri }));
    return (
      <View style={styles.reviewCard}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item?.posted_by?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item?.posted_by?.username}</Text>
              {item?.verified_buyer && (
                <Text style={styles.verified}>✓ Verified Buyer</Text>
              )}
            </View>
            <Text style={styles.date}>
              {moment(item?.createdAt).format('MMM DD, YYYY')}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{item?.description}</Text>

        {/* Image Section */}
        {item?.images && item?.images.length > 0 && (
          <View style={styles.imageContainer}>
            {item.images.length === 1 ? (
              <TouchableOpacity
                onPress={() => {
                  setImages(reviewImages);
                  setImageIndex(0);
                  setVisibleImg(true);
                }}
                activeOpacity={0.9}>
                <Image
                  source={{ uri: item.images[0] }}
                  style={styles.singleImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.multiImageGrid}>
                {item.images.slice(0, 4).map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setImages(reviewImages);
                      setImageIndex(index);
                      setVisibleImg(true);
                    }}
                    activeOpacity={0.9}
                    style={styles.multiImageWrapper}>
                    <Image
                      source={{ uri: image }}
                      style={styles.multiImage}
                      resizeMode="cover"
                    />
                    {index === 3 && item.images.length > 4 && (
                      <View style={styles.overlay}>
                        <Text style={styles.overlayText}>
                          +{item.images.length - 4}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const width = Dimensions.get('window').width - 40;
  const mixedStyle = {
    body: {
      whiteSpace: 'normal',
      color: '#858080',
      fontSize: '14px',
      fontWeight: '400',
    },
    p: {
      color: '#858080',
      fontSize: '14px',
      fontWeight: '400',
      whiteSpace: 'normal',
    },
  };
  return (
    <View style={styles.container} >
      <ImageView
        images={images}
        imageIndex={imageIndex}
        visible={visibleImg}
        onRequestClose={() => setVisibleImg(false)}
      />
      <DriverHeader item={t('Product Detail')} showback={true} showCart={true} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: 20, backgroundColor: Constants.lightgreen }}
        contentContainerStyle={{ paddingBottom: 50, backgroundColor: Constants.lightgreen }}
        ref={scrollRef}>
        <View style={{ marginTop: 0, marginHorizontal: -20 }}>
          <SwiperFlatList
            // autoplay
            // autoplayDelay={2}
            // autoplayLoop
            // index={2}
            showPagination
            paginationActiveColor="green"
            paginationStyle={{
              bottom: 5,
              backgroundColor: 'white',
              paddingHorizontal: 5,
              paddingVertical: 15,
              borderRadius: 10,
              alignSelf: 'center',
            }}
            paginationStyleItem={{
              marginTop: -8,
            }}
            // data={productdata?.varients[0].image || []}
            data={mediaList}
            renderItem={({ item, index }) => (
              <View style={{
                paddingBottom: 55,
                width: Dimensions.get('window').width,
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                paddingHorizontal: 20,
              }}>
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 15,
                  padding: 15,
                  width: '100%',
                  height: 230,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 15,
                  position: 'relative',
                  // Shadow properties
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,  // Android ke liye
                }}>
                  <Pressable onPress={() => {
                    if (item.type === "image") {
                      const newImageArray = mediaList.filter(m => m.type === 'image').map(f => { return { uri: f.url } })
                      setImages(newImageArray);
                      setImageIndex(index);
                      setVisibleImg(true)
                    }
                  }}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    {item.type === "image" && <Image
                      source={{ uri: `${item.url}` }}
                      style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: 15,
                      }}
                      resizeMode="contain"
                      key={index}
                    />}
                    {item.type === "video" && (
                      <View style={{ width: '100%', aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center' }}>
                        <Video
                          source={{ uri: `${item.url}` }}
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          controls
                          paused={playingVideoIndex !== index}
                          resizeMode="contain"
                        />
                        {playingVideoIndex !== index && (
                          <Pressable
                            onPress={() => setPlayingVideoIndex(index)}
                            style={styles.playButtonOverlay}>
                            <Play size={26} color={Constants.white} fill={Constants.white} style={{ marginLeft: 3 }} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </Pressable>
                  {isVendorClosed && (
                    <View style={styles.closedOverlay}>
                      <Text style={styles.closedOverlayText}>{t('Ordering Window Closed')}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        </View>
        <Text
          style={styles.proname}
          numberOfLines={3}  // Add this line
          ellipsizeMode="tail"  // Add this line
        >
          {i18n.language === 'vi' ? (productdata?.vietnamiesName || productdata?.name) : productdata?.name}
        </Text>
        <Text style={[styles.dectitle, { marginLeft: 10, marginTop: 0 }]}>
          {productdata?.short_description}
        </Text>
        <View style={[styles.pricecov, { marginTop: 10, marginBottom: 0 }]}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!isVendorClosed && (
              <>
                <Text style={styles.maintxt2}>
                  {Currency} {selectedslot?.our_price}
                </Text>
                {selectedslot?.other_price && (
                  <Text
                    style={[styles.weight, { textDecorationLine: 'line-through' }]}>
                    {Currency} {selectedslot?.other_price}
                  </Text>
                )}
                {selectedslot?.other_price && (
                  <Text style={styles.disctxt2}>
                    {(
                      ((selectedslot?.other_price - selectedslot?.our_price) /
                        selectedslot?.other_price) *
                      100
                    ).toFixed(0)}
                    % {t('off')}
                  </Text>
                )}
              </>
            )}
          </View>
          {isVendorClosed ? (
            <View>
              <Text style={styles.vendorClosedBtn}>{t('Ordering Window Closed')}</Text>
              <Text style={styles.vendorClosedNote}>
                {t('{{name}} is currently closed. Ordering is unavailable right now.', {
                  name: productdata?.vendor?.name || 'This restaurant',
                })}
              </Text>
            </View>
          ) : isInCart ? (
            <View style={styles.addcov}>
              <TouchableOpacity
                style={styles.plus}
                onPress={async () => {
                  if (availableQty > 1) {
                    // Decrease quantity
                    const updatedCart = cartdetail.map(item => {
                      if (
                        item.productid === currentproduct?.productid &&
                        (item.priceSlotIndex ?? 0) === selectedSlotIndex
                      ) {
                        return {
                          ...item,
                          qty: item.qty - 1,
                          price: selectedslot.other_price,
                          offer: selectedslot.our_price,
                          price_slot: selectedslot,
                        };
                      }
                      return item;
                    });

                    setcartdetail(updatedCart);
                    await AsyncStorage.setItem(
                      'cartdata',
                      JSON.stringify(updatedCart),
                    );
                    console.log(
                      'Product quantity decreased:',
                      currentproduct?.productname,
                    );

                    setAvailableQty(availableQty - 1);
                  } else {
                    // Remove product from cart if qty is 1
                    const updatedCart = cartdetail.filter(item => {
                      return !(
                        item.productid === currentproduct?.productid &&
                        (item.priceSlotIndex ?? 0) === selectedSlotIndex
                      );
                    });

                    setcartdetail(updatedCart);
                    await AsyncStorage.setItem(
                      'cartdata',
                      JSON.stringify(updatedCart),
                    );
                    console.log(
                      'Product removed from cart:',
                      currentproduct?.productname,
                    );

                    setIsInCart(false);
                    setAvailableQty(0);
                  }
                }}>
                <MinusIcon color={Constants.white} height={20} width={20} />
              </TouchableOpacity>
              <Text style={styles.plus2}>{availableQty}</Text>
              <TouchableOpacity
                style={styles.plus3}
                onPress={async () => {
                  const existingCartItem = cartdetail.find((cartItem) => cartItem.productid === currentproduct?.productid && (cartItem.priceSlotIndex ?? 0) === selectedSlotIndex);
                  console.log('Existing cart item:', existingCartItem);
                  const quantityResult = await checkQuantity()
                  console.log('Available quantity:', quantityResult);

                  if (quantityResult.vendorClosed) {
                    Toast.show({
                      type: 'error',
                      text1: t('{{name}} is currently closed. Ordering is unavailable right now.', {
                        name: quantityResult.vendorName || productdata?.vendor?.name || 'This restaurant',
                      }),
                    })
                    return
                  }

                  if (existingCartItem.qty + 1 > (quantityResult.qty ?? 0)) {
                    Toast.show({
                      type: 'error',
                      text1: t('Item is not available in this quantity in stock. Please choose a different item.'),
                    })
                    return
                  }

                  cartdetail.forEach(item => {
                    if (
                      item.productid === currentproduct?.productid &&
                      (item.priceSlotIndex ?? 0) === selectedSlotIndex
                    ) {
                      item.qty = item.qty + 1;
                      item.price = selectedslot.other_price;
                      item.offer = selectedslot.our_price;
                      item.price_slot = selectedslot;
                    };
                  });

                  setcartdetail([...cartdetail]);
                  await AsyncStorage.setItem(
                    'cartdata',
                    JSON.stringify([...cartdetail]),
                  );
                  console.log(
                    'Product quantity increased:',
                    currentproduct?.productname,
                  );
                }}>
                <Plus2Icon color={Constants.white} height={20} width={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const itemQuantity = Number(productdata?.Quantity ?? 0);
                if (itemQuantity <= 0) {
                  Toast.show({
                    type: 'error',
                    text1: t('This item is currently out of stock.'),
                  })
                  return;
                }
                cartdata();
              }}
            >
              <Text
                style={styles.addbtn}

              >
                {t('ADD')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginTop: 5, display: isVendorClosed ? 'none' : 'flex' }}>
          {!isVendorClosed && productdata?.price_slot &&
            productdata?.price_slot.length > 0 &&
            productdata?.price_slot[0].unit &&
            productdata.price_slot
              .map((item, originalIndex) => ({ item, originalIndex }))
              .sort((a, b) => {
                // Sort by our_price, then by value if prices are equal
                if (a.item.our_price === b.item.our_price) {
                  return a.item.value - b.item.value;
                }
                return a.item.our_price - b.item.our_price;
              })
              .map(({ item, originalIndex }, i) => (
                <TouchableOpacity
                  style={[
                    styles.box,
                    {
                      marginRight:
                        productdata?.price_slot.length === i + 1 ? 20 : 10,
                      backgroundColor:
                        selectedslot?.our_price === item.our_price
                          ? Constants.white
                          : Constants.lightgreen,
                      borderColor:
                        selectedslot?.our_price === item.our_price
                          ? Constants.custom_green
                          : Constants.lightgreen,
                    },
                  ]}
                  key={i}
                  onPress={() => {
                    setsselectedslot(item);
                    setSelectedSlotIndex(originalIndex);
                  }}>
                  {item?.other_price && (
                    <ImageBackground
                      source={require('../../Assets/Images/star1.png')}
                      style={styles.cardimg2}>
                      {item?.isFlashSale ? <Text style={styles.offtxt}>
                        Sale
                      </Text>
                        : <Text style={styles.offtxt}>
                          {(
                            ((item?.other_price - item?.our_price) /
                              item?.other_price) *
                            100
                          ).toFixed(0)}
                          %
                        </Text>}
                      {!item?.isFlashSale && <Text style={styles.offtxt}>{t('off')}</Text>}
                    </ImageBackground>
                  )}
                  <Text style={styles.weight}>
                    {item?.value}{' '}
                    {item.unit}
                  </Text>
                  <View style={{ marginTop: -5 }}>
                    <Text style={styles.maintxt}>
                      {Currency}
                      {item.our_price}
                    </Text>
                    {/* <Text style={[styles.disctxt, {marginTop: -3}]}>
                        {formatPricePerUnit(
                          item.our_price,
                          item?.value,
                          item.unit,
                        )}
                      </Text> */}
                  </View>
                </TouchableOpacity>
              ))}
        </ScrollView>
        {productReviews && productReviews.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.title}>Reviews</Text>
            <FlatList
              data={productReviews}
              keyExtractor={(_, i) => i.toString()}
              renderItem={renderReview}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
        <View style={styles.line} />
        <View style={styles.productinfocov}>
          <Text style={styles.proddec}>{t('Product Information')}</Text>
          {/* <View style={styles.expirycard}>
            <Text style={styles.exptxt}>{t('EXPIRY DATE')}</Text>
            <Text style={styles.exptxt2}>
              {moment(productdata?.expirydate).format('DD MMM yyyy')}
            </Text>
          </View> */}
        </View>
        {productdata?.long_description && (
          <View style={{ marginTop: 10, backgroundColor: Constants.lightgreen, paddingHorizontal: -10 }}>
            <RenderHTML
              contentWidth={width}
              tagsStyles={mixedStyle}
              source={{ html: productdata?.long_description }}
            />
          </View>
        )}
        {productdata?.disclaimer && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.dechead}>{t('Disclaimer')}</Text>
            <RenderHTML
              contentWidth={width}
              tagsStyles={mixedStyle}
              source={{ html: productdata?.disclaimer }}
            />
          </View>
        )}

        {productdata?.Warning && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.dechead}>{t('Warning')}</Text>
            <RenderHTML
              contentWidth={width}
              tagsStyles={mixedStyle}
              source={{ html: productdata?.Warning }}
            />
          </View>
        )}
        {productdata?.ingredients && (
          <View style={{ marginVertical: 10 }}>
            <Text style={styles.dechead}>{t('Country of Origin')}</Text>
            <Text style={styles.dectitle}>{productdata?.origin}</Text>
          </View>
        )}


        {/* <View style={{marginVertical: 10}}>
          <Text style={styles.dechead}>{t('MANUFACTURER NAME')}</Text>
          <Text style={styles.dectitle}>{productdata?.manufacturername}</Text>
        </View>
        <View style={{marginVertical: 10, marginBottom: 120}}>
          <Text style={styles.dechead}>{t('MANUFACTURER ADDRESS')}</Text>
          <Text style={styles.dectitle}>{productdata?.manufactureradd}</Text>
        </View> */}
        {/* Frequently bought product */}
        <Text style={[styles.proddec, { marginTop: 10 }]}>
          {t('Frequently Bought Products')}
        </Text>
        <View style={{ marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {productList.map((item, index) => {
            const cartItem = Array.isArray(cartdetail)
              ? cartdetail.find(it => it?.productid === item?._id)
              : undefined;

            return (
              <View
                key={item._id || index.toString()}
                style={[
                  styles.box2,
                  { width: '48%' }
                ]}>
                <ProductCard
                  item={item}
                  cartItem={cartItem}
                  cartdata={cartdata2}
                  setcartdetail={setcartdetail}
                  cartdetail={cartdetail}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.line} />

      <View style={styles.line} />
      {/* {currentproduct && (
        <TouchableOpacity
          style={styles.cartbtn}
          onPress={() => navigate('Cart')}>
          <Text style={styles.buttontxt}>
            {' '}
            {cartdetail.length} {t('items')} | {Currency}
            {sumdata}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CartFilledIcon
              color={Constants.white}
              style={{ marginRight: -10, marginTop: -2 }}
              height={26}
            />
            <Text style={styles.buttontxt}>{t('View Cart')}</Text>
          </View>
        </TouchableOpacity>
      )} */}
    </View>
  );
};

export default Preview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.lightgreen,
    // padding: 20,
  },
  proname: {
    fontSize: 20,
    color: Constants.black,
    fontFamily: FONTS.Bold,
    marginVertical: 10,
    marginLeft: 10,
    backgroundColor: Constants.lightgreen,
    flexWrap: 'wrap',
    flexShrink: 1,

  },
  weight: {
    fontSize: 14,
    color: Constants.black,
    fontFamily: FONTS.Regular,
    marginVertical: 5,
  },
  disctxt: {
    fontSize: 14,
    color: Constants.linearcolor,
    fontFamily: FONTS.Regular,
  },
  disctxt2: {
    fontSize: 16,
    color: Constants.pink,
    fontFamily: FONTS.Medium,
    alignSelf: 'center',
  },
  maintxt: {
    fontSize: 16,
    color: Constants.black,
    fontFamily: FONTS.Bold,
    // textDecorationLine: 'line-through',
  },
  maintxt2: {
    fontSize: 20,
    color: Constants.custom_green,
    // fontFamily: FONTS.Bold,
    fontWeight: '900',
    marginLeft: 10
    // textDecorationLine: 'line-through',
  },
  box: {
    backgroundColor: Constants.lightgreen,
    width: 150,
    padding: 8,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Constants.linearcolor,
    marginLeft: 10,
    marginTop: 0,
    marginBottom: 5,
    overflow: 'visible'
  },
  box2: {
    // width: 180,
    marginVertical: 5,
    // boxShadow: '0 0 6 0.5 grey',
  },
  cardimg2: {
    height: 45,
    width: 45,
    position: 'absolute',
    right: -7,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // zIndex:99
    // backgroundColor:Constants.red
  },
  offtxt: {
    fontSize: 12,
    color: Constants.white,
    fontFamily: FONTS.Black,
    marginLeft: 2,
  },
  addbtn: {
    backgroundColor: Constants.pink,
    color: Constants.white,
    paddingHorizontal: 25,
    paddingVertical: 7,
    borderRadius: 25,
    fontSize: 18,
    fontFamily: FONTS.Bold,
    height: 40,
    // position: 'absolute',
    // right: 0,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedOverlayText: {
    backgroundColor: '#DC2626',
    color: Constants.white,
    fontSize: 13,
    fontFamily: FONTS.Bold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
  },
  vendorClosedBtn: {
    backgroundColor: Constants.customgrey3,
    color: Constants.customgrey,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    fontSize: 16,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
    overflow: 'hidden',
  },
  vendorClosedNote: {
    color: '#C2410C',
    fontSize: 12,
    fontFamily: FONTS.Regular,
    marginTop: 6,
  },
  line: {
    height: 4,
    backgroundColor: Constants.customgrey3,
    width: '120%',
    marginLeft: -20,
  },
  pricecov: {
    flexDirection: 'row',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proddec: {
    fontSize: 18,
    color: Constants.black,
    fontFamily: FONTS.Bold,
    // marginTop:20
  },
  dechead: {
    fontSize: 14,
    color: Constants.black,
    fontFamily: FONTS.Medium,
    // marginTop:20
  },
  dectitle: {
    fontSize: 14,
    color: Constants.customgrey,
    fontFamily: FONTS.Regular,
    // marginTop:20
  },
  productinfocov: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: Constants.lightgreen,
  },
  expirycard: {
    backgroundColor: '#EDEDED',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
  },
  exptxt: {
    fontSize: 12,
    color: Constants.black,
    fontFamily: FONTS.Bold,
  },
  exptxt2: {
    fontSize: 14,
    color: Constants.linearcolor,
    fontFamily: FONTS.Medium,
  },
  addcov: {
    flexDirection: 'row',
    width: 120,
    height: 40,
    // borderRadius:10
  },
  plus: {
    backgroundColor: Constants.pink,
    flex: 1,
    textAlign: 'center',
    height: '100%',
    alignSelf: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus2: {
    backgroundColor: '#F3F3F3',
    color: Constants.black,
    flex: 1,
    textAlign: 'center',
    height: '100%',
    paddingVertical: '5%',
    fontSize: 20,
    alignSelf: 'center',
    fontFamily: FONTS.Black,
  },
  plus3: {
    backgroundColor: Constants.pink,
    flex: 1,
    textAlign: 'center',
    alignSelf: 'center',
    height: '100%',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttontxt: {
    color: Constants.white,
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  cartbtn: {
    height: 60,
    // width: 370,
    borderRadius: 10,
    backgroundColor: Constants.pink,
    // marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  reviewCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f9f9f9',
    flex: 1,
    margin: 4,
    width: '20rem',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#d4af37',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 12,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: 'black',
    fontSize: 16,
  },
  verified: {
    marginLeft: 6,
    color: 'green',
    fontSize: 12,
  },
  date: {
    color: 'black',
    fontSize: 12,
  },
  description: {
    color: 'black',
    fontSize: 14,
    paddingTop: 12,
  },
  imageContainer: {
    paddingTop: 8,
  },
  singleImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  multiImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  multiImageWrapper: {
    width: '48%',
    height: 80,
    marginBottom: 4,
    position: 'relative',
  },
  multiImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  overlayText: {
    color: 'white',
    fontWeight: '600',
  },
  playButtonOverlay: {
    position: 'absolute',
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
