import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {GetApi} from '../../Assets/Helpers/Service';
import {UserContext} from '../../../App';

// One dashboard request feeds every affiliate page; screens read it from here
// and call refresh() after actions (apply, payout) or on pull-to-refresh.
// The panel navigator also refreshes whenever the panel regains focus.
const AffiliateContext = createContext({
  dashboard: null,
  loading: true,
  error: false,
  refresh: () => Promise.resolve(),
});

export const AffiliateProvider = ({children}) => {
  const [user] = useContext(UserContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when the last load failed. Without it, a network error would look
  // like "no application yet" and show the apply form to approved affiliates.
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    if (!user?.token) {
      setDashboard(null);
      setError(false);
      setLoading(false);
      return Promise.resolve();
    }
    return GetApi('affiliation/dashboard', {})
      .then(res => {
        if (res?.status) {
          setDashboard(res.data);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.token]);

  const value = useMemo(() => ({dashboard, loading, error, refresh}), [dashboard, loading, error, refresh]);
  return <AffiliateContext.Provider value={value}>{children}</AffiliateContext.Provider>;
};

export const useAffiliate = () => useContext(AffiliateContext);
