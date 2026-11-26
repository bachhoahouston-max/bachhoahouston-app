import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import {
  getStorePhotos,
  localizedStoreText,
} from '../../app/exploreHouston/storeDirectory';
import {
  Button,
  Field,
  LoadState,
  StoreHeader,
  Toggle,
  styles,
} from './StoreControls';
import {
  DAYS,
  DAY_ORDER,
  MAX_PHOTOS,
  categoryId,
  pickStoreImages,
  uploadStoreImage,
  useStoreAction,
  useStoreData,
  write,
} from './storeAdmin';

const FIELDS = [
  ['title', 'Store name (English)', { required: true }],
  ['title_v', 'Store name (Vietnamese)', { required: true }],
  [
    'shortDescription',
    'Description (English)',
    { required: true, multiline: true },
  ],
  [
    'shortDescription_v',
    'Description (Vietnamese)',
    { required: true, multiline: true },
  ],
  ['specialty', 'Specialty (English)', {}],
  ['specialty_v', 'Specialty (Vietnamese)', {}],
  ['phone', 'Phone number', { required: true, keyboardType: 'phone-pad' }],
  ['address', 'Address', { required: true }],
  [
    'website',
    'Website',
    { keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false },
  ],
];

function initialHours(entries = []) {
  return DAY_ORDER.map(
    day =>
      entries?.find(entry => entry.day === day) || {
        day,
        isClosed: false,
        open: '09:00',
        close: '21:00',
      },
  );
}

