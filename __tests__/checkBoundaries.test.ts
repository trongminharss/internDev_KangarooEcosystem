import path from 'path';
import {checkBoundaries, resolveTarget} from '../scripts/check-boundaries';

const FIXTURES = path.join(__dirname, '..', 'scripts', '__fixtures__', 'src');

describe('check-boundaries', () => {
  it('flags each kind of boundary violation', () => {
    const violations = checkBoundaries(FIXTURES);
    const filesByRule = (rule: string) =>
      violations.filter(v => v.rule === rule).map(v => v.file).sort();

    expect(filesByRule('B1')).toEqual([
      'features/demo/domain/Bad.ts',
      'features/demo/domain/BadCoreApi.ts',
      'features/demo/domain/BadCrossFeature.ts',
    ]);
    expect(filesByRule('B2')).toEqual([
      'features/demo/data/BadDataToPresentation.ts',
      'features/demo/data/datasources/BadNotDataSource.ts',
    ]);
    expect(filesByRule('B3')).toEqual([
      'features/demo/presentation/BadAxiosClient.ts',
      'features/demo/presentation/BadToData.ts',
    ]);
    expect(filesByRule('B4')).toEqual(['features/demo/index.ts']);
    expect(violations).toHaveLength(8);
  });

  it('resolves @/ alias specifiers relative to the scanned root', () => {
    expect(
      resolveTarget(
        '/root',
        '/root/features/a/presentation/x.ts',
        '@/features/a/data/models/m',
      ),
    ).toEqual(['features', 'a', 'data', 'models', 'm']);
    expect(resolveTarget('/root', '/root/a.ts', 'axios')).toBeNull();
  });

  it('does not flag valid files', () => {
    const violations = checkBoundaries(FIXTURES).filter(
      v =>
        v.file === 'features/demo/domain/Good.ts' ||
        v.file === 'features/demo/data/datasources/GoodRemoteDataSource.ts',
    );
    expect(violations).toHaveLength(0);
  });
});
