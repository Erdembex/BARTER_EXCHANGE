import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export function useNetwork(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const apply = (next: NetInfoState) => {
      setState({
        isConnected: next.isConnected ?? false,
        isInternetReachable: next.isInternetReachable,
      });
    };

    NetInfo.fetch().then(apply);
    const unsubscribe = NetInfo.addEventListener(apply);
    return unsubscribe;
  }, []);

  const offline =
    !state.isConnected ||
    state.isInternetReachable === false;

  return {
    isConnected: !offline,
    isInternetReachable: state.isInternetReachable,
  };
}
