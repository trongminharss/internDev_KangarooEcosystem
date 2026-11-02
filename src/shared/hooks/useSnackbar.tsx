import React, {createContext, useContext, ReactNode, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FSnackbar, {FSnackbarEmphasis, FSnackbarType} from '../components/FSnackbar';

export interface useSnackbarProps {
  type?: FSnackbarType;
  emphasis?: FSnackbarEmphasis;
  title?: string;
  showTitle?: boolean;
  icon?: string;
  duration?: number;
  paddingTop?: number;
}

interface useSnackbarContextProps {
  showSnackbar: (message: string, options?: useSnackbarProps) => void;
  hideSnackbar: () => void;
}

const useSnackbarContext = createContext<useSnackbarContextProps | undefined>(
  undefined,
);

export const FSnackbarProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<useSnackbarProps | undefined>(
    undefined,
  );

  const showSnackbar = (msg: string, opts?: useSnackbarProps) => {
    setMessage(msg);
    setOptions(opts);
    setVisible(true);
  };

  const hideSnackbar = () => {
    setVisible(false);
  };

  return (
    <useSnackbarContext.Provider
      value={{showSnackbar: showSnackbar, hideSnackbar: hideSnackbar}}>
      {children}
      <FSnackbar
        visible={visible}
        message={message}
        title={options?.title}
        showTitle={options?.showTitle}
        icon={options?.icon}
        type={options?.type ?? 'fail'}
        emphasis={options?.emphasis ?? 'low'}
        duration={options?.duration}
        onDismiss={hideSnackbar}
        paddingTop={options?.paddingTop ?? insets.top}
      />
    </useSnackbarContext.Provider>
  );
};

export const useFSnackbar = () => {
  const context = useContext(useSnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

