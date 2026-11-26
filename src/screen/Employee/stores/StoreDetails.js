import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import {
  formatCommentTimestamp,
  formatStoreHours,
  getStorePhotos,
  localizedStoreText,
} from '../../app/exploreHouston/storeDirectory';
import {
  Button,
  LoadState,
  StoreHeader,
  Toggle,
  styles,
} from './StoreControls';
import {
  DAYS,
  DAY_ORDER,
  confirmDelete,
  remove,
  useStoreAction,
  useStoreData,
  write,
} from './storeAdmin';

function Community({
  title,
  collection,
  empty,
  t,
  language,
  review,
  onDelete,
  busy,
}) {
  const entries = collection.data || [];
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {title} ({entries.length})
      </Text>
      <LoadState
        loading={collection.loading}
        error={collection.error}
        message={
          collection.error
            ? t('Unable to load store activity.')
            : !collection.loading && !entries.length
            ? empty
            : undefined
        }
        retry={t('Retry')}
        onRetry={collection.reload}
      />
      {entries.map(item => (
        <View key={item._id} style={[styles.field, styles.divider]}>
          <View style={styles.row}>
            <Text style={[styles.label, styles.fill]}>
              {[item.posted_by?.username, item.posted_by?.lastname]
                .filter(Boolean)
                .join(' ') || t('Store visitor')}
            </Text>
            {review && <Text style={styles.label}>{item.rating}/5</Text>}
            {onDelete && (
              <Button
                label={t('Delete')}
                danger
                disabled={busy}
                onPress={() => onDelete(item._id)}
              />
            )}
          </View>
          <Text style={styles.muted}>
            {formatCommentTimestamp(item.createdAt, language)}
          </Text>
          {!!(review ? item.feedback : item.comment) && (
            <Text style={styles.body}>
              {review ? item.feedback : item.comment}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

export default function StoreDetails({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const { id } = route.params;
  const detail = useStoreData('getStoreById/' + id);
  const comments = useStoreData('getStoreComments/' + id);
  const reviews = useStoreData('getStoreReviews/' + id);
  const { busy, run } = useStoreAction();
  const store = detail.data;
  const local = (en, vi) => localizedStoreText(en, vi, i18n.language);

  function updateStore(path, payload) {
    run(async () => {
      await write(path + '/' + id, payload);
      detail.reload();
    }, 'Unable to update store.');
  }

  function deleteStore() {
    confirmDelete(t, t('Delete this store?'), () =>
      run(async () => {
        await remove('deleteStore/' + id);
        Toast.show({ type: 'success', text1: t('Store deleted.') });
        if (navigation.isFocused()) navigation.goBack();
      }, 'Unable to delete store.'),
    );
  }

  function deleteComment(commentId) {
    confirmDelete(t, t('Delete this comment?'), () =>
      run(async () => {
        await remove('deleteStoreComment/' + id + '/' + commentId);
        comments.reload();
      }, 'Unable to delete comment.'),
    );
  }

  const fields = store && [
    ['Store name (English)', store.title],
    ['Store name (Vietnamese)', store.title_v],
    ['Description (English)', store.shortDescription],
    ['Description (Vietnamese)', store.shortDescription_v],
    ['Specialty (English)', store.specialty],
    ['Specialty (Vietnamese)', store.specialty_v],
    ['Address', store.address],
    ['Phone number', store.phone],
    ['Website', store.website],
    [
      'Category name (English)',
      store.category?.name ||
        (typeof store.category === 'string' ? store.category : ''),
    ],
    ['Category name (Vietnamese)', store.category?.v_name],
    ['Created', formatCommentTimestamp(store.createdAt, i18n.language)],
  ];

  return (
    <View style={styles.screen}>
      <StoreHeader
        title={t('Store details')}
        backLabel={t('Back')}
        onBack={navigation.goBack}
        disabled={busy}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <LoadState
          loading={detail.loading}
          error={detail.error}
          message={detail.error ? t('Unable to load store.') : undefined}
          retry={t('Retry')}
          onRetry={detail.reload}
        />
        {!!store && (
          <>
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.title}>
                {local(store.title, store.title_v)}
              </Text>
              <View style={[styles.row, styles.wrap]}>
                <Text style={[styles.muted, styles.badge]}>
                  {t('Views: {{count}}', { count: store.viewCount || 0 })}
                </Text>
                <Text style={[styles.muted, styles.badge]}>
                  {t('Bookmarks: {{count}}', {
                    count: store.bookmarkCount || 0,
                  })}
                </Text>
                <Text style={[styles.muted, styles.badge]}>
                  {t('Rating: {{rating}}/5', {
                    rating: Number(store.averageRating || 0).toFixed(1),
                  })}
                </Text>
              </View>
              {!!getStorePhotos(store).length && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.row}
                >
                  {getStorePhotos(store).map((uri, index) => (
                    <Image
                      key={index}
                      source={{ uri }}
                      style={[styles.photo, photoSize]}
                    />
                  ))}
                </ScrollView>
              )}
              <View style={styles.row}>
                <Button
                  primary
                  style={styles.fill}
                  label={t('Edit store')}
                  disabled={busy || detail.error}
                  onPress={() => navigation.navigate('ManageStoreForm', { id })}
                />
                <Button
                  danger
                  label={t('Delete store')}
                  disabled={busy || detail.loading || detail.error}
                  onPress={deleteStore}
                />
              </View>
              <Toggle
                label={t('Show store in directory')}
                value={store.isVisible !== false}
                disabled={busy || detail.loading || detail.error}
                onChange={() => updateStore('toggleStoreVisibility')}
              />
              <Toggle
                label={t('Mark as personal')}
                value={store.isPersonal === true}
                disabled={busy || detail.loading || detail.error}
                onChange={value =>
                  updateStore('setStorePersonal', { isPersonal: value })
                }
              />
            </View>
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('Store information')}
              </Text>
              {fields
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <View style={styles.field} key={label}>
                    <Text style={styles.label}>{t(label)}</Text>
                    <Text selectable style={styles.body}>
                      {value}
                    </Text>
                  </View>
                ))}
            </View>
            {!!store.openingHours?.length && (
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.title}>
                  {t('Opening hours')}
                </Text>
                {DAY_ORDER.map(day => {
                  const entry = store.openingHours.find(
                    item => item.day === day,
                  );
                  if (!entry) return null;
                  return (
                    <View key={day} style={styles.row}>
                      <Text style={[styles.label, styles.fill]}>
                        {t(DAYS[day])}
                      </Text>
                      <Text style={styles.body}>
                        {formatStoreHours(entry) || t('Closed')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            <Community
              title={t('Live Chat')}
              collection={comments}
              empty={t('No store comments yet.')}
              t={t}
              language={i18n.language}
              onDelete={deleteComment}
              busy={busy}
            />
            <Community
              title={t('Store reviews')}
              collection={reviews}
              empty={t('No store reviews yet.')}
              t={t}
              language={i18n.language}
              review
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const photoSize = { width: 210, height: 140 };
