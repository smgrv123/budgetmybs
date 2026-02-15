/**
 * Normalize utility for consistent sizing across devices
 * Uses a base width of 390 and height of 812 as reference
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions
const BASE_WIDTH = 390;
const BASE_HEIGHT = 812;

// Scale factors (local — used to compute screenScale)
const scaleWidth = screenWidth / BASE_WIDTH;
const scaleHeight = screenHeight / BASE_HEIGHT;
export const screenScale = Math.min(scaleWidth, scaleHeight);

/**
 * Normalize a size value based on screen scale
 * Use for all sizing: width, height, padding, margin, etc.
 */
export const normalize = (size: number): number => {
  return Math.ceil(size * screenScale);
};

/**
 * Normalize font size with pixel ratio consideration
 * Ensures text remains readable across all device densities
 */
export const normalizeFont = (size: number): number => {
  const scaledSize = size * screenScale;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

export default normalize;
