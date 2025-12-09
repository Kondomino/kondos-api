import { KondoTypes, KondoStatus } from '../../kondo/entities/kondo.entity';
import { boolean_columns } from '../types/boolean_columns';

const booleanFields = new Set(boolean_columns);
const numericFields = new Set(['lot_avg_price', 'condo_rent']);
const statusSet = new Set<string>(Object.values(KondoStatus));
const typeSet = new Set<string>(Object.values(KondoTypes));

const truthyValues = new Set(['1', 'true', 'yes', 'y', 'on', true, 1]);
const falsyValues = new Set(['0', 'false', 'no', 'n', 'off', false, 0]);

export function normalizeKondoField(field: string, value: any): any {
  // Drop empty strings/nullish to let defaults/nullable columns handle it
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  // Normalize strings (trim)
  if (typeof value === 'string') {
    value = value.trim();
    if (value === '') {
      return undefined;
    }
  }

  // Enums
  if (field === 'status') {
    return statusSet.has(String(value)) ? String(value) : undefined;
  }
  if (field === 'type') {
    return typeSet.has(String(value)) ? String(value) : undefined;
  }

  // Booleans
  if (booleanFields.has(field)) {
    const strVal = String(value).toLowerCase();
    if (truthyValues.has(value) || truthyValues.has(strVal)) return true;
    if (falsyValues.has(value) || falsyValues.has(strVal)) return false;
    return undefined;
  }

  // Numerics
  if (numericFields.has(field)) {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }

  // Default: return trimmed/unchanged
  return value;
}
