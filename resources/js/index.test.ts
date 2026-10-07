import { expect, test } from 'vite-plus/test';
import * as connector from './index';

test('hello world: loads the empty frontend entry point', () => {
    expect(Object.keys(connector)).toEqual([]);
});
