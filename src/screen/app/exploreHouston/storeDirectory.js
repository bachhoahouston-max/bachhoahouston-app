import moment from 'moment-timezone';
import { GetApi } from '../../../Assets/Helpers/Service';

const HOUSTON_TIMEZONE = 'America/Chicago';

export function formatCommentTimestamp(value, language) {
  const date = new Date(value ?? '');
  if (!Number.isFinite(date.getTime())) return '';
  const isVietnamese = language?.toLowerCase().startsWith('vi');
  return moment.tz(date, HOUSTON_TIMEZONE).locale('en').format(
    isVietnamese ? 'HH:mm DD/MM/YYYY' : 'MMM D, YYYY, h:mm A',
  );
}

export function readStoreResponse(response) {
  if (response?.status !== true) {
    throw new Error(response?.message);
  }
  return response.data;
}

export async function isExploreHoustonVisible() {
  const data = readStoreResponse(await GetApi('storeModuleVisibility'));
  const visible = data?.isVisibleOnMobile ?? data?.isVisible;
  if (typeof visible !== 'boolean') {
    throw new Error('Invalid store module visibility');
  }
  return visible;
}

export function localizedStoreText(english, vietnamese, language) {
  return language?.toLowerCase().startsWith('vi')
    ? vietnamese || english
    : english || vietnamese;
}

export function resolveStoreCategory(store, categoriesById) {
  return typeof store.category === 'object'
    ? store.category
    : categoriesById.get(store.category);
}

export function getStorePhotos(store) {
  const additionalImages = Array.isArray(store.additionalImages) ? store.additionalImages : [];
  return [store.image, ...additionalImages].filter(url => typeof url === 'string' && url.trim());
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

export function filterStores(stores, categoriesById, categoryId, search) {
  const query = normalizeSearchText(search.trim());

  return stores.filter(store => {
    const category = resolveStoreCategory(store, categoriesById);
    if (categoryId && categoryId !== (category?._id || store.category)) {
      return false;
    }
    return !query || normalizeSearchText([
      store.title,
      store.title_v,
      store.shortDescription,
      store.shortDescription_v,
      store.address,
      category?.name,
      category?.v_name,
    ].join(' ')).includes(query);
  }).sort((first, second) => {
    const personalOrder = Number(second.isPersonal === true) - Number(first.isPersonal === true);
    if (personalOrder || first.isPersonal !== true) return personalOrder;

    const firstMarkedAt = Date.parse(first.personalMarkedAt) || 0;
    const secondMarkedAt = Date.parse(second.personalMarkedAt) || 0;
    return secondMarkedAt - firstMarkedAt;
  });
}

function minutesSinceMidnight(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return NaN;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getStoreOpenStatus(store, date = new Date()) {
  if (!Array.isArray(store.openingHours) || !store.openingHours.length) {
    return null;
  }

  const zone = moment.tz.zone(store.timezone || '') ? store.timezone : HOUSTON_TIMEZONE;
  const currentTime = moment.tz(date, zone);
  const day = currentTime.day();
  const minutes = currentTime.hours() * 60 + currentTime.minutes();
  const todayHours = store.openingHours.find(entry => entry.day === day);
  const yesterdayHours = store.openingHours.find(entry => entry.day === (day + 6) % 7);
  const open = minutesSinceMidnight(todayHours?.open);
  const close = minutesSinceMidnight(todayHours?.close);
  const yesterdayOpen = minutesSinceMidnight(yesterdayHours?.open);
  const yesterdayClose = minutesSinceMidnight(yesterdayHours?.close);
  const openToday = todayHours && !todayHours.isClosed && minutes >= open &&
    (minutes < close || close < open);
  const openOvernight = yesterdayHours && !yesterdayHours.isClosed &&
    yesterdayClose < yesterdayOpen && minutes < yesterdayClose;

  return { isOpen: Boolean(openToday || openOvernight), todayHours };
}

export function formatStoreHours(hours) {
  if (!hours || hours.isClosed || ![hours.open, hours.close].every(time =>
    Number.isFinite(minutesSinceMidnight(time)),
  )) {
    return '';
  }
  const [open, close] = [hours.open, hours.close].map(time => {
    const [hour, minute] = time.split(':');
    return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) < 12 ? 'AM' : 'PM'}`;
  });
  return `${open} - ${close}`;
}
