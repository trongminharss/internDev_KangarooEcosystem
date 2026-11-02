import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import DeviceSection, {
  DeviceGridHeader,
  RegionStatus,
} from '@/features/home/presentation/components/DeviceSection';
import HomeHeader from '@/features/home/presentation/components/HomeHeader';
import DeviceCard from '@/features/home/presentation/components/DeviceCard';
import ProductCard from '@/features/home/presentation/components/ProductCard';
import {requestBluetoothPermission} from '@/features/device/presentation/hooks/useDevicePermissions';
import {useNearbyDevicePrompt} from '@/features/device/presentation/hooks/useNearbyDevicePrompt';
import {NearbyDeviceSheet} from '@/features/device/presentation/components/NearbyDeviceSheet';
import {
  ProductSectionBody,
  ProductSectionTitle,
} from '@/features/home/presentation/components/ProductSection';
import {
  DeviceRegionResult,
  loadDeviceRegion,
  loadProductRegion,
  MockDevice,
  MockProduct,
  ProductRegionResult,
} from '@/features/home/presentation/mocks/mockHome';

type DeviceState =
  | {status: Extract<RegionStatus, 'loading'>}
  | DeviceRegionResult;
type ProductState =
  | {status: Extract<RegionStatus, 'loading'>}
  | ProductRegionResult;
type ListItem = MockDevice | MockProduct;

// TODO: integration point — các đích chưa có màn (kết nối thiết bị, chi tiết SP, giỏ, xem thêm, thử lại, thêm thiết bị)
const noopTODO = () => {};

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useAppNavigation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  // BLE is asked here first so nearby devices can be shown; AddDevice re-asks if it was turned off
  useEffect(() => {
    requestBluetoothPermission().catch(e =>
      console.error('[HomeScreen] Bluetooth permission failed:', e),
    );
  }, []);

  const [device, setDevice] = useState<DeviceState>({status: 'loading'});
  const [products, setProducts] = useState<ProductState>({
    status: 'loading',
  });

  useEffect(() => {
    let mounted = true;
    loadDeviceRegion().then(state => {
      if (mounted) {
        setDevice(state);
      }
    });
    loadProductRegion().then(state => {
      if (mounted) {
        setProducts(state);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const connected = device.status === 'success';
  const items = products.status === 'success' ? products.items : [];
  const devices = connected ? device.data.devices : [];
  const listData: ListItem[] = connected ? devices : items;

  // with every permission already granted, a nearby purifier in pairing mode pops up on its own
  const nearby = useNearbyDevicePrompt('water-purifier');

  return (
    <SafeAreaView edges={['top']} style={styles.container} testID="home-screen">
      <Svg style={styles.gradient} testID="home-gradient-svg">
        <Defs>
          <LinearGradient
            id="homeBackgroundGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1">
            <Stop
              offset="0"
              stopColor={isDark ? colors.blue900 : colors.blue300}
            />
            <Stop
              offset="1"
              stopColor={isDark ? colors.background : colors.blue100}
            />
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill="url(#homeBackgroundGradient)"
          fillOpacity={isDark ? 0.35 : 0.15}
        />
      </Svg>
      <FlatList
        numColumns={2}
        data={listData}
        keyExtractor={item => item.id}
        renderItem={({item}) =>
          'price' in item ? (
            <ProductCard
              product={item}
              onPress={noopTODO}
              onAddToCart={noopTODO}
            />
          ) : (
            <DeviceCard
              device={item}
              onPress={() => navigation.navigate('PurifierDetail')}
            />
          )
        }
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.content,
          // 90 = khoảng đệm cho thanh tab nổi (65) + khoảng hở, theo HomeScreen cũ
          {paddingBottom: insets.bottom + 90},
        ]}
        ListHeaderComponent={
          <>
            <HomeHeader onAvatarPress={() => navigation.navigate('Account')} />
            <DeviceSection
              status={device.status}
              data={connected ? device.data : undefined}
              onConnect={() => navigation.navigate('AddDevice')}
              onRetry={() => navigation.navigate('AddDevice')}
            />
            {connected ? <DeviceGridHeader /> : <ProductSectionTitle />}
          </>
        }
        ListEmptyComponent={
          connected ? undefined : (
            <ProductSectionBody status={products.status} onRetry={noopTODO} />
          )
        }
        ListFooterComponent={
          <View style={styles.addDevice}>
            {!connected &&
              products.status === 'success' &&
              items.length > 0 && (
                <View style={styles.footer}>
                  <FButton
                    title={t('home.products.seeMore')}
                    kind="ghost"
                    color="success"
                    size="m"
                    testID="see-more"
                    onPress={noopTODO}
                  />
                </View>
              )}
            <FButton
              width="block"
              onPress={() => navigation.navigate('AddDevice')}>
              <FButton.Icon icon={FOutlined.c_add} />
              <FButton.Label>{t('home.addDevice')}</FButton.Label>
            </FButton>
            <FButton
              width="block"
              kind="secondary"
              onPress={() => navigation.navigate('SimpleAddDevice')}>
              <FButton.Icon icon={FOutlined.device_connection} />
              <FButton.Label>{t('home.simpleAdd')}</FButton.Label>
            </FButton>
          </View>
        }
      />
      <NearbyDeviceSheet
        device={nearby.device}
        visible={nearby.visible}
        onClose={nearby.dismiss}
        onConnect={d =>
          navigation.navigate('WifiSetup', {modelId: d.modelId, device: d})
        }
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    content: {
      paddingHorizontal: tokens.space.md,
    },
    column: {
      justifyContent: 'space-between',
      gap: tokens.space.sm,
      marginBottom: tokens.space.sm,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: tokens.space.md,
    },
    addDevice: {
      marginHorizontal: tokens.space.md,
      marginTop: tokens.space.md,
      gap: tokens.spacing._2xs,
    },
  });
