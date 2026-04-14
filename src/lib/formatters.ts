// ￥1,234 形式（Intl 通貨フォーマット）
export const formatJpy = (value: number): string =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(value);

// 1,234 形式（3桁区切り）
export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("ja-JP").format(value);

// 億円 / 万円 / 円 スケール（小数なし）— 集計表示用
export const format円 = (val: number): string => {
  if (val >= 100000000) return `${formatNumber(val / 100000000)}億円`;
  if (val >= 10000) return `${formatNumber(val / 10000)}万円`;
  return `${formatNumber(val)}円`;
};

// 億円（小数1桁）/ 万円 / 円 スケール — 億を小数1桁で丸める
export const format円Large = (value: number): string => {
  if (value >= 100000000)
    return `${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value / 100000000)}億円`;
  if (value >= 10000)
    return `${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(value / 10000)}万円`;
  return `${formatNumber(value)}円`;
};

// yyyy-MM-dd 形式
export const formatDateJpLocal = (d: Date): string => {
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
