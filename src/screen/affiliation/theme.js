import {Platform} from 'react-native';
import Constants, {FONTS} from '../../Assets/Helpers/constant';

// Palette for the affiliate panel. Kept separate from the customer theme so
// the panel can evolve on its own while staying on-brand.
export const COLORS = {
  primary: Constants.greennew,
  primaryDark: '#1F5F24',
  primarySoft: '#EAF6EC',
  primaryBorder: '#CFE7D3',
  primaryMuted: '#E3F1E5',
  background: '#F5F8F5',
  surface: '#FFFFFF',
  text: '#13261A',
  textSecondary: '#4B5B52',
  muted: '#7A887F',
  border: '#E3ECE5',
  divider: '#EEF2EF',
  white: '#FFFFFF',
  warning: '#C2410C',
  warningSoft: '#FFF1E3',
  danger: '#C62828',
  dangerSoft: '#FDECEA',
  info: '#1D5FBF',
  infoSoft: '#E7F0FC',
  neutral: '#5B6770',
  neutralSoft: '#EEF1F3',
};

export {FONTS};

export const RADIUS = {sm: 10, md: 14, lg: 18, xl: 24};

export const SHADOW = Platform.select({
  ios: {
    shadowColor: '#0F2A16',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: {elevation: 2},
});
