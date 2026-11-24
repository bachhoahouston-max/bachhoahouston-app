import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useIsFocused, usePreventRemove, useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Apple, Beef, BookOpen, Bookmark, Building2, CakeSlice, Camera, Car, Carrot, Clock, Coffee,
  Cookie, Dumbbell, Egg, Eye, Fish, Flower2, Fuel, Hospital, Hotel, IceCreamBowl,
  Landmark, Leaf, MapPin, MessageCircle, Milk, Package, PawPrint, Phone, Pill, Pizza,
  Salad, Scissors, Search, Shirt, ShoppingBag, ShoppingBasket, Smartphone, Soup, Star,
  Store, Utensils, UtensilsCrossed, Wheat, Wine, Wrench, X,
} from 'lucide-react-native';
import DriverHeader from '../../../Assets/Component/DriverHeader';
import { GetApi } from '../../../Assets/Helpers/Service';
import { exploreColors, exploreStyles, StoreImage, StoreNotice, StoreSpecialty } from './components';
import { StoreBookmarkButton, StoreBookmarksError, useStoreBookmarks } from './StoreBookmarks';
import ExploreHoustonBanner from './ExploreHoustonBanner';
import {
  filterStores, formatStoreHours, getStoreOpenStatus, isExploreHoustonVisible,
  localizedStoreText, readStoreResponse, resolveStoreCategory,
} from './storeDirectory';

const categoryIcons = {
  Apple, Beef, BookOpen, Building2, CakeSlice, Camera, Car, Carrot, Coffee, Cookie,
  Dumbbell, Egg, Fish, Flower2, Fuel, Hospital, Hotel, IceCreamBowl, Landmark, Leaf,
  Milk, Package, PawPrint, Pill, Pizza, Salad, Scissors, Shirt, ShoppingBag,
  ShoppingBasket, Smartphone, Soup, Store, Utensils, UtensilsCrossed, Wheat, Wine, Wrench,
};

const categoryTones = [
  ['#fde8dc', '#e0742f'],
  ['#fbe3e3', '#d64545'],
  ['#ece3f8', '#7e4fc4'],
  ['#dfeaf8', '#3a73c4'],
  ['#e1f0e3', '#3f8f55'],
  ['#fdf0d5', '#d9a31f'],
  ['#d9f0f3', '#2a97a8'],
];

const directoryMessages = {
  hidden: 'Explore Houston is unavailable',
  error: 'Unable to load stores',
  ready: 'No stores found',
};

function categoryIcon(category) {
  const name = category?.icon;
  return Object.prototype.hasOwnProperty.call(categoryIcons, name) ? categoryIcons[name] : Store;
}

