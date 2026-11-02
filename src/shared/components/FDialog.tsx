import React from 'react';
import {Dialog, Portal} from 'react-native-paper';
import FText from './FText';

interface DialogComponentProps {
  visible: boolean;
  onDismiss: () => void;
}

const FDialog: React.FC<DialogComponentProps> = ({visible, onDismiss}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Alert</Dialog.Title>
        <Dialog.Content>
          <FText typo="bodyText1">This is simple dialog</FText>
        </Dialog.Content>
        <Dialog.Actions>
          <FText typo="bodyText1">This is simple dialog</FText>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default FDialog;
