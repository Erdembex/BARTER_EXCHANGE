import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { TURKEY_DEFAULT_REGION } from '@/lib/turkeyMapCoords';
import type { MapPin } from './types';

export type { MapPin } from './types';

type Props = {
  pins: MapPin[];
  onSelectPin: (pin: MapPin) => void;
};

export function DiscoverMapView({ pins, onSelectPin }: Props) {
  return (
    <MapView style={styles.map} initialRegion={TURKEY_DEFAULT_REGION}>
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
          title={pin.task.businessName ?? pin.task.title}
          description={pin.task.rewardDescription ?? pin.task.title}
          onPress={() => onSelectPin(pin)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
