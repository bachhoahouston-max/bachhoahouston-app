import React, { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SendHorizontal, Star, X } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Delete, GetApi, Post } from '../../../Assets/Helpers/Service';
import { exploreColors, exploreStyles, StoreButton } from './components';
import { formatCommentTimestamp, readStoreResponse } from './storeDirectory';

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

  const sendDisabled = posting || !message.trim();
  return (
    <View style={styles.chatSection}>
      <LinearGradient
        colors={['#163a20', '#24502a']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.chatHeader, wide && styles.wideChatHeader]}>
        <View pointerEvents="none" style={styles.chatHeaderArc} />
        <View style={styles.chatHeadingRow}>
          <Text accessibilityRole="header" style={[exploreStyles.bold, styles.chatHeading, wide && styles.wideHeading]}>{t('Live chat')}</Text>
          <View style={styles.chatStatus}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={[exploreStyles.bold, styles.liveLabel]}>{t('Live')}</Text>
            </View>
            <Text style={[exploreStyles.text, styles.chatCount]}>({comments?.length || 0})</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={[styles.chatBody, wide && styles.wideChatBody]}>
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
                const timestamp = formatCommentTimestamp(item.createdAt, i18n.language);
                return (
                  <View key={item._id} style={styles.comment}>
                    <LinearGradient
                      accessible={false}
                      importantForAccessibility="no-hide-descendants"
                      accessibilityElementsHidden
                      colors={['#2f7846', '#194b2b']}
                      style={[styles.avatar, wide && styles.wideAvatar]}>
                      <Text style={[exploreStyles.semibold, styles.initial]}>{name.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={styles.commentBody}>
                      <Text style={[exploreStyles.semibold, styles.author, wide && styles.wideCommentText]}>{name}</Text>
                      {timestamp ? <Text style={[exploreStyles.text, styles.chatTimestamp]}>{timestamp}</Text> : null}
                      <View style={styles.bubble}>
                        <Text style={[exploreStyles.text, styles.bubbleText, wide && styles.wideCommentText]}>{item.comment}</Text>
                      </View>
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

        {isLoggedIn ? (
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel={t('Add a comment...')}
              placeholder={t('Add a comment...')}
              placeholderTextColor={exploreColors.muted}
              maxLength={2000}
              editable={!posting}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              style={[exploreStyles.text, styles.commentInput, styles.chatInput, wide && styles.wideChatInput]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Send live chat')}
              accessibilityState={{ disabled: sendDisabled }}
              disabled={sendDisabled}
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.send,
                wide && styles.wideSend,
                pressed && styles.sendPressed,
                sendDisabled && styles.sendDisabled,
              ]}>
              <SendHorizontal size={25} color="#fff" strokeWidth={1.8} />
            </Pressable>
          </View>
        ) : (
          <StoreButton label={t('Sign in to live chat')} onPress={onSignIn} style={styles.signInChat} />
        )}
      </View>
    </View>
  );
}

