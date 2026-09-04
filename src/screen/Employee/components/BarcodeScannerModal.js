/* Camera barcode scanner used by the packing checklist (OrderChecklistModal).
 * Opens the rear camera, runs VisionCamera's native code scanner and returns
 * the first decoded value via onDetected. Requires a native rebuild after
 * adding react-native-vision-camera (Android minSdk 26). */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {useTranslation} from 'react-i18next';
import Constants, {FONTS} from '../../../Assets/Helpers/constant';
import {BRAND} from '../../../Assets/Helpers/orderUtils';

// Linear 1D formats a grocery barcode is likely to use, plus qr as a fallback.
const CODE_TYPES = [
  'ean-13',
  'ean-8',
  'upc-a',
  'upc-e',
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'itf',
  'qr',
];

const BarcodeScannerModal = ({visible, onClose, onDetected, title}) => {
  const {t} = useTranslation();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const [torch, setTorch] = useState(false);
  const [permChecked, setPermChecked] = useState(false);
  // Guards against the scanner firing the same frame's code many times before
  // the parent has a chance to unmount us.
  const lockRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      lockRef.current = false;
      setTorch(false);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
      if (!cancelled) setPermChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, hasPermission, requestPermission]);

  const handleCodes = useCallback(
    codes => {
      if (lockRef.current) return;
      const value = codes?.[0]?.value;
      if (!value) return;
      lockRef.current = true;
      onDetected(String(value).trim());
    },
    [onDetected],
  );

  const codeScanner = useCodeScanner({
    codeTypes: CODE_TYPES,
    onCodeScanned: handleCodes,
  });

  const renderBody = () => {
    if (!permChecked) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator color={BRAND} />
        </View>
      );
    }
    if (!hasPermission) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.msg}>
            {t('Camera permission is required to scan barcodes.')}
          </Text>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Linking.openSettings()}>
            <Text style={styles.linkBtnTxt}>{t('Open Settings')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!device) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.msg}>{t('No camera available on this device.')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.cameraWrap}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={visible}
          codeScanner={codeScanner}
          torch={torch ? 'on' : 'off'}
        />
        <View style={styles.reticle} pointerEvents="none" />
        <Text style={styles.hint} pointerEvents="none">
          {t('Line the barcode up inside the frame')}
        </Text>
        <TouchableOpacity
          style={styles.torchBtn}
          onPress={() => setTorch(p => !p)}>
          <Text style={styles.torchTxt}>{torch ? '🔦 ' + t('Off') : '🔦 ' + t('On')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTxt}>{title || t('Scan Barcode')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderBody()}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelTxt}>{t('Cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTxt: {color: '#fff', fontFamily: FONTS.Bold, fontSize: 15},
  close: {color: '#fff', fontSize: 18},
  cameraWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
  },
  reticle: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    bottom: '25%',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  hint: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    color: '#fff',
    fontFamily: FONTS.Medium,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  torchBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  torchTxt: {color: '#fff', fontFamily: FONTS.Medium, fontSize: 12},
  centerBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  msg: {
    fontFamily: FONTS.Regular,
    fontSize: 13,
    color: Constants.black,
    textAlign: 'center',
  },
  linkBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  linkBtnTxt: {color: BRAND, fontFamily: FONTS.Medium, fontSize: 13},
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelTxt: {color: Constants.customgrey, fontFamily: FONTS.Medium, fontSize: 13},
});

export default BarcodeScannerModal;
