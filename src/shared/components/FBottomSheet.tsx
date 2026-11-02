import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import {BackHandler, StyleSheet} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import {ColorsProps, useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';

export type FBottomSheetRef = BottomSheetModal<any>;

export interface FBottomSheetProps extends BottomSheetModalProps {
  onClose?: () => void;
}

const FBottomSheet = forwardRef<FBottomSheetRef, FBottomSheetProps>(
  (
    {
      onClose,
      onDismiss,
      enablePanDownToClose = true,
      enableDynamicSizing = true,
      backdropComponent,
      backgroundStyle,
      handleIndicatorStyle,
      onChange,
      children,
      ...props
    },
    ref,
  ) => {
    const {theme} = useTheme();
    const {colors} = theme;
    const styles = createStyles(colors);
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = useCallback<
      NonNullable<BottomSheetModalProps['onChange']>
    >(
      (index, position, type) => {
        setIsOpen(index >= 0);
        onChange?.(index, position, type);
      },
      [onChange],
    );

    const handleDismiss = useCallback(() => {
      setIsOpen(false);
      onClose?.();
      onDismiss?.();
    }, [onClose, onDismiss]);

    useEffect(() => {
      if (!isOpen) {
        return;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        (ref as React.RefObject<FBottomSheetRef | null>).current?.dismiss();
        return true;
      });
      return () => sub.remove();
    }, [isOpen, ref]);

    const renderBackdrop = useCallback(
      (p: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...p}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.8}
          pressBehavior="close"
          style={styles.backdrop}
        />
      ),
      [styles],
    );

    return (
      <BottomSheetModal
        ref={ref}
        {...props}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        backgroundStyle={[styles.background, backgroundStyle]}
        handleIndicatorStyle={[styles.indicator, handleIndicatorStyle]}
        backdropComponent={backdropComponent ?? renderBackdrop}
        onChange={handleChange}
        onDismiss={handleDismiss}>
        {/* dynamic sizing only measures content inside BottomSheetView; a plain
            View child never reports a height, so the sheet never opens */}
        {enableDynamicSizing ? (
          <BottomSheetView>{children as React.ReactNode}</BottomSheetView>
        ) : (
          children
        )}
      </BottomSheetModal>
    );
  },
);

export default FBottomSheet;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: colors.title,
    },
    background: {
      backgroundColor: colors.white,
      borderRadius: tokens.borderRadius.big,
    },
    indicator: {
      width: 40,
      height: 4,
      backgroundColor: colors.bgDarkBase,
      borderRadius: tokens.borderRadius.full,
    },
  });
