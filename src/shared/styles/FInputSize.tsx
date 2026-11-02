export interface FInputSizeProps {
  height?: number;
  padding?: number;
  borderRadius?: number;
}

interface CustomInputSize {
  size48: FInputSizeProps;
  size56: FInputSizeProps;
}

const FInputSize: CustomInputSize = {
  size48: {
    height: 48,
    borderRadius: 999,
    padding: 16,
  },
  size56: {
    height: 56,
    borderRadius: 999,
    padding: 16,
  },
};

export default FInputSize;
