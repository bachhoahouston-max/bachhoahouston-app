import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Dropdown } from 'react-native-element-dropdown';
import { MapPin, Phone, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import EmployeeHeader from '../../../Assets/Component/EmployeeHeader';
import { localizedStoreText } from '../../app/exploreHouston/storeDirectory';
import {
  Button,
  LoadState,
  StoreIcon,
  Toggle,
  green,
  styles,
} from './StoreControls';
import { categoryId, useStoreAction, useStoreData, write } from './storeAdmin';

const MODULE_PLATFORMS = [
  ['isVisibleOnWeb', 'Show Store on website'],
  ['isVisibleOnMobile', 'Show Store in app'],
];

export default function Stores({ navigation }) {
  const { t, i18n } = useTranslation();
  const bottom = useBottomTabBarHeight();
  const stores = useStoreData('getStore');
  const settings = useStoreData('storeModuleVisibility');
  const { busy, run } = useStoreAction();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [personal, setPersonal] = useState(false);

  const local = (en, vi) => localizedStoreText(en, vi, i18n.language);
  const records = Array.isArray(stores.data) ? stores.data : [];
  const categoryChoices = new Map();
  for (const store of records) {
    categoryChoices.set(
      categoryId(store) || 'uncategorized',
      local(store.category?.name, store.category?.v_name) || t('Uncategorized'),
    );
  }
  const categoryOptions = [
    { label: t('All categories'), value: '' },
    ...Array.from(categoryChoices, ([value, label]) => ({ label, value })),
  ];
  const query = search.trim().toLowerCase();
  const filtered = records.filter(store => {
    const status = store.isVisible === false ? 'hidden' : 'visible';
    return (
      (!category || (categoryId(store) || 'uncategorized') === category) &&
      (!visibility || visibility === status) &&
      (!personal || store.isPersonal === true) &&
      (!query ||
        [store.title, store.title_v, store.address, store.phone].some(value =>
          String(value ?? '')
            .toLowerCase()
            .includes(query),
        ))
    );
  });

  function updateVisibility(key, value) {
    run(async () => {
      await write('storeModuleVisibility', { [key]: value });
      settings.reload();
    }, 'Unable to update store visibility.');
  }

  function refresh() {
    stores.reload();
    settings.reload();
  }

  const filterDropdown = (label, data, value, onChange) => (
    <Dropdown
      accessibilityLabel={label}
      style={styles.input}
      selectedTextStyle={styles.body}
      data={data}
      value={value}
      labelField="label"
      valueField="value"
      onChange={option => onChange(option.value)}
    />
  );

  return (
    <View style={styles.screen}>
      <EmployeeHeader item={t('Store')} />
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={stores.loading && !!stores.data}
            onRefresh={refresh}
            tintColor={green}
            colors={[green]}
          />
        }
        ListHeaderComponent={
          <View style={styles.field}>
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('Stores')}
              </Text>
              <View style={styles.row}>
                <Button
                  primary
                  style={styles.fill}
                  label={t('Create store')}
                  onPress={() => navigation.navigate('ManageStoreForm')}
                />
                <Button
                  style={styles.fill}
                  label={t('Store categories')}
                  onPress={() => navigation.navigate('ManageStoreCategories')}
                />
              </View>
              <View style={styles.row}>
                <Search color={green} size={19} />
                <TextInput
                  style={[styles.input, styles.fill]}
                  accessibilityLabel={t('Search stores')}
                  placeholder={t('Search stores')}
                  placeholderTextColor="#65776A"
                  autoCorrect={false}
                  value={search}
                  onChangeText={setSearch}
                />
                <Button
                  label={t('Filters')}
                  selected={showFilters}
                  onPress={() => setShowFilters(!showFilters)}
                />
              </View>
              {showFilters && (
                <View style={styles.field}>
                  {filterDropdown(
                    t('Category'),
                    categoryOptions,
                    category,
                    setCategory,
                  )}
                  {filterDropdown(
                    t('Visibility'),
                    [
                      { label: t('All visibility states'), value: '' },
                      { label: t('Visible'), value: 'visible' },
                      { label: t('Hidden'), value: 'hidden' },
                    ],
                    visibility,
                    setVisibility,
                  )}
                  <Toggle
                    label={t('Personal stores only')}
                    value={personal}
                    onChange={setPersonal}
                  />
                  <Button
                    label={t('Clear filters')}
                    onPress={() => {
                      setSearch('');
                      setCategory('');
                      setVisibility('');
                      setPersonal(false);
                    }}
                  />
                </View>
              )}
              <View style={styles.divider}>
                <LoadState
                  loading={settings.loading}
                  error={settings.error}
                  message={
                    settings.error
                      ? t('Unable to load store settings.')
                      : undefined
                  }
                  retry={t('Retry')}
                  onRetry={settings.reload}
                />
                {MODULE_PLATFORMS.map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={t(label)}
                    value={settings.data?.[key] === true}
                    disabled={
                      busy ||
                      settings.loading ||
                      settings.error ||
                      typeof settings.data?.[key] !== 'boolean'
                    }
                    onChange={value => updateVisibility(key, value)}
                  />
                ))}
              </View>
            </View>
            {stores.error && (
              <LoadState
                error
                message={t('Unable to load stores.')}
                retry={t('Retry')}
                onRetry={stores.reload}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !stores.error && (
            <LoadState
              loading={stores.loading}
              message={stores.loading ? undefined : t('No stores found.')}
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <StoreIcon image={item.image} />
              <View style={styles.fill}>
                <Text style={styles.title}>
                  {local(item.title, item.title_v)}
                </Text>
                <Text style={styles.muted}>
                  {local(item.category?.name, item.category?.v_name) ||
                    t('Uncategorized')}
                </Text>
              </View>
            </View>
            {!!(item.shortDescription || item.shortDescription_v) && (
              <Text numberOfLines={2} style={styles.body}>
                {local(item.shortDescription, item.shortDescription_v)}
              </Text>
            )}
            <View style={[styles.row, styles.wrap]}>
              <Text style={[styles.muted, styles.badge]}>
                {t(item.isVisible === false ? 'Hidden' : 'Visible')}
              </Text>
              {item.isPersonal === true && (
                <Text style={[styles.muted, styles.badge]}>
                  {t('Personal')}
                </Text>
              )}
            </View>
            {!!item.address && (
              <View style={styles.row}>
                <MapPin color={green} size={15} />
                <Text style={[styles.body, styles.fill]}>{item.address}</Text>
              </View>
            )}
            {!!item.phone && (
              <View style={styles.row}>
                <Phone color={green} size={15} />
                <Text style={styles.body}>{item.phone}</Text>
              </View>
            )}
            <View style={[styles.row, styles.wrap]}>
              <Text style={[styles.muted, styles.badge]}>
                {t('Views: {{count}}', { count: item.viewCount || 0 })}
              </Text>
              <Text style={[styles.muted, styles.badge]}>
                {t('Comments: {{count}}', { count: item.commentCount || 0 })}
              </Text>
              <Text style={[styles.muted, styles.badge]}>
                {t('Bookmarks: {{count}}', { count: item.bookmarkCount || 0 })}
              </Text>
            </View>
            <View style={styles.row}>
              <Button
                primary
                style={styles.fill}
                label={t('View Details')}
                onPress={() =>
                  navigation.navigate('ManageStoreDetails', { id: item._id })
                }
              />
              <Button
                style={styles.fill}
                label={t('Edit store')}
                onPress={() =>
                  navigation.navigate('ManageStoreForm', { id: item._id })
                }
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}
