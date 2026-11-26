import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import {
  ApiFormData,
  GetApi,
  Post,
  Delete,
} from '../../../Assets/Helpers/Service';
import { readStoreResponse } from '../../app/exploreHouston/storeDirectory';

const read = async path => readStoreResponse(await GetApi(path));
export const write = async (path, payload) =>
  readStoreResponse(await Post(path, payload));
export const remove = async path => readStoreResponse(await Delete(path));

export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const MAX_PHOTOS = 5;
export const categoryId = store =>
  store.category?._id ||
  (typeof store.category === 'string' ? store.category : '');

export function useStoreData(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: false,
  });
  const [revision, setRevision] = useState(0);
  const focused = useIsFocused();
  const reload = () => setRevision(current => current + 1);

  useEffect(() => {
    if (!focused || !path) return;
    let active = true;
    setState(previous => ({ ...previous, loading: true, error: false }));
    read(path).then(
      data => active && setState({ data, loading: false, error: false }),
      () =>
        active &&
        setState(previous => ({ ...previous, loading: false, error: true })),
    );
    return () => {
      active = false;
    };
  }, [focused, path, revision]);

  return { ...state, reload };
}

export function useStoreAction() {
  const { t } = useTranslation();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = async (task, fallback) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      Alert.alert(t('Store'), error?.message || t(fallback));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return { busy, run };
}

export function confirmDelete(t, message, onDelete) {
  Alert.alert(t('Delete'), message, [
    { text: t('Cancel_review'), style: 'cancel' },
    { text: t('Delete'), style: 'destructive', onPress: onDelete },
  ]);
}

export async function pickStoreImages(selectionLimit) {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.75,
    selectionLimit,
  });
  if (result.errorCode) throw new Error(result.errorMessage);
  return result.assets || [];
}

export async function uploadStoreImage(asset) {
  const result = readStoreResponse(
    await ApiFormData(asset, { authenticated: true }),
  );
  if (!result?.file) throw new Error();
  return result.file;
}