function StoreEditor({ store, navigation, title }) {
  const { t, i18n } = useTranslation();
  const categories = useStoreData('getStoreCategories');
  const { busy, run } = useStoreAction();
  const [fields, setFields] = useState(() =>
    Object.fromEntries(FIELDS.map(([key]) => [key, String(store[key] ?? '')])),
  );
  const [category, setCategory] = useState(() => categoryId(store));
  const [visible, setVisible] = useState(store.isVisible !== false);
  const [personal, setPersonal] = useState(store.isPersonal === true);
  const [images, setImages] = useState(() => getStorePhotos(store));
  const [hoursEnabled, setHoursEnabled] = useState(
    !!store.openingHours?.length,
  );
  const [hours, setHours] = useState(() => initialHours(store.openingHours));
  const [timeField, setTimeField] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const options = (categories.data || []).map(item => ({
    value: item._id,
    label: localizedStoreText(item.name, item.v_name, i18n.language),
  }));

  function updateHours(day, changes) {
    setHours(current =>
      current.map(entry =>
        entry.day === day ? { ...entry, ...changes } : entry,
      ),
    );
  }

  function copyMonday() {
    const { open, close, isClosed } = hours[0];
    setHours(current =>
      current.map(entry => ({ ...entry, open, close, isClosed })),
    );
  }

  function selectTime(day, key, value) {
    const [hour, minute] = (value || '09:00').split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    setTimeField({ day, key, date });
  }

  function addPhotos() {
    run(async () => {
      const remaining = MAX_PHOTOS - images.length;
      const assets = await pickStoreImages(remaining);
      if (!assets.length) return;
      setUploading(true);
      let failures = 0;
      try {
        for (const asset of assets.slice(0, remaining)) {
          try {
            const url = await uploadStoreImage(asset);
            setImages(current => [...current, url]);
          } catch {
            failures += 1;
          }
        }
        if (failures)
          Alert.alert(t('Store'), t('Some photos could not be uploaded.'));
      } finally {
        setUploading(false);
      }
    }, 'Upload failed');
  }

  function save() {
    const details = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, value.trim()]),
    );
    const invalidHours =
      hoursEnabled &&
      hours.find(
        entry =>
          !entry.isClosed &&
          (![entry.open, entry.close].every(time =>
            /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time),
          ) ||
            entry.open === entry.close),
      );

    if (
      FIELDS.some(([key, , config]) => config.required && !details[key]) ||
      !options.some(item => item.value === category)
    ) {
      setError(t('Complete the required store fields and select a category.'));
      return;
    }
    if (!/^1?\d{10}$/.test(details.phone.replace(/\D/g, ''))) {
      setError(t('Enter a valid 10-digit phone number.'));
      return;
    }
    if (!images.length) {
      setError(t('Add at least one store photo.'));
      return;
    }
    if (invalidHours) {
      setError(
        t('Set different opening and closing times for {{day}}.', {
          day: t(DAYS[invalidHours.day]),
        }),
      );
      return;
    }

    setError('');
    run(async () => {
      const [image, ...additionalImages] = images;
      const payload = {
        ...details,
        category,
        image,
        additionalImages,
        openingHours: hoursEnabled ? hours : [],
      };
      if (store._id) payload.id = store._id;
      if (!store._id || visible !== (store.isVisible !== false))
        payload.isVisible = visible;
      if (!store._id || personal !== (store.isPersonal === true))
        payload.isPersonal = personal;
      await write(store._id ? 'updateStore' : 'createStore', payload);
      Toast.show({ type: 'success', text1: t('Store saved.') });
      if (navigation.isFocused()) navigation.goBack();
    }, 'Unable to save store.');
  }

  return (
    <View style={styles.screen}>
      <StoreHeader
        title={title}
        backLabel={t('Back')}
        onBack={navigation.goBack}
        disabled={busy}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>{t('Store information')}</Text>
          {FIELDS.map(([key, label, { required, ...config }]) => (
            <Field
              key={key}
              label={required ? t(label) + ' *' : t(label)}
              value={fields[key]}
              editable={!busy}
              onChangeText={value =>
                setFields(current => ({ ...current, [key]: value }))
              }
              {...config}
            />
          ))}
          <Text style={styles.label}>{t('Category')} *</Text>
          <Dropdown
            accessibilityLabel={t('Category')}
            style={styles.input}
            placeholderStyle={styles.muted}
            selectedTextStyle={styles.body}
            data={options}
            value={category}
            labelField="label"
            valueField="value"
            placeholder={t('Select a store category')}
            disable={busy || !options.length}
            onChange={item => setCategory(item.value)}
          />
          <LoadState
            loading={categories.loading}
            error={categories.error}
            message={
              categories.error
                ? t('Unable to load store categories.')
                : undefined
            }
            retry={t('Retry')}
            onRetry={categories.reload}
          />
          <Button
            label={t('Create store category')}
            disabled={busy}
            onPress={() => navigation.navigate('ManageStoreCategories')}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>{t('Store photos')} *</Text>
          <View style={[styles.row, styles.wrap]}>
            {images.map((url, index) => (
              <View key={index} style={styles.field}>
                <Image source={{ uri: url }} style={styles.photo} />
                <Text style={styles.muted}>
                  {index === 0
                    ? t('Cover photo')
                    : t('Photo {{count}}', { count: index + 1 })}
                </Text>
                <Button
                  danger
                  disabled={busy}
                  label={t('Remove')}
                  onPress={() =>
                    setImages(current =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                />
              </View>
            ))}
          </View>
          <Button
            label={uploading ? t('Uploading...') : t('Add photos')}
            onPress={addPhotos}
            disabled={busy || images.length >= MAX_PHOTOS}
          />
          <Text style={styles.muted}>
            {t('{{current}} of {{max}} photos', {
              current: images.length,
              max: MAX_PHOTOS,
            })}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>{t('Visibility')}</Text>
          <Toggle
            label={t('Show store in directory')}
            value={visible}
            onChange={setVisible}
            disabled={busy}
          />
          <Toggle
            label={t('Mark as personal')}
            value={personal}
            onChange={setPersonal}
            disabled={busy}
          />
        </View>
        <View style={styles.card}>
          <Toggle
            label={t('Opening hours')}
            value={hoursEnabled}
            onChange={setHoursEnabled}
            disabled={busy}
          />
          {hoursEnabled && (
            <>
              <Button
                label={t('Copy Monday to all days')}
                onPress={copyMonday}
                disabled={busy}
              />
              {hours.map(entry => (
                <View key={entry.day} style={styles.divider}>
                  <Text style={styles.label}>{t(DAYS[entry.day])}</Text>
                  <Toggle
                    label={t('Closed')}
                    value={entry.isClosed}
                    disabled={busy}
                    onChange={isClosed => updateHours(entry.day, { isClosed })}
                  />
                  {!entry.isClosed && (
                    <View style={styles.row}>
                      <Button
                        style={styles.fill}
                        label={t('Opens at {{time}}', { time: entry.open })}
                        disabled={busy}
                        onPress={() =>
                          selectTime(entry.day, 'open', entry.open)
                        }
                      />
                      <Button
                        style={styles.fill}
                        label={t('Closes at {{time}}', { time: entry.close })}
                        disabled={busy}
                        onPress={() =>
                          selectTime(entry.day, 'close', entry.close)
                        }
                      />
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.body, styles.dangerText]}
          >
            {error}
          </Text>
        )}
        <Button
          primary
          label={busy && !uploading ? t('Working...') : t('Save store')}
          disabled={busy || categories.loading || categories.error}
          onPress={save}
        />
      </ScrollView>
      <DateTimePickerModal
        isVisible={!!timeField}
        date={timeField?.date}
        mode="time"
        is24Hour
        onCancel={() => setTimeField(null)}
        onConfirm={date => {
          if (!timeField) return;
          const value = [date.getHours(), date.getMinutes()]
            .map(part => String(part).padStart(2, '0'))
            .join(':');
          updateHours(timeField.day, { [timeField.key]: value });
          setTimeField(null);
        }}
      />
    </View>
  );
}

export default function StoreForm({ navigation, route }) {
  const { t } = useTranslation();
  const id = route.params?.id;
  const { data, loading, error, reload } = useStoreData(
    id ? 'getStoreById/' + id : null,
  );
  const title = t(id ? 'Edit store' : 'Create store');
  if (!id || data)
    return (
      <StoreEditor
        key={id || 'new'}
        store={data || {}}
        navigation={navigation}
        title={title}
      />
    );
  return (
    <View style={styles.screen}>
      <StoreHeader
        title={title}
        backLabel={t('Back')}
        onBack={navigation.goBack}
      />
      <LoadState
        loading={loading}
        error={error}
        message={error ? t('Unable to load store.') : undefined}
        retry={t('Retry')}
        onRetry={reload}
      />
    </View>
  );
}
