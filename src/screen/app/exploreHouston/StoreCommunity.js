import React, { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SendHorizontal, Star, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Delete, GetApi, Post } from '../../../Assets/Helpers/Service';
import { exploreColors, exploreStyles, StoreButton } from './components';
import { readStoreResponse } from './storeDirectory';

function useStoreActivity(endpoint) {
  const [entries, setEntries] = useState(null);
  const [failed, setFailed] = useState(false);
  const requestNumber = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestNumber.current;
    setFailed(false);
    try {
      const data = readStoreResponse(await GetApi(endpoint));
      if (currentRequest === requestNumber.current) {
        setEntries(Array.isArray(data) ? data : []);
      }
    } catch {
      if (currentRequest === requestNumber.current) {
        setFailed(true);
      }
    }
  }, [endpoint]);

  useFocusEffect(useCallback(() => {
    reload();
    return () => { requestNumber.current += 1; };
  }, [reload]));

  return { entries, failed, reload };
}

function authorName(entry, t) {
  const author = entry.posted_by;
  return [author?.username, author?.lastname].filter(Boolean).join(' ') || t('Customer');
}

function timeAgo(value, t, language) {
  if (!value) return '';
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return t('Just now');
  if (minutes < 60) return t('{{count}} min ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('{{count}} hr ago', { count: hours });
  const days = Math.floor(hours / 24);
  return days < 7 ? t('{{count}} days ago', { count: days }) : date.toLocaleDateString(language);
}

function ActivityError({ label, onRetry }) {
  const { t } = useTranslation();
  return (
    <View style={styles.activityError}>
      <Text style={[exploreStyles.text, styles.muted]}>{label}</Text>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onRetry}>
        <Text style={[exploreStyles.semibold, styles.retry]}>{t('Try again')}</Text>
      </Pressable>
    </View>
  );
}