function CategoryChip({ category, label, selected, onPress }) {
  const color = selected ? '#fff' : exploreColors.green;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selectedChip, pressed && exploreStyles.pressed]}>
      {category && (
        <StoreImage
          url={category.image}
          icon={categoryIcon(category)}
          size={15}
          color={color}
          background="transparent"
          style={styles.chipIcon}
        />
      )}
      <Text style={[exploreStyles.semibold, styles.chipLabel, selected && styles.selectedChipLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StoreCard({ store, category, width, cardWidth, onPress }) {
  const { t, i18n } = useTranslation();
  const title = localizedStoreText(store.title, store.title_v, i18n.language);
  const categoryName = localizedStoreText(category?.name, category?.v_name, i18n.language);
  const openStatus = getStoreOpenStatus(store);
  const openColor = openStatus?.isOpen ? exploreColors.open : exploreColors.closed;
  const todayHours = formatStoreHours(openStatus?.todayHours);
  const wide = width >= 640;

  return (
    <View style={[styles.card, cardWidth && { width: cardWidth }]}>
      <View style={[styles.cardImage, wide && styles.wideImage, width >= 1024 && styles.gridImage]}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onPress}
          style={({ pressed }) => [StyleSheet.absoluteFill, pressed && exploreStyles.pressed]}>
          <StoreImage
            url={store.image}
            icon={categoryIcon(category)}
            size={64}
            strokeWidth={1.3}
            background={category?.iconBackground}
            style={styles.photo}
          />
        </Pressable>
        <StoreBookmarkButton storeId={store._id} storeName={title} style={styles.cardBookmark} />
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityHint={t('View details for {{store}}', { store: title })}
        onPress={onPress}
        style={({ pressed }) => [styles.cardContent, wide && styles.wideCardContent, pressed && exploreStyles.pressed]}>
        <View style={styles.cardTitleRow}>
          <Text numberOfLines={1} style={[exploreStyles.bold, styles.cardTitle, wide && styles.wideCardTitle]}>
            {title}
          </Text>
          {categoryName && <Text style={[exploreStyles.semibold, styles.categoryPill]}>{categoryName}</Text>}
        </View>
        <StoreSpecialty store={store} style={styles.cardSpecialty} />

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Star size={15} color={exploreColors.amber} fill={exploreColors.amber} />
            <Text style={[exploreStyles.semibold, styles.rating]}>{Number(store.averageRating || 0).toFixed(1)}</Text>
            <Text style={[exploreStyles.text, styles.metricText]}>({store.reviewCount || 0})</Text>
          </View>
          <View style={styles.metric}>
            <Eye size={15} color={exploreColors.muted} />
            <Text style={[exploreStyles.semibold, styles.metricText]}>{store.viewCount || 0} {t('views')}</Text>
          </View>
          <View style={styles.metric}>
            <MessageCircle size={15} color={exploreColors.muted} />
            <Text style={[exploreStyles.semibold, styles.metricText]}>{store.commentCount || 0}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {store.address ? (
            <View style={styles.addressRow}>
              <MapPin size={15} color={exploreColors.muted} />
              <Text numberOfLines={2} style={[exploreStyles.text, styles.detailText]}>{store.address}</Text>
            </View>
          ) : null}
          {store.phone ? (
            <View style={styles.detailRow}>
              <Phone size={14} color={exploreColors.muted} />
              <Text style={[exploreStyles.text, styles.detailText]}>{store.phone}</Text>
            </View>
          ) : null}
          {openStatus && (
            <View style={styles.hoursRow}>
              <Clock size={14} color={openColor} />
              <Text style={[exploreStyles.semibold, styles.metricText, { color: openColor }]}>
                {openStatus.isOpen ? t('Open') : t('Closed')}
              </Text>
              {todayHours ? <Text style={[exploreStyles.text, styles.metricText]}>{todayHours}</Text> : null}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

export default function ExploreHouston({ navigation }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  const { bookmarks, loadBookmarks } = useStoreBookmarks();
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loadState, setLoadState] = useState('loading');
  const requestNumber = useRef(0);

  const loadDirectory = useCallback(async () => {
    const currentRequest = ++requestNumber.current;
    try {
      const visible = await isExploreHoustonVisible();
      if (currentRequest !== requestNumber.current) return;
      if (!visible) {
        setLoadState('hidden');
        return;
      }

      GetApi('getStoreCategories').then(readStoreResponse).then(data => {
        if (currentRequest === requestNumber.current && Array.isArray(data)) {
          setCategories([...data].sort((first, second) => (first.name || '').localeCompare(second.name || '')));
        }
      }).catch(() => {
        // A category request failure should still allow browsing and search.
      });

      const data = readStoreResponse(await GetApi('getStore'));
      if (currentRequest === requestNumber.current) {
        setStores(Array.isArray(data) ? data : []);
        setLoadState('ready');
        loadBookmarks();
      }
    } catch (error) {
      if (currentRequest === requestNumber.current) {
        setLoadState(error?.message === 'Store module not found.' ? 'hidden' : 'error');
      }
    }
  }, [loadBookmarks]);

  useFocusEffect(useCallback(() => {
    loadDirectory();
    return () => { requestNumber.current += 1; };
  }, [loadDirectory]));

  const categoriesById = useMemo(() => new Map(categories.map(category => [category._id, category])), [categories]);
  const visibleStores = useMemo(() => showBookmarks
    ? stores.filter(store => bookmarks?.has(store._id))
    : stores, [bookmarks, showBookmarks, stores]);
  const matches = useMemo(() => filterStores(visibleStores, categoriesById, categoryId, search), [visibleStores, categoriesById, categoryId, search]);
  const hasFilters = Boolean(categoryId || search.trim());
  const emptyBookmarks = showBookmarks && visibleStores.length === 0;

  const clearFilters = () => {
    setCategoryId('');
    setSearch('');
  };

  const toggleBookmarksView = () => {
    clearFilters();
    setShowBookmarks(current => !current);
  };

  usePreventRemove(focused && loadState !== 'hidden' && (hasFilters || showBookmarks), () => {
    if (hasFilters) clearFilters();
    else setShowBookmarks(false);
  });

  const wide = width >= 768;
  const categoryColumns = width >= 1024 ? 6 : wide ? 4 : width >= 340 ? 3 : 2;
  const storeColumns = width >= 1024 ? 2 : 1;
  const tileGap = wide ? 12 : 4;
  const contentWidth = Math.min(width, 1360) - (wide ? 80 : 32);
  const tileWidth = Math.floor((contentWidth - tileGap * (categoryColumns - 1)) / categoryColumns);
  const cardWidth = storeColumns > 1 ? Math.floor((contentWidth - 12) / storeColumns) : undefined;
  const onRetry = () => {
    setLoadState('loading');
    loadDirectory();
  };

  return (
    <>
      <DriverHeader item={t('Explore Houston')} showback />
      <FlatList
        key={storeColumns}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, wide && styles.wideContent]}
        data={loadState === 'ready' ? matches : []}
        keyExtractor={store => store._id}
        numColumns={storeColumns}
        columnWrapperStyle={storeColumns > 1 ? styles.cardGrid : undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={(
          <>
            <ExploreHoustonBanner />
            {loadState !== 'hidden' && (
              <>
                <View style={styles.searchRow}>
                  <View style={styles.search}>
                    <Search size={19} color={exploreColors.heading} />
                    <TextInput
                      accessibilityLabel={t('Search stores')}
                      placeholder={t('Search stores')}
                      placeholderTextColor={exploreColors.muted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="search"
                      value={search}
                      onChangeText={setSearch}
                      style={[exploreStyles.text, styles.searchInput]}
                    />
                    {search ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={t('Clear search')} hitSlop={8} onPress={() => setSearch('')}>
                        <X size={18} color={exploreColors.muted} />
                      </Pressable>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="togglebutton"
                    accessibilityState={{ checked: showBookmarks, disabled: !bookmarks }}
                    disabled={!bookmarks}
                    onPress={toggleBookmarksView}
                    style={({ pressed }) => [styles.bookmarksToggle, showBookmarks && styles.activeBookmarks,
                      (pressed || !bookmarks) && exploreStyles.pressed]}>
                    <Bookmark size={17} color={showBookmarks ? '#fff' : exploreColors.green} fill={showBookmarks ? '#fff' : 'none'} />
                    <Text style={[exploreStyles.semibold, styles.bookmarksLabel, showBookmarks && styles.activeBookmarksLabel]}>
                      {t('Bookmarks')}
                    </Text>
                  </Pressable>
                </View>
                <StoreBookmarksError />
                <ScrollView
                  style={showBookmarks && styles.hidden}
                  horizontal
                  keyboardShouldPersistTaps="handled"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}>
                  <CategoryChip label={t('All')} selected={!categoryId} onPress={() => setCategoryId('')} />
                  {categories.map(category => (
                    <CategoryChip
                      key={category._id}
                      category={category}
                      label={localizedStoreText(category.name, category.v_name, i18n.language)}
                      selected={categoryId === category._id}
                      onPress={() => setCategoryId(category._id)}
                    />
                  ))}
                </ScrollView>
                {!showBookmarks && !categoryId && categories.length > 0 && (
                  <View style={[styles.categoryGrid, { gap: tileGap }]}>
                    {categories.map((category, index) => {
                      const [background, color] = categoryTones[index % categoryTones.length];
                      return (
                        <Pressable
                          key={category._id}
                          accessibilityRole="button"
                          onPress={() => setCategoryId(category._id)}
                          style={({ pressed }) => [styles.categoryTile, wide && styles.wideTile, { width: tileWidth }, pressed && styles.pressedTile]}>
                          <StoreImage
                            url={category.image}
                            icon={categoryIcon(category)}
                            size={wide ? 20 : 16}
                            color={category.iconBackground ? exploreColors.green : color}
                            background={category.iconBackground || background}
                            style={[styles.tileIcon, wide && styles.wideTileIcon]}
                          />
                          <Text
                            android_hyphenationFrequency="normal"
                            style={[exploreStyles.text, styles.tileLabel, wide && styles.wideTileLabel]}>
                            {localizedStoreText(category.name, category.v_name, i18n.language)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            category={resolveStoreCategory(item, categoriesById)}
            width={width}
            cardWidth={cardWidth}
            onPress={() => navigation.navigate('ExploreHoustonStore', { storeId: item._id })}
          />
        )}
        ListEmptyComponent={loadState === 'loading' ? <StoreNotice loading /> : (
          <StoreNotice
            title={t(loadState === 'ready' && emptyBookmarks ? 'No bookmarked stores yet' : directoryMessages[loadState])}
            description={loadState === 'ready'
              ? t(emptyBookmarks ? 'Bookmark stores to find them here.' : 'Try a different search or category')
              : undefined}
            onRetry={loadState === 'error' ? onRetry : undefined}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1360, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  wideContent: { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 48 },
  searchRow: { ...exploreStyles.row, gap: 8, marginTop: 16, marginBottom: 12 },
  search: {
    ...exploreStyles.row,
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: exploreColors.green,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 14, color: exploreColors.muted },
  bookmarksToggle: {
    ...exploreStyles.row,
    justifyContent: 'center',
    gap: 5,
    minHeight: 48,
    maxWidth: '46%',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: exploreColors.green,
    backgroundColor: '#fff',
  },
  activeBookmarks: { backgroundColor: exploreColors.green },
  bookmarksLabel: { color: exploreColors.green, fontSize: 12, flexShrink: 1 },
  activeBookmarksLabel: { color: '#fff' },
  hidden: { display: 'none' },
  chipRow: { gap: 8, paddingTop: 4, paddingBottom: 8, marginBottom: 8 },
  chip: {
    ...exploreStyles.row,
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: exploreColors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedChip: { backgroundColor: exploreColors.green, borderColor: exploreColors.green },
  chipIcon: { width: 16, height: 16, borderRadius: 8 },
  chipLabel: { fontSize: 12, lineHeight: 16, color: exploreColors.body },
  selectedChipLabel: { color: '#fff' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#fff8ed',
  },
  categoryTile: {
    ...exploreStyles.row,
    ...exploreStyles.shadow,
    gap: 5,
    minHeight: 36,
    paddingStart: 6,
    paddingEnd: 4,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ece6dc',
    backgroundColor: '#fff',
  },
  pressedTile: { backgroundColor: '#efeee8' },
  wideTile: { gap: 12, padding: 12 },
  tileIcon: { width: 28, height: 28, borderRadius: 14 },
  wideTileIcon: { width: 44, height: 44, borderRadius: 22 },
  tileLabel: { flex: 1, color: exploreColors.text, fontSize: 10, lineHeight: 13 },
  wideTileLabel: { fontSize: 14, lineHeight: 18 },
  cardGrid: { gap: 12 },
  card: {
    ...exploreStyles.shadow,
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: exploreColors.lightBorder,
    backgroundColor: '#fff',
    padding: 4,
  },
  cardImage: { minHeight: 150, width: '46%', minWidth: 140, borderRadius: 12, alignSelf: 'stretch' },
  photo: { flex: 1, borderRadius: 12 },
  cardBookmark: { position: 'absolute', top: 6, right: 6 },
  wideImage: { width: 340, minHeight: 190 },
  gridImage: { width: 250 },
  cardContent: { flex: 1, minWidth: 0, paddingHorizontal: 12, paddingVertical: 8 },
  wideCardContent: { paddingHorizontal: 20 },
  cardTitleRow: { ...exploreStyles.row, flexWrap: 'wrap', columnGap: 8, rowGap: 4 },
  cardTitle: { maxWidth: '100%', fontSize: 16, lineHeight: 24, color: exploreColors.text },
  wideCardTitle: { fontSize: 20, lineHeight: 28 },
  categoryPill: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 11,
    color: '#c87831',
    backgroundColor: '#fff3e8',
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardSpecialty: { marginTop: 6 },
  metrics: { ...exploreStyles.row, flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 6 },
  metric: { ...exploreStyles.row, gap: 4 },
  metricText: { color: exploreColors.muted, fontSize: 12, lineHeight: 16 },
  rating: { color: exploreColors.amber, fontSize: 12, lineHeight: 16 },
  cardDetails: { marginTop: 8, gap: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailRow: { ...exploreStyles.row, gap: 8 },
  detailText: { flex: 1, fontSize: 12, lineHeight: 16 },
  hoursRow: { ...exploreStyles.row, flexWrap: 'wrap', gap: 4 },
});
