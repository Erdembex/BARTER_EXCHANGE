import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export function useNetwork(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    const apply = (next: NetInfoState) => {
      setState({
        // isInternetReachable sık sık null/false döner (simülatör, localhost)
        // — yalnızca gerçek bağlantı kopmasında offline göster
        isConnected: next.isConnected !== false,
        isInternetReachable: next.isInternetReachable,
      });
    };

    NetInfo.fetch().then(apply);
    const unsubscribe = NetInfo.addEventListener(apply);
    return unsubscribe;
  }, []);

  return state;
}
