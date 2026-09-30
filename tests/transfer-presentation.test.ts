import {describe,it,expect} from 'vitest';
import {positiveAmount,formatVnd} from '../apps/web/lib/money';
describe('transfer money presentation',()=>{
  it.each(['0','0.00','-1','NaN','Infinity','1e3','1.001','100000000000000000'])('rejects invalid amount %s',value=>expect(positiveAmount(value)).toBeNull());
  it('preserves cents and NUMERIC(19,2) maximum exactly',()=>{
    expect(positiveAmount('99999999999999999.99')).toBe('99999999999999999.99');
    expect(formatVnd('99999999999999999.99')).toBe('99.999.999.999.999.999,99 ₫');
    expect(positiveAmount('0,01')).toBe('0.01');
    expect(positiveAmount('1250000,50')).toBe('1250000.50');
    expect(formatVnd('1250000.50')).toBe('1.250.000,50 ₫');
    expect(formatVnd('-0.50')).toBe('-0,50 ₫');
  });
});