function StoreReviews({ store, isLoggedIn, onSignIn, onReviewSummary, wide }) {
  const { t, i18n } = useTranslation();
  const { entries: reviews, failed, reload } = useStoreActivity(`getStoreReviews/${store._id}`);
  const ownReview = isLoggedIn ? reviews?.find(review => review.isMine) : undefined;
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const reviewTitle = ownReview ? t('Edit your review') : t('Add Review');

  const openReview = () => {
    if (!isLoggedIn) {
      onSignIn();
      return;
    }
    setSelectedRating(ownReview?.rating || 0);
    setFeedback(ownReview?.feedback || '');
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
        : await Post(`createStoreReview/${store._id}`, { rating: selectedRating, feedback: feedback.trim() });
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
        <StoreButton label={isLoggedIn ? reviewTitle : t('Sign in to review')} onPress={openReview} disabled={saving} />
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

      <Modal visible={isLoggedIn && modalOpen} transparent animationType="fade" onRequestClose={closeReview}>
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
              <Text style={[exploreStyles.medium, styles.ratePrompt]}>{t('Rate this store')}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={t('Store rating')} style={styles.ratingPicker}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <Pressable
                    key={rating}
                    accessibilityRole="radio"
                    accessibilityLabel={t('{{count}} stars', { count: rating })}
                    accessibilityState={{ checked: selectedRating === rating, disabled: saving }}
                    disabled={saving}
                    onPress={() => setSelectedRating(rating)}
                    style={styles.ratingOption}>
                    <Star size={32} color="#fbbf24" fill={rating <= selectedRating ? '#fbbf24' : 'none'} />
                  </Pressable>
                ))}
              </View>
              <Text style={[exploreStyles.medium, styles.ratePrompt]}>{t('Feedback (optional)')}</Text>
              <TextInput
                accessibilityLabel={t('Feedback (optional)')}
                placeholder={t('Share your feedback')}
                placeholderTextColor={exploreColors.muted}
                value={feedback}
                onChangeText={setFeedback}
                maxLength={2000}
                editable={!saving}
                multiline
                style={[exploreStyles.text, styles.commentInput, styles.feedbackInput]}
              />
              <StoreButton
                label={ownReview ? t('Update review') : t('Submit review')}
                onPress={() => saveReview(false)}
                disabled={saving || !selectedRating}
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
  chatSection: {
    ...exploreStyles.shadow,
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#b7c8ae',
    backgroundColor: '#fffcf6',
  },
  chatHeader: {
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    backgroundColor: '#163a20',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  wideChatHeader: { paddingHorizontal: 40, paddingVertical: 20 },
  chatHeaderArc: {
    position: 'absolute',
    right: -40,
    bottom: -48,
    width: 176,
    height: 80,
    borderRadius: 40,
    borderTopWidth: 7,
    borderColor: 'rgba(180, 207, 100, 0.35)',
    transform: [{ rotate: '-18deg' }],
  },
  chatHeadingRow: { ...exploreStyles.row, flexWrap: 'wrap', columnGap: 12, rowGap: 8 },
  chatHeading: { flexShrink: 1, fontSize: 24, lineHeight: 30, color: '#fff' },
  chatStatus: { ...exploreStyles.row, flexShrink: 1, gap: 10 },
  chatCount: { color: '#ffffffe6', fontSize: 14 },
  chatBody: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  wideChatBody: { paddingHorizontal: 40, paddingBottom: 28 },
  reviewSection: { marginTop: 4 },
  headingRow: { ...exploreStyles.row, flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  heading: { fontSize: 30, lineHeight: 36, color: exploreColors.heading },
  wideHeading: { fontSize: 36, lineHeight: 40 },
  liveBadge: {
    ...exploreStyles.row,
    gap: 6,
    flexShrink: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ffdc8d',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#173c23' },
  liveLabel: { flexShrink: 1, fontSize: 12, color: '#173c23', textTransform: 'uppercase', letterSpacing: 0.35 },
  conversation: { color: exploreColors.body, fontSize: 16 },
  muted: { color: exploreColors.muted, fontSize: 14 },
  chatList: { marginTop: 16 },
  chatScroll: { maxHeight: 420 },
  chatMessages: { gap: 16, paddingRight: 4 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideAvatar: { width: 48, height: 48, borderRadius: 24 },
  initial: { color: '#fff', fontSize: 16 },
  commentBody: { flex: 1 },
  authorRow: { ...exploreStyles.row, flexShrink: 1, flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  author: { fontSize: 14, color: exploreColors.heading },
  chatTimestamp: { color: exploreColors.body, fontSize: 12, lineHeight: 16 },
  timestamp: { color: exploreColors.subtle, fontSize: 12, lineHeight: 16 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 4,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e9f5e8',
  },
  bubbleText: { fontSize: 14, color: '#203729' },
  wideCommentText: { fontSize: 16 },
  emptyChat: {
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c8d8c2',
    borderRadius: 12,
    backgroundColor: '#f3f8ee',
    textAlign: 'center',
  },
  activityError: { gap: 6, alignItems: 'flex-start', paddingVertical: 8 },
  retry: { color: exploreColors.green, fontSize: 14 },
  composer: { ...exploreStyles.row, gap: 10, marginTop: 20 },
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
  chatInput: {
    ...exploreStyles.shadow,
    minWidth: 0,
    minHeight: 48,
    borderColor: '#d1d5db',
    fontSize: 16,
    color: '#1f2937',
  },
  wideChatInput: { minHeight: 56 },
  signInChat: { alignSelf: 'flex-start', marginTop: 20, backgroundColor: '#194b2b' },
  send: {
    ...exploreStyles.shadow,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#194b2b',
  },
  wideSend: { width: 56, height: 56, borderRadius: 28 },
  sendPressed: { backgroundColor: exploreColors.green },
  sendDisabled: { backgroundColor: '#4d7056' },
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
  feedbackInput: { flex: 0, minHeight: 84, marginTop: 8, textAlignVertical: 'top' },
  submitReview: { marginTop: 24, paddingVertical: 12 },
  deleteReview: { marginTop: 12, paddingVertical: 12 },
});
