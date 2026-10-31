import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Toast from 'react-native-toast-message';
import {Check, CheckCircle2, Copy, Link2, PackageSearch, Plus, Search, Share2, X} from 'lucide-react-native';
import {GetApi, Post} from '../../../Assets/Helpers/Service';
import {COLORS, FONTS, RADIUS} from '../theme';
import {copyText, displayLink, money, shareProductLink} from '../utils';
import {Button, EmptyState} from './ui';

const PAGE_SIZE = 20;

const ProductLinkModal = ({visible, initialProduct, onClose, onCreated}) => {
  const {t} = useTranslation();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState(null);
  const [created, setCreated] = useState(null);
  // Ignores responses from searches the user has already typed past.
  const requestId = useRef(0);

  const load = useCallback((term, nextPage) => {
    const id = ++requestId.current;
    setLoading(true);
    const params = `page=${nextPage}&limit=${PAGE_SIZE}&search=${encodeURIComponent(term.trim())}`;
    GetApi(`affiliation/link-products?${params}`, {})
      .then(res => {
        if (id !== requestId.current) {
          return;
        }
        const items = res?.status ? res.data?.products || [] : [];
        setProducts(prev => (nextPage === 1 ? items : [...prev, ...items]));
        setHasMore(!!res?.data?.hasMore);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => {
        if (id === requestId.current) {
          setLoading(false);
        }
      });
  }, []);

  const createLink = useCallback(
    product => {
      setCreatingId(product._id);
      Post('affiliation/links', {productId: product._id})
        .then(res => {
          if (res?.status) {
            setCreated(res.data);
            setProducts(prev => prev.map(p => (p._id === product._id ? {...p, linked: true} : p)));
            onCreated?.(res.data);
          } else {
            Toast.show({type: 'error', text1: res?.message || t('Unable to create link')});
            if (initialProduct) {
              onClose();
            }
          }
        })
        .catch(() => initialProduct && onClose())
        .finally(() => setCreatingId(null));
    },
    [initialProduct, onClose, onCreated, t],
  );

  // Reset each time the sheet opens.
  useEffect(() => {
    if (!visible) {
      return;
    }
    setCreated(null);
    setSearch('');
    if (initialProduct) {
      createLink(initialProduct);
    } else {
      load('', 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Debounced search.
  useEffect(() => {
    if (!visible || initialProduct) {
      return;
    }
    const timer = setTimeout(() => load(search, 1), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const renderProduct = ({item}) => {
    const busy = creatingId === item._id;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => createLink(item)}
        disabled={!!creatingId}
        activeOpacity={0.75}>
        {item.image ? (
          <Image source={{uri: item.image}} style={styles.thumb} resizeMode="contain" />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <PackageSearch size={20} color={COLORS.muted} />
          </View>
        )}
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {!!item.vietnamiesName && item.vietnamiesName !== item.name && (
            <Text style={styles.subName} numberOfLines={1}>{item.vietnamiesName}</Text>
          )}
          <Text style={styles.price}>
            {money(item.price)}
            {!!item.unit && <Text style={styles.unit}>{`  /  ${item.unit}`}</Text>}
          </Text>
        </View>
        <View style={[styles.rowAction, item.linked && styles.rowActionLinked]}>
          {busy ? (
            <ActivityIndicator size="small" color={item.linked ? COLORS.primary : COLORS.white} />
          ) : item.linked ? (
            <>
              <Check size={14} color={COLORS.primary} />
              <Text style={[styles.rowActionText, styles.rowActionTextLinked]}>{t('Linked')}</Text>
            </>
          ) : (
            <>
              <Plus size={14} color={COLORS.white} />
              <Text style={styles.rowActionText}>{t('Link')}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreated = () => (
    <View style={styles.created}>
      <View style={styles.createdIcon}>
        <CheckCircle2 size={30} color={COLORS.primary} />
      </View>
      <Text style={styles.createdTitle}>
        {created.existing ? t('You already have a link for this product') : t('Your product link is ready')}
      </Text>
      <Text style={styles.createdProduct} numberOfLines={2}>{created.product?.name}</Text>
      <TouchableOpacity
        style={styles.linkBox}
        activeOpacity={0.8}
        onPress={() => copyText(created.url, t('Link copied'))}>
        <Link2 size={16} color={COLORS.primary} />
        <Text style={styles.linkText} numberOfLines={1}>{displayLink(created.url)}</Text>
        <Copy size={16} color={COLORS.muted} />
      </TouchableOpacity>
      <View style={styles.createdActions}>
        <Button label={t('Copy Link')} icon={Copy} onPress={() => copyText(created.url, t('Link copied'))} />
        <Button label={t('Share')} icon={Share2} variant="outline" onPress={() => shareProductLink(t, created)} />
      </View>
      {initialProduct ? (
        <TouchableOpacity style={styles.secondary} onPress={onClose}>
          <Text style={styles.secondaryText}>{t('Done')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.secondary} onPress={() => setCreated(null)}>
          <Text style={styles.secondaryText}>{t('Link another product')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBody = () => {
    if (created) {
      return renderCreated();
    }
    if (initialProduct) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.creatingText}>{t('Creating your link...')}</Text>
        </View>
      );
    }
    return (
      <>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('Search products')}
            placeholderTextColor={COLORS.muted}
            returnKeyType="search"
            autoCorrect={false}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
              <X size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        {!search.trim() && <Text style={styles.overline}>{t('Best sellers')}</Text>}
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          renderItem={renderProduct}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !loading && load(search, page + 1)}
          ListEmptyComponent={
            loading ? null : (
              <EmptyState icon={PackageSearch} title={t('No products found')} text={t('Try another name.')} />
            )
          }
          ListFooterComponent={loading ? <ActivityIndicator style={styles.footer} color={COLORS.primary} /> : null}
        />
      </>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, !created && !initialProduct && styles.sheetTall]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>
              {created || initialProduct ? t('Product link') : t('Choose a product')}
            </Text>
            <TouchableOpacity style={styles.close} onPress={onClose} hitSlop={8} accessibilityLabel={t('Close')}>
              <X size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          {!created && !initialProduct && (
            <Text style={styles.hint}>{t('Pick a product to create a share link with your referral code.')}</Text>
          )}
          {renderBody()}
        </View>
      </KeyboardAvoidingView>
      {/* Toasts from the root render under a native Modal; this one shows above it. */}
      <Toast />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,25,15,0.45)'},
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
  },
  sheetTall: {height: '82%'},
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: 10,
    marginBottom: 6,
  },
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8},
  title: {fontFamily: FONTS.Bold, fontSize: 18, color: COLORS.text},
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {fontFamily: FONTS.Regular, fontSize: 12.5, color: COLORS.muted, marginBottom: 12},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {flex: 1, fontFamily: FONTS.Regular, fontSize: 14, color: COLORS.text, paddingVertical: 0},
  overline: {
    fontFamily: FONTS.SemiBold,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
  },
  list: {paddingVertical: 6, flexGrow: 1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  thumb: {width: 54, height: 54, borderRadius: RADIUS.sm, backgroundColor: COLORS.background},
  thumbEmpty: {alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1},
  name: {fontFamily: FONTS.SemiBold, fontSize: 13.5, color: COLORS.text},
  subName: {fontFamily: FONTS.Regular, fontSize: 11.5, color: COLORS.muted, marginTop: 1},
  price: {fontFamily: FONTS.Bold, fontSize: 13, color: COLORS.primary, marginTop: 3},
  unit: {fontFamily: FONTS.Regular, fontSize: 11.5, color: COLORS.muted},
  rowAction: {
    minWidth: 72,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  rowActionLinked: {backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: COLORS.primaryBorder},
  rowActionText: {fontFamily: FONTS.SemiBold, fontSize: 12, color: COLORS.white},
  rowActionTextLinked: {color: COLORS.primary},
  footer: {marginVertical: 16},
  centered: {alignItems: 'center', paddingVertical: 40},
  creatingText: {fontFamily: FONTS.Medium, fontSize: 13, color: COLORS.muted, marginTop: 12},
  created: {alignItems: 'stretch', paddingTop: 6},
  createdIcon: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdTitle: {fontFamily: FONTS.Bold, fontSize: 16, color: COLORS.text, textAlign: 'center', marginTop: 12},
  createdProduct: {fontFamily: FONTS.Regular, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4},
  linkBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {flex: 1, fontFamily: FONTS.Medium, fontSize: 13, color: COLORS.text},
  createdActions: {flexDirection: 'row', gap: 10, marginTop: 14},
  secondary: {alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 20, marginTop: 2},
  secondaryText: {fontFamily: FONTS.SemiBold, fontSize: 13.5, color: COLORS.primary},
});

export default ProductLinkModal;
