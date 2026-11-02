import React from 'react';
import renderer, {act} from 'react-test-renderer';
import i18next from '@/core/i18n';
import {ThemeProvider} from '@/core/theme';
import FSnackbar from '@/shared/components/FSnackbar';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-modal', () => {
  const React = require('react');
  const MockModal = ({children}: any) =>
    React.createElement('View', null, children);
  MockModal.default = MockModal;
  return MockModal;
});

jest.mock('react-native-paper', () => {
  const React = require('react');
  const view = ({children, style}: any) =>
    React.createElement('View', {style}, children);
  return {
    Snackbar: view,
  };
});

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
}));

describe('FSnackbar', () => {
  beforeEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('vi');
    });
  });

  it('renders default title based on type in Vietnamese', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="info"
            message="Nội dung thông báo"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });

    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Thông tin');
    expect(json).toContain('Nội dung thông báo');

    // Test success default title
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="success"
            message="Thao tác xong"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Thành công');

    // Test warning default title
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="warning"
            message="Lưu ý"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Cảnh báo');

    // Test fail default title
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="fail"
            message="Lỗi thao tác"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Thất bại');
  });

  it('renders default title based on type in English when language is en', async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="info"
            message="Data saved"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });

    let json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Information');
    expect(json).toContain('Data saved');

    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="success"
            message="Completed"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Success');

    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="warning"
            message="Check again"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Warning');

    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="fail"
            message="Network error"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });
    json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Failed');
  });

  it('renders custom title when provided', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="info"
            title="Custom Title Here"
            message="Custom message here"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Custom Title Here');
    expect(json).toContain('Custom message here');
  });

  it('hides title when showTitle is false', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="info"
            showTitle={false}
            message="Single line message without title"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).not.toContain('Thông tin');
    expect(json).toContain('Single line message without title');
  });

  it('translates message if a translation key is passed', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <FSnackbar
            visible={true}
            type="fail"
            message="common.error"
            onDismiss={jest.fn()}
          />
        </ThemeProvider>,
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Đã có lỗi xảy ra');
  });
});
