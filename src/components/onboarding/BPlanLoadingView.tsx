import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';

import { MESSAGE_ROTATION_DURATION_MS, PLAN_LOADING_MESSAGES } from '@/src/constants/planLoadingStrings';
import { TextVariant } from '@/src/constants/theme';
import { BText, BView } from '../ui/index';

type BPlanLoadingViewProps = {
  message?: string;
};

/**
 * Loading view shown while AI generates financial plan
 * Features:
 * - Lottie loading animation (auto-plays)
 * - Cycling messages (mix of progress updates and financial tips)
 * - Clean, centered design
 */
export const BPlanLoadingView = ({ message }: BPlanLoadingViewProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Cycle through messages every 750ms
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % PLAN_LOADING_MESSAGES.length);
    }, MESSAGE_ROTATION_DURATION_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <BView flex justify="center" align="center" paddingX="lg">
      {/* Lottie Animation */}
      <BView marginY="xl">
        <LottieView
          source={require('../../../assets/animations/loading.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </BView>

      <BText variant={TextVariant.HEADING} center style={{ maxWidth: 320 }}>
        {message || PLAN_LOADING_MESSAGES[currentMessageIndex]}
      </BText>
    </BView>
  );
};
