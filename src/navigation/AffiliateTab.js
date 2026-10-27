import React, {useCallback, useContext} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';
import {ChartColumn, Home, Link2, RefreshCw, ShoppingCart, UserRound, WifiOff} from 'lucide-react-native';
import {UserContext} from '../../App';
import {navigate} from '../../navigationRef';
import {AffiliateProvider, useAffiliate} from '../screen/affiliation/AffiliateContext';
import AffiliateTabBar from '../screen/affiliation/components/AffiliateTabBar';
import {Button, EmptyState} from '../screen/affiliation/components/ui';
import AffiliateHome from '../screen/affiliation/AffiliateHome';
import AffiliateLinks from '../screen/affiliation/AffiliateLinks';
import AffiliateCommissions from '../screen/affiliation/AffiliateCommissions';
import AffiliateProfile from '../screen/affiliation/AffiliateProfile';
import AffiliateApply from '../screen/affiliation/AffiliateApply';
import AffiliateStatus from '../screen/affiliation/AffiliateStatus';
import {COLORS} from '../screen/affiliation/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// "Shop" leaves the panel for the customer store, so it has no page of its own.
const ShopPlaceholder = () => null;

const TABS = [
  {icon: Home, component: AffiliateHome, routeName: 'AffiliateHome', name: 'Home'},
  {icon: ShoppingCart, component: ShopPlaceholder, routeName: 'AffiliateShop', name: 'Shop', onPress: () => navigate('App')},
  {icon: Link2, component: AffiliateLinks, routeName: 'AffiliateLinks', name: 'My links'},
  {icon: ChartColumn, component: AffiliateCommissions, routeName: 'AffiliateCommissions', name: 'Commissions'},
  {icon: UserRound, component: AffiliateProfile, routeName: 'AffiliateProfile', name: 'My profile'},
];

const renderTabBar = props => <AffiliateTabBar {...props} tabs={TABS} />;

const AffiliateTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{headerShown: false, tabBarHideOnKeyboard: true}}
      tabBar={renderTabBar}>
      {TABS.map(item => (
        <Tab.Screen key={item.routeName} name={item.routeName} component={item.component} />
      ))}
    </Tab.Navigator>
  );
};

// Approved (or suspended) affiliates get the tabbed panel; everyone else sees
// the application form or its status until a manager approves them.
const AffiliateGate = () => {
  const [user] = useContext(UserContext);
  const {t} = useTranslation();
  const {dashboard, loading, error, refresh} = useAffiliate();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !dashboard) {
    return (
      <View style={styles.loader}>
        <EmptyState
          icon={WifiOff}
          title={t('Unable to load your affiliate account')}
          text={t('Please check your connection.')}
          action={
            <View style={styles.retry}>
              <Button label={t('Try again')} icon={RefreshCw} onPress={refresh} />
            </View>
          }
        />
      </View>
    );
  }

  const application = dashboard?.application;
  const hasPanel = ['Approved', 'Suspended'].includes(application?.status);
  const needsForm = !!user?.token && !application;
  const initialRoute = hasPanel ? 'AffiliateTabs' : needsForm ? 'AffiliateApply' : 'AffiliateStatus';

  return (
    <Stack.Navigator
      key={hasPanel ? 'panel' : 'application'}
      screenOptions={{headerShown: false}}
      initialRouteName={initialRoute}>
      {hasPanel ? (
        <Stack.Screen name="AffiliateTabs" component={AffiliateTabs} />
      ) : (
        <>
          <Stack.Screen name="AffiliateStatus" component={AffiliateStatus} />
          <Stack.Screen name="AffiliateApply" component={AffiliateApply} />
        </>
      )}
    </Stack.Navigator>
  );
};

export const Affiliatetab = () => (
  <AffiliateProvider>
    <AffiliateGate />
  </AffiliateProvider>
);

const styles = StyleSheet.create({
  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background},
  retry: {flexDirection: 'row', marginTop: 18, width: 200},
});
