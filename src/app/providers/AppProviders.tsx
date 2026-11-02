import React, {ReactNode} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider as ReduxProvider} from 'react-redux';
import {PaperProvider} from 'react-native-paper';
import {MenuProvider} from 'react-native-popup-menu';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

import {store} from '@/app/store';
import {FSnackbarProvider} from '@/shared/hooks/useSnackbar';
import {ThemeProvider, useTheme} from '@/core/theme';
import {buildPaperTheme} from '@/core/theme/paperTheme';

export interface AppProvidersProps {
  children: ReactNode;
}

const ThemedPaperProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const {theme} = useTheme();
  return <PaperProvider theme={buildPaperTheme(theme)}>{children}</PaperProvider>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({children}) => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <ReduxProvider store={store}>
          <ThemeProvider>
            <MenuProvider>
              <ThemedPaperProvider>
                <FSnackbarProvider>{children}</FSnackbarProvider>
              </ThemedPaperProvider>
            </MenuProvider>
          </ThemeProvider>
        </ReduxProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default AppProviders;