function StoreChat({ storeId, isLoggedIn, onSignIn, wide }) {
  const { t, i18n } = useTranslation();
  const { entries: comments, failed, reload } = useStoreActivity(`getStoreComments/${storeId}`);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);
  const chatList = useRef(null);

  const sendMessage = async () => {
    if (!isLoggedIn) {
      onSignIn();
      return;
    }
    const comment = message.trim();
    if (!comment || postingRef.current) return;

    postingRef.current = true;
    setPosting(true);
    try {
      readStoreResponse(await Post(`createStoreComment/${storeId}`, { comment }));
      setMessage('');
      await reload();
      chatList.current?.scrollTo({ y: 0, animated: false });
      Toast.show({ type: 'success', text1: t('Message sent successfully') });
    } catch {
      Toast.show({ type: 'error', text1: t('Unable to send message') });
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const sendDisabled = posting || (isLoggedIn && !message.trim());
  return (
    <View style={[styles.section, styles.chatSection, wide && styles.wideSection]}>
      <View style={styles.headingRow}>
        <Text accessibilityRole="header" style={[exploreStyles.bold, styles.heading, wide && styles.wideHeading]}>{t('Live chat')}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={[exploreStyles.bold, styles.liveLabel]}>{t('Live')}</Text>
        </View>
        <Text style={[exploreStyles.text, styles.muted]}>({comments?.length || 0})</Text>
      </View>
      <Text style={[exploreStyles.medium, styles.conversation]}>{t('Join the Conversation')}</Text>

      <View style={styles.chatList}>
        {failed && <ActivityError label={t('Unable to load live chat')} onRetry={reload} />}
        {comments?.length ? (
          <ScrollView
            ref={chatList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chatMessages}
            style={styles.chatScroll}>
            {comments.map(item => {
              const name = authorName(item, t);
              return (
                <View key={item._id} style={styles.comment}>
                  <View style={styles.avatar}>
                    <Text style={[exploreStyles.semibold, styles.initial]}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.authorRow}>
                      <Text style={[exploreStyles.semibold, styles.author]}>{name}</Text>
                      <View style={styles.timeDot} />
                      <Text style={[exploreStyles.text, styles.timestamp]}>{timeAgo(item.createdAt, t, i18n.language)}</Text>
                    </View>
                    <Text style={[exploreStyles.text, styles.bubble]}>{item.comment}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : !failed && (
          <Text style={[exploreStyles.text, styles.muted, comments && styles.emptyChat]}>
            {comments ? t('No messages yet') : t('Loading live chat...')}
          </Text>
        )}
      </View>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel={isLoggedIn ? t('Add a comment...') : t('Sign in to live chat')}
          placeholder={isLoggedIn ? t('Add a comment...') : t('Sign in to live chat')}
          placeholderTextColor={exploreColors.muted}
          maxLength={2000}
          editable={isLoggedIn && !posting}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          style={[exploreStyles.text, styles.commentInput, !isLoggedIn && styles.guestInput]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLoggedIn ? t('Send live chat') : t('Sign in to live chat')}
          accessibilityState={{ disabled: sendDisabled }}
          disabled={sendDisabled}
          onPress={sendMessage}
          style={({ pressed }) => [styles.send, (pressed || sendDisabled) && styles.disabled]}>
          <SendHorizontal size={25} color="#fff" strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
  );
}

function StoreReviews({ store, isLoggedIn, onSignIn, onReviewSummary, wide }) {
  const { t, i18n } = useTranslation();
  const { entries: reviews, failed, reload } = useStoreActivity(`getStoreReviews/${store._id}`);
  const ownReview = isLoggedIn ? reviews?.find(review => review.isMine) : undefined;
  const [selectedRating, setSelectedRating] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const reviewTitle = ownReview ? t('Edit your review') : t('Add Review');

  const openReview = () => {
    setSelectedRating(ownReview?.rating || 0);
    setModalOpen(true);
  };

  const closeReview = () => {
    if (!savingRef.current) setModalOpen(false);
  };

  const saveReview = async removing => {
    if (savingRef.current) return;
    if (!isLoggedIn) {
      setModalOpen(false);
      onSignIn();
      return;
    }
    if (removing ? !ownReview?._id : !selectedRating) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const response = removing
        ? await Delete(`deleteStoreReview/${ownReview._id}`)
        : await Post(`createStoreReview/${store._id}`, { rating: selectedRating });
      const summary = readStoreResponse(response);
      onReviewSummary(summary);
      setModalOpen(false);
      await reload();
      Toast.show({ type: 'success', text1: removing ? t('Review deleted successfully') : t('Review submitted successfully') });
    } catch {
      Toast.show({ type: 'error', text1: removing ? t('Unable to delete review') : t('Unable to submit review') });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const confirmDelete = () => Alert.alert(t('Delete your review?'), undefined, [
    { text: t('Cancel', { context: 'review' }), style: 'cancel' },
    { text: t('Delete review'), style: 'destructive', onPress: () => saveReview(true) },
  ]);

  return (
    <View style={[styles.section, styles.reviewSection, wide && styles.wideSection]}>
      <View style={styles.reviewHeader}>
        <View style={styles.headingRow}>
          <Text accessibilityRole="header" style={[exploreStyles.bold, styles.heading, wide && styles.wideHeading]}>{t('Store reviews')}</Text>
          <Text style={[exploreStyles.semibold, styles.rating]}>
            {Number(store.averageRating || 0).toFixed(1)} / 5 ({store.reviewCount || 0})
          </Text>
        </View>
        <StoreButton label={reviewTitle} onPress={openReview} disabled={saving} />
      </View>
      <View style={styles.reviewList}>
        {failed && <ActivityError label={t('Unable to load store reviews')} onRetry={reload} />}
        {reviews?.length ? reviews.map(review => (
          <View key={review._id} style={styles.review}>
            <View style={styles.reviewHeader}>
              <View style={styles.authorRow}>
                <Text style={[exploreStyles.semibold, styles.reviewer]}>{authorName(review, t)}</Text>
                {isLoggedIn && review.isMine && (
                  <Text style={[exploreStyles.semibold, styles.ownReview]}>{t('Your review')}</Text>
                )}
              </View>
              <View style={styles.reviewStars}>
                <Star size={15} color={exploreColors.amber} fill={exploreColors.amber} />
                <Text style={[exploreStyles.text, styles.rating]}>{review.rating}/5</Text>
              </View>
            </View>
            <Text style={[exploreStyles.text, styles.timestamp]}>{timeAgo(review.createdAt, t, i18n.language)}</Text>
          </View>
        )) : !failed && (
          <Text style={[exploreStyles.text, styles.muted]}>{reviews ? t('No reviews yet') : t('Loading...')}</Text>
        )}
      </View>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={closeReview}>
        <View style={styles.overlay}>
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={closeReview} />
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            alwaysBounceVertical={false}
            pointerEvents="box-none">
            <View accessibilityViewIsModal style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text accessibilityRole="header" style={[exploreStyles.bold, styles.modalTitle]}>{reviewTitle}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={t('Close')} disabled={saving} hitSlop={8} onPress={closeReview}>
                  <X color={exploreColors.muted} size={20} />
                </Pressable>
              </View>
              <Text style={[exploreStyles.medium, styles.ratePrompt]}>{isLoggedIn ? t('Rate this store') : t('Sign in to review this store')}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={t('Store rating')} style={styles.ratingPicker}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <Pressable
                    key={rating}
                    accessibilityRole="radio"
                    accessibilityLabel={t('{{count}} stars', { count: rating })}
                    accessibilityState={{ checked: selectedRating === rating, disabled: saving || !isLoggedIn }}
                    disabled={saving || !isLoggedIn}
                    onPress={() => setSelectedRating(rating)}
                    style={[styles.ratingOption, !isLoggedIn && styles.disabled]}>
                    <Star size={32} color="#fbbf24" fill={rating <= selectedRating ? '#fbbf24' : 'none'} />
                  </Pressable>
                ))}
              </View>
              <StoreButton
                label={isLoggedIn ? (ownReview ? t('Update review') : t('Submit review')) : t('Sign in to review')}
                onPress={() => saveReview(false)}
                disabled={saving || (isLoggedIn && !selectedRating)}
                style={styles.submitReview}
              />
              {ownReview && (
                <StoreButton label={t('Delete review')} onPress={confirmDelete} disabled={saving} destructive style={styles.deleteReview} />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function StoreCommunity({ store, isLoggedIn, onSignIn, onReviewSummary, wide }) {
  return (
    <>
      <StoreChat storeId={store._id} isLoggedIn={isLoggedIn} onSignIn={onSignIn} wide={wide} />
      <StoreReviews store={store} isLoggedIn={isLoggedIn} onSignIn={onSignIn} onReviewSummary={onReviewSummary} wide={wide} />
    </>
  );
}

const styles = StyleSheet.create({
  section: { ...exploreStyles.shadow, borderRadius: 24, backgroundColor: '#fff', padding: 24 },
  wideSection: { padding: 40 },
  chatSection: { marginTop: 24 },
  reviewSection: { marginTop: 4 },
  headingRow: { ...exploreStyles.row, flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  heading: { fontSize: 30, lineHeight: 36, color: exploreColors.heading },
  wideHeading: { fontSize: 36, lineHeight: 40 },
  liveBadge: {
    ...exploreStyles.row,
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#dff1df',
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: exploreColors.green },
  liveLabel: { fontSize: 14, color: exploreColors.green, textTransform: 'uppercase', letterSpacing: 0.35 },
  conversation: { color: exploreColors.muted, fontSize: 16 },
  muted: { color: exploreColors.muted, fontSize: 14 },
  chatList: { marginTop: 20 },
  chatScroll: { maxHeight: 420 },
  chatMessages: { gap: 12, paddingRight: 4 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: exploreColors.green,
  },
  initial: { color: '#fff', fontSize: 16 },
  commentBody: { flex: 1 },
  authorRow: { ...exploreStyles.row, flexShrink: 1, flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  author: { fontSize: 14, color: exploreColors.heading },
  timeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: exploreColors.subtle },
  timestamp: { color: exploreColors.subtle, fontSize: 12, lineHeight: 16 },
  bubble: {
    alignSelf: 'flex-start',
    marginTop: 2,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 2,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#f0fdf4',
    color: '#1f2937',
  },
  emptyChat: { padding: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: exploreColors.border, borderRadius: 12, textAlign: 'center' },
  activityError: { gap: 6, alignItems: 'flex-start', paddingVertical: 8 },
  retry: { color: exploreColors.green, fontSize: 14 },
  composer: { ...exploreStyles.row, gap: 12, marginTop: 24 },
  commentInput: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: exploreColors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#fff',
  },
  guestInput: { backgroundColor: exploreColors.lightBorder },
  send: { backgroundColor: exploreColors.green, borderRadius: 999, padding: 12 },
  disabled: { opacity: 0.5 },
  reviewHeader: { ...exploreStyles.row, flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  rating: { fontSize: 14, color: exploreColors.amber },
  reviewList: { marginTop: 8, gap: 4 },
  review: { borderTopWidth: 1, borderColor: exploreColors.lightBorder, paddingTop: 4, gap: 4 },
  reviewer: { fontSize: 16, color: '#1f2937' },
  ownReview: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#dff1df',
    color: exploreColors.green,
  },
  reviewStars: { ...exploreStyles.row, gap: 4 },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalScroll: { flexGrow: 0 },
  modalContent: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  modal: { width: '100%', maxWidth: 448, backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalHeader: { ...exploreStyles.row, justifyContent: 'space-between', gap: 12 },
  modalTitle: { flexShrink: 1, fontSize: 20, color: exploreColors.heading },
  ratePrompt: { marginTop: 20, fontSize: 14, color: exploreColors.body },
  ratingPicker: { ...exploreStyles.row, justifyContent: 'center', gap: 4, marginTop: 12 },
  ratingOption: { alignItems: 'center', justifyContent: 'center', flexShrink: 1, padding: 4 },
  submitReview: { marginTop: 24, paddingVertical: 12 },
  deleteReview: { marginTop: 12, paddingVertical: 12 },
});
