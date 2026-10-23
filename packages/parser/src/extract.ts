/**
 * extractShipment — نقطة الدخول الرئيسية: رسالة واحدة → كل الحقول الخمسة.
 */
import { ShipmentFields } from './types';
import { ExtractContext, buildContext } from './context';
import { extractPhonesCore } from './fields/phones';
import { extractGovernorateCore } from './fields/governorate';
import { extractAmountCore } from './fields/amount';
import { extractNameCore } from './fields/name';
import { extractAddressCore } from './fields/address';

export function extractShipment(rawText: string): ShipmentFields {
  const ctx: ExtractContext = buildContext(rawText ?? '');
  return {
    name: extractNameCore(ctx),
    phones: extractPhonesCore(ctx.n).field,
    governorate: extractGovernorateCore(ctx),
    address: extractAddressCore(ctx),
    amount: extractAmountCore(ctx.n, ctx.phones),
  };
}
