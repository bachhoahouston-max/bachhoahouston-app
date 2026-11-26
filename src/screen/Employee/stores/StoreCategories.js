import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Icons from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Field,
  LoadState,
  StoreHeader,
  StoreIcon,
  green,
  styles,
} from './StoreControls';
import {
  confirmDelete,
  pickStoreImages,
  remove,
  uploadStoreImage,
  useStoreAction,
  useStoreData,
  write,
} from './storeAdmin';

const ICONS = [
  'Store',
  'ShoppingBag',
  'Egg',
  'UtensilsCrossed',
  'Coffee',
  'Cookie',
  'Hospital',
  'Pill',
  'Shirt',
  'Milk',
  'Pizza',
  'Fish',
  'IceCreamBowl',
  'Flower2',
  'CakeSlice',
  'PawPrint',
  'Wheat',
  'Utensils',
  'Wine',
  'ShoppingBasket',
];
const BACKGROUNDS = [
  ['Mint', '#edf6ef'],
  ['Sky', '#eaf4ff'],
  ['Lavender', '#f2edff'],
  ['Peach', '#fff1e8'],
  ['Yellow', '#fff9db'],
  ['Rose', '#fff0f3'],
  ['Gray', '#f3f4f6'],
];
const empty = {
  name: '',
  v_name: '',
  icon: '',
  image: '',
  iconBackground: BACKGROUNDS[0][1],
};

export default function StoreCategories({ navigation }) {
  const { t } = useTranslation();
  const categories = useStoreData('getStoreCategories');
  const { busy, run } = useStoreAction();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const scroll = useRef(null);

  const update = (key, value) =>
    setForm(current => ({ ...current, [key]: value }));

  function reset() {
    setEditing(null);
    setForm(empty);
    setError('');
  }

  function edit(category) {
    setEditing(category._id);
    setError('');
    setForm({
      name: category.name || '',
      v_name: category.v_name || '',
      icon: category.iconType === 'upload' ? '' : category.icon || '',
      image: category.iconType === 'lucide' ? '' : category.image || '',
      iconBackground: category.iconBackground || empty.iconBackground,
    });
    scroll.current?.scrollTo({ y: 0 });
  }

  function upload() {
    run(async () => {
      const [asset] = await pickStoreImages(1);
      if (!asset) return;
      const image = await uploadStoreImage(asset);
      setForm(current => ({ ...current, image, icon: '' }));
    }, 'Upload failed');
  }

  function save() {
    if (!form.name.trim() || !form.v_name.trim()) {
      setError(t('Enter the category name in both languages.'));
      return;
    }
    if (!form.icon && !form.image) {
      setError(t('Select a category icon or upload an image.'));
      return;
    }
    setError('');
    run(async () => {
      const payload = {
        ...form,
        name: form.name.trim(),
        v_name: form.v_name.trim(),
        iconType: form.icon ? 'lucide' : 'upload',
      };
      if (editing) payload.id = editing;
      await write(
        editing ? 'updateStoreCategory' : 'createStoreCategory',
        payload,
      );
      Toast.show({ type: 'success', text1: t('Store category saved.') });
      reset();
      categories.reload();
    }, 'Unable to save store category.');
  }

  function deleteCategory(category) {
    confirmDelete(
      t,
      t('Delete the store category {{name}}?', { name: category.name }),
      () =>
        run(async () => {
          await remove('deleteStoreCategory/' + category._id);
          if (editing === category._id) reset();
          categories.reload();
        }, 'Unable to delete store category.'),
    );
  }

  return (
    <View style={styles.screen}>
      <StoreHeader
        title={t('Store categories')}
        backLabel={t('Back')}
        onBack={navigation.goBack}
        disabled={busy}
      />
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {t(editing ? 'Edit store category' : 'Create store category')}
          </Text>
          <Field
            label={t('Category name (English)')}
            editable={!busy}
            value={form.name}
            onChangeText={value => update('name', value)}
          />
          <Field
            label={t('Category name (Vietnamese)')}
            editable={!busy}
            value={form.v_name}
            onChangeText={value => update('v_name', value)}
          />
          <Text style={styles.label}>{t('Category icon')}</Text>
          <View style={[styles.row, styles.wrap]}>
            {ICONS.map(name => {
              const Icon = Icons[name] || Icons.Store;
              const selected = name === form.icon;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={t(name)}
                  accessibilityState={{ selected }}
                  disabled={busy}
                  onPress={() =>
                    setForm(current => ({ ...current, icon: name, image: '' }))
                  }
                  style={[
                    categoryStyles.choice,
                    selected && categoryStyles.selected,
                  ]}
                >
                  <Icon color={green} size={22} />
                </Pressable>
              );
            })}
          </View>
          <Button label={t('Upload icon')} onPress={upload} disabled={busy} />
          <Text style={styles.label}>{t('Icon background')}</Text>
          <View style={[styles.row, styles.wrap]}>
            {BACKGROUNDS.map(([label, value]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t(label)}
                accessibilityState={{ selected: form.iconBackground === value }}
                disabled={busy}
                onPress={() => update('iconBackground', value)}
                style={[
                  categoryStyles.choice,
                  { backgroundColor: value },
                  form.iconBackground === value && categoryStyles.selected,
                ]}
              />
            ))}
          </View>
          {!!(form.image || form.icon) && (
            <View style={styles.row}>
              <Text style={styles.label}>{t('Preview')}</Text>
              <StoreIcon
                image={form.image}
                Icon={Icons[form.icon]}
                background={form.iconBackground}
              />
            </View>
          )}
          {!!error && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.body, styles.dangerText]}
            >
              {error}
            </Text>
          )}
          <View style={styles.row}>
            {!!editing && (
              <Button
                label={t('Cancel_review')}
                onPress={reset}
                disabled={busy}
              />
            )}
            <Button
              primary
              style={styles.fill}
              label={t(
                busy
                  ? 'Working...'
                  : editing
                  ? 'Save category'
                  : 'Create store category',
              )}
              onPress={save}
              disabled={busy}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('Created store categories')}
          </Text>
          <LoadState
            loading={categories.loading}
            error={categories.error}
            message={
              categories.error
                ? t('Unable to load store categories.')
                : !categories.loading && !categories.data?.length
                ? t('No store categories yet.')
                : undefined
            }
            retry={t('Retry')}
            onRetry={categories.reload}
          />
          {(categories.data || []).map(category => (
            <View key={category._id} style={[styles.field, styles.divider]}>
              <View style={styles.row}>
                <StoreIcon
                  Icon={Icons[category.icon]}
                  image={category.iconType === 'lucide' ? '' : category.image}
                  background={category.iconBackground}
                />
                <View style={styles.fill}>
                  <Text style={styles.label}>{category.name}</Text>
                  <Text style={styles.muted}>{category.v_name}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Button
                  style={styles.fill}
                  label={t('Edit')}
                  onPress={() => edit(category)}
                  disabled={busy}
                />
                <Button
                  danger
                  style={styles.fill}
                  label={t('Delete')}
                  onPress={() => deleteCategory(category)}
                  disabled={busy || categories.loading || categories.error}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const categoryStyles = StyleSheet.create({
  choice: {
    width: 44,
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#D3DFD4',
    borderWidth: 1,
  },
  selected: { borderColor: green, borderWidth: 2, backgroundColor: '#edf6ef' },
});
