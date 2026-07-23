import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { buildAuthenticatedImageSource } from '@/lib/authenticatedImage';
import { Colors } from '@/theme';

type AuthenticatedImageProps = Omit<ImageProps, 'source'> & {
  uri: string | null | undefined;
  fallback?: React.ReactNode;
  imageStyle?: StyleProp<ImageStyle>;
};

export function AuthenticatedImage({
  uri,
  fallback = null,
  style,
  imageStyle,
  onError,
  ...rest
}: AuthenticatedImageProps) {
  const [source, setSource] = useState<ImageSourcePropType | null>(null);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const loadSource = useCallback(
    (forceRefresh = false) => {
      if (!uri?.trim()) return;
      buildAuthenticatedImageSource(uri, { forceRefresh })
        .then((next) => {
          if (next) setSource(next);
        })
        .catch(() => setFailed(true));
    },
    [uri]
  );

  useEffect(() => {
    setFailed(false);
    setSource(null);
    setRetryCount(0);
    loadSource(false);
  }, [uri, loadSource]);

  if (!uri?.trim()) {
    return <>{fallback}</>;
  }

  if (failed) {
    return (
      <>
        {fallback ?? (
          <View
            style={[
              style,
              imageStyle,
              {
                backgroundColor: Colors.borderLight,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ fontSize: 20, opacity: 0.45 }}>🖼</Text>
          </View>
        )}
      </>
    );
  }

  if (!source) {
    return (
      <>
        {fallback ?? (
          <View style={[style, imageStyle, { backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator size="small" color={Colors.textMuted} />
          </View>
        )}
      </>
    );
  }

  return (
    <Image
      {...rest}
      source={source}
      style={[style, imageStyle]}
      onError={(event) => {
        if (retryCount < 1) {
          setRetryCount(1);
          loadSource(true);
          return;
        }
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
