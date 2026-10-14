import {GetApi} from './Service';

export const getBuyItAgainProducts = async () => {
  const response = await GetApi('getStatusCompletedProducts', {});
  const products = new Map();

  (Array.isArray(response?.data) ? response.data : []).forEach(order => {
    const lines = Array.isArray(order?.productDetail)
      ? order.productDetail
      : order?.productDetail
        ? [order.productDetail]
        : [];

    lines.forEach(line => {
      const shortage = Number(line?.shortage || 0);
      const product =
        line?.product && typeof line.product === 'object' ? line.product : line;
      const productId = product?._id || line?.product?._id || line?._id;
      const quantity = Number(
        product?.Quantity ?? product?.quantity ?? line?.Quantity ?? 0,
      );

      if (shortage <= 0 || !productId || quantity <= 0) return;

      const image = product?.image || line?.image;
      const variants =
        product?.varients ||
        line?.varients ||
        (image ? [{image: Array.isArray(image) ? image : [image]}] : []);

      products.set(String(productId), {
        ...product,
        _id: productId,
        Quantity: quantity,
        image,
        varients: variants,
        price_slot: product?.price_slot || line?.price_slot || [],
      });
    });
  });

  return Array.from(products.values());
};
