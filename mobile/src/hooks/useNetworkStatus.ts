import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppDispatch } from '@store/hooks';
import { setOnlineStatus } from '@store/slices/offlineSlice';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

export const useNetworkStatus = () => {
  const dispatch = useAppDispatch();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      };
      
      setNetworkStatus(status);
      dispatch(setOnlineStatus(status.isConnected && status.isInternetReachable));
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      };
      
      setNetworkStatus(status);
      dispatch(setOnlineStatus(status.isConnected && status.isInternetReachable));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return networkStatus;
};
