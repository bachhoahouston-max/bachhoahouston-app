import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { GetApi, Put } from '../../../Assets/Helpers/Service';
import { exploreColors, exploreStyles } from './components';
import { readStoreResponse } from './storeDirectory';

const StoreBookmarksContext = createContext(null);

function initialState(session) {
  return { session, bookmarks: null, loadFailed: false, pending: new Set() };
}

export function StoreBookmarksProvider({ token, children }) {
  const { t } = useTranslation();
  const session = useMemo(() => ({ token, load: null, pending: new Set() }), [token]);
  const [state, setState] = useState(() => initialState(session));

  if (state.session !== session) {
    setState(initialState(session));
  }

  const update = useCallback(changes => {
    setState(current => current.session === session ? changes(current) : current);
  }, [session]);

  const loadBookmarks = useCallback(async () => {
    if (!session.token || session.load || session.pending.size) return;
    const request = {};
    session.load = request;
    update(current => ({ ...current, loadFailed: false }));
    try {
      const ids = readStoreResponse(await GetApi('storeBookmarks'));
      if (!Array.isArray(ids)) throw new Error('Invalid bookmarks response');
      if (session.load === request) {
        update(current => ({ ...current, bookmarks: new Set(ids) }));
      }
    } catch {
      if (session.load === request) {
        update(current => ({ ...current, loadFailed: current.bookmarks === null }));
      }
    } finally {
      if (session.load === request) session.load = null;
    }
  }, [session, update]);

  const toggleBookmark = async storeId => {
    if (!session.token || !state.bookmarks || session.pending.has(storeId)) return;
    const bookmarked = !state.bookmarks.has(storeId);
    // Ignore any read that started before this write.
    session.load = null;
    session.pending.add(storeId);
    update(current => ({ ...current, pending: new Set(session.pending) }));
    try {
      const result = readStoreResponse(await Put(
        `storeBookmarks/${encodeURIComponent(storeId)}`,
        { bookmarked },
        { expectedToken: session.token },
      ));
      if (result?.bookmarked !== bookmarked) throw new Error('Invalid bookmark response');
      update(current => {
        const bookmarks = new Set(current.bookmarks);
        if (bookmarked) bookmarks.add(storeId);
        else bookmarks.delete(storeId);
        return { ...current, bookmarks };
      });
    } catch {
      Toast.show({ type: 'error', text1: t('Unable to update store bookmark') });
    } finally {
      session.pending.delete(storeId);
      update(current => ({ ...current, pending: new Set(session.pending) }));
    }
  };

  return (
    <StoreBookmarksContext.Provider value={{ ...state, loadBookmarks, toggleBookmark }}>
      {children}
    </StoreBookmarksContext.Provider>
  );
}

export function useStoreBookmarks() {
  return useContext(StoreBookmarksContext);
}

export function StoreBookmarkButton({ storeId, storeName, showLabel, style }) {
  const { t } = useTranslation();
  const { bookmarks, pending, toggleBookmark } = useStoreBookmarks();
  const saved = bookmarks?.has(storeId) ?? false;
  const disabled = !bookmarks || pending.has(storeId);

  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityLabel={t('Bookmark {{store}}', { store: storeName })}
      accessibilityState={{ checked: saved, disabled }}
      disabled={disabled}
      onPress={() => toggleBookmark(storeId)}
      style={({ pressed }) => [styles.button, saved && styles.saved, showLabel && styles.labeled, style,
        (pressed || disabled) && exploreStyles.pressed]}>
      <Bookmark size={18} color={exploreColors.green} fill={saved ? exploreColors.green : 'none'} />
      {showLabel && <Text style={[exploreStyles.semibold, styles.label]}>{t('Bookmark')}</Text>}
    </Pressable>
  );
}

export function StoreBookmarksError() {
  const { t } = useTranslation();
  const { loadFailed, loadBookmarks } = useStoreBookmarks();
  if (!loadFailed) return null;

  return (
    <View style={styles.error}>
      <Text accessibilityRole="alert" style={exploreStyles.text}>{t('Unable to load store bookmarks')}</Text>
      <Pressable accessibilityRole="button" onPress={loadBookmarks} hitSlop={8}>
        <Text style={[exploreStyles.semibold, styles.label]}>{t('Retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    ...exploreStyles.row,
    ...exploreStyles.shadow,
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: exploreColors.border,
    backgroundColor: '#fff',
  },
  saved: { backgroundColor: exploreColors.imageBackground },
  labeled: { gap: 6, paddingHorizontal: 12 },
  label: { color: exploreColors.green, fontSize: 13 },
  error: { ...exploreStyles.row, flexWrap: 'wrap', gap: 8, marginBottom: 12 },
});
