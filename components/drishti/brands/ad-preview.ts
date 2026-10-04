

export function isBrokenAdPreview(naturalWidth: number, naturalHeight: number): boolean {
  return naturalWidth === BROKEN_AD_PREVIEW_SIZE.width && naturalHeight === BROKEN_AD_PREVIEW_SIZE.height;
}
