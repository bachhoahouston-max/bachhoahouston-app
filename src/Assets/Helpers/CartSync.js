import { GetApi, Put } from './Service';

// Thin wrapper around the standalone /cart-sync API. Kept separate from
// Service.js so it's obvious this only talks to the new cart-sync endpoints.
//
// The app and web build cart items under different field names (app:
// productid/offer/image, web: id/price/selectedImage). The server merges
// both key sets onto every item at save time, so what comes back from
// getSyncedCart always has both — no translation needed on this end.

const getSyncedCart = () => GetApi('cart-sync', {});

const saveSyncedCart = items =>
  Put('cart-sync', { items, platform: 'APP' });

export { getSyncedCart, saveSyncedCart };
