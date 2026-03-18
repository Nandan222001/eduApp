import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { analyticsService } from '@services/analytics';

export const useScreenTracking = (screenName: string) => {
  const navigation = useNavigation();
  const previousScreen = useRef<string | null>(null);

  useEffect(() => {
    analyticsService.startScreenRender(screenName);

    const unsubscribeFocus = navigation.addListener('focus', () => {
      analyticsService.trackScreenView(screenName, previousScreen.current || undefined);
      analyticsService.endScreenRender(screenName);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      previousScreen.current = screenName;
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [screenName, navigation]);
};
