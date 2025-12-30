/**
 * Normalize utility for consistent sizing across devices
 * Uses a base width of 390 and height of 812 as reference
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions
const BASE_WIDTH = 390;
const BASE_HEIGHT = 812;

// Scale factors
export const scaleWidth = screenWidth / BASE_WIDTH;
export const scaleHeight = screenHeight / BASE_HEIGHT;
export const screenScale = Math.min(scaleWidth, scaleHeight);

/**
 * Normalize a size value based on screen scale
 * Use for all sizing: width, height, padding, margin, etc.
 */
export const normalize = (size: number): number => {
  return Math.ceil(size * screenScale);
};

/**
 * Normalize with pixel ratio rounding for crisper rendering
 */
export const normalizeRounded = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel(size * screenScale));
};

/**
 * Normalize font size with pixel ratio consideration
 * Ensures text remains readable across all device densities
 */
export const normalizeFont = (size: number): number => {
  const scaledSize = size * screenScale;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

/**
 * Get current screen dimensions
 */
export const getScreenDimensions = () => ({
  width: screenWidth,
  height: screenHeight,
  scaleWidth,
  scaleHeight,
  screenScale,
  isSmallDevice: screenWidth < 375,
  isMediumDevice: screenWidth >= 375 && screenWidth < 414,
  isLargeDevice: screenWidth >= 414,
});

export default normalize;
