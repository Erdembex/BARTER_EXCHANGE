import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  TURKEY_CITIES,
  formatLocationLabel,
  getDistrictsForCity,
} from '@/constants/turkeyLocations';
import {
  LOCATION_ALL,
  formatFilterLocationLabel,
  isLocationAll,
} from '@/lib/locationFilterUtils';
import { resolveLocationFromDevice } from '@/hooks/useDeviceLocation';
import { LocationSelectorModal } from '@/components/common/LocationSelectorModal';
import { Colors, Typography, Radius, Spacing } from '@/theme';

type LocationFieldsProps = {
  city: string | null;
  district: string | null;
  onCityChange: (city: string | null) => void;
  onDistrictChange: (district: string | null) => void;
  /** Filtre modunda il/ilçe temizlenebilir */
  allowClear?: boolean;
  /** Kayıt/profil modunda il ve ilçe zorunlu */
  required?: boolean;
  showGps?: boolean;
  error?: string;
};

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

function LocationFields({
  city,
  district,
  onCityChange,
  onDistrictChange,
  allowClear = false,
  required = false,
  showGps = true,
  error,
}: LocationFieldsProps) {
  const [cityModal, setCityModal] = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsHint, setGpsHint] = useState('');

  const districts = city && !isLocationAll(city) ? getDistrictsForCity(city) : [];
  const showAllOption = allowClear;
  const cityItems = showAllOption ? [LOCATION_ALL, ...TURKEY_CITIES] : [...TURKEY_CITIES];
  const districtItems =
    showAllOption && city && !isLocationAll(city)
      ? [LOCATION_ALL, ...districts]
      : districts;

  const handleGps = async () => {
    setGpsLoading(true);
    setGpsHint('');
    try {
      const result = await resolveLocationFromDevice();
      onCityChange(result.city);
      onDistrictChange(showAllOption ? LOCATION_ALL : result.district);
      setGpsHint(
        showAllOption
          ? `İl algılandı: ${result.city}. İlçe “Hepsi” — tüm ilçelerdeki ilanlar listelenir.`
          : result.district
            ? `Konumun algılandı: ${formatLocationLabel(result.city, result.district)}`
            : `İl algılandı: ${result.city}. İlçeyi kontrol et veya seç.`
      );
    } catch (err: unknown) {
      setGpsHint(err instanceof Error ? err.message : 'Konum alınamadı.');
    } finally {
      setGpsLoading(false);
    }
  };

  const summary = showAllOption
    ? formatFilterLocationLabel(city, district)
    : formatLocationLabel(city, district);

  const districtValue =
    showAllOption && city && isLocationAll(city) ? LOCATION_ALL : district;
  const districtDisabled = !city || (showAllOption && isLocationAll(city));

  return (
    <View style={styles.wrap}>
      {showGps ? (
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleGps}
          disabled={gpsLoading}
          activeOpacity={0.85}
        >
          {gpsLoading ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.gpsBtnText}>📍 Konumumu kullan</Text>
          )}
        </TouchableOpacity>
      ) : null}

      <SelectField
        label={required ? 'İl *' : 'İl'}
        value={city}
        placeholder="İl seç"
        onPress={() => setCityModal(true)}
      />

      <SelectField
        label={required ? 'İlçe *' : 'İlçe'}
        value={districtValue}
        placeholder={
          !city
            ? 'Önce il seç'
            : isLocationAll(city)
              ? LOCATION_ALL
              : showAllOption
                ? 'İlçe veya Hepsi'
                : 'İlçe seç'
        }
        onPress={() => setDistrictModal(true)}
        disabled={districtDisabled}
      />

      {summary && !allowClear ? (
        <Text style={styles.summary}>Seçilen: {summary}</Text>
      ) : null}

      {allowClear && summary ? (
        <Text style={styles.filterSummary}>Filtre: {summary}</Text>
      ) : null}

      {gpsHint ? <Text style={styles.gpsHint}>{gpsHint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <LocationSelectorModal
        visible={cityModal}
        title="İl seç"
        items={cityItems}
        selected={city}
        searchPlaceholder="İl ara (81 il)…"
        onClose={() => setCityModal(false)}
        onSelect={(item) => {
          onCityChange(item);
          if (showAllOption && isLocationAll(item)) {
            onDistrictChange(LOCATION_ALL);
          } else if (showAllOption) {
            onDistrictChange(LOCATION_ALL);
          } else {
            onDistrictChange(null);
          }
          setCityModal(false);
        }}
      />

      <LocationSelectorModal
        visible={districtModal}
        title={city && !isLocationAll(city) ? `${city} — ilçe seç` : 'İlçe seç'}
        items={districtItems}
        selected={districtValue}
        searchPlaceholder="İlçe ara…"
        onClose={() => setDistrictModal(false)}
        onSelect={(item) => {
          onDistrictChange(item);
          setDistrictModal(false);
        }}
      />
    </View>
  );
}

type LocationFilterProps = {
  city: string | null;
  district: string | null;
  onCityChange: (city: string | null) => void;
  onDistrictChange: (district: string | null) => void;
};

/** Görev keşfet — il/ilçe filtresi (81 il, 973 ilçe + GPS) */
export function LocationFilter({
  city,
  district,
  onCityChange,
  onDistrictChange,
}: LocationFilterProps) {
  return (
    <View>
      <Text style={styles.sectionLabel}>Konum filtresi</Text>
      <LocationFields
        city={city}
        district={district}
        onCityChange={onCityChange}
        onDistrictChange={onDistrictChange}
        allowClear
        showGps
      />
    </View>
  );
}

type LocationPickerProps = {
  city: string;
  district: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  error?: string;
};

/** Kayıt / profil — zorunlu il + ilçe (manuel veya GPS) */
export function LocationPicker({
  city,
  district,
  onCityChange,
  onDistrictChange,
  error,
}: LocationPickerProps) {
  return (
    <LocationFields
      city={city || null}
      district={district || null}
      onCityChange={(c) => onCityChange(c ?? '')}
      onDistrictChange={(d) => onDistrictChange(d ?? '')}
      required
      showGps
      error={error}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing[3] },
  sectionLabel: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  gpsBtnText: {
    ...Typography.labelMedium,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  fieldWrap: { gap: Spacing[1] },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 48,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  fieldPlaceholder: { color: Colors.textTertiary },
  chevron: { color: Colors.textTertiary, fontSize: 10, marginLeft: Spacing[2] },
  clearBtn: { alignSelf: 'flex-start' },
  clearText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  summary: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  filterSummary: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  gpsHint: {
    ...Typography.caption,
    color: Colors.info,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});

export type { TurkeyCity } from '@/constants/turkeyLocations';
