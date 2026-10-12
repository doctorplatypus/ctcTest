import { TouchpointRecord, SchemaFieldMapping } from '../../types';

/**
 * Default field mapping configuration.
 * Maps standard field candidates if custom mapping is not configured.
 */
export const DEFAULT_SCHEMA_MAPPING: SchemaFieldMapping = {
  customerIdField: 'customerId',
  journeyIdField: 'journeyId',
  touchpointIdField: 'touchpointId',
  channelField: 'channel',
  sequenceStepField: 'sequenceStep',
  timestampField: 'timestamp',
  convertedField: 'converted',
  conversionIdField: 'conversionId',
  revenueField: 'revenue',
  campaignField: 'campaign',
  typeField: 'type',
};

/**
 * Common alternative field names observed in marketing databases and customer data platforms.
 */
const FIELD_ALIASES: Record<keyof SchemaFieldMapping, string[]> = {
  customerIdField: ['customerId', 'customer_id', 'cust_id', 'userId', 'user_id', 'client_id', 'account_id', 'cid'],
  journeyIdField: ['journeyId', 'journey_id', 'session_id', 'sessionId', 'path_id', 'funnel_id'],
  touchpointIdField: ['touchpointId', 'touchpoint_id', 'id', 'event_id', 'interaction_id'],
  channelField: ['channel', 'channel_name', 'marketing_channel', 'source', 'utm_source', 'medium'],
  sequenceStepField: ['sequenceStep', 'sequence_step', 'touchpoint_sequence', 'step', 'position', 'seq_num', 'order', 'touch_number'],
  timestampField: ['timestamp', 'created_at', 'event_time', 'time', 'date', 'occurred_at'],
  convertedField: ['converted', 'is_converted', 'isConverted', 'has_converted', 'conversion', 'won'],
  conversionIdField: ['conversionId', 'conversion_id', 'order_id', 'transaction_id', 'deal_id'],
  revenueField: ['revenue', 'conversion_value', 'conversionValue', 'value', 'amount', 'deal_amount', 'order_value'],
  campaignField: ['campaign', 'campaign_name', 'campaignName', 'utm_campaign'],
  typeField: ['type', 'event_type', 'touchpoint_type', 'action', 'interaction_type'],
};

/**
 * Auto-detects the best field mapping from a sample raw document.
 */
export function detectSchemaMapping(sampleDoc: Record<string, any>): SchemaFieldMapping {
  const detected: Partial<SchemaFieldMapping> = {};
  const docKeys = Object.keys(sampleDoc);

  (Object.keys(FIELD_ALIASES) as (keyof SchemaFieldMapping)[]).forEach((mappingKey) => {
    const candidates = FIELD_ALIASES[mappingKey];
    const match = candidates.find((c) => docKeys.includes(c));
    detected[mappingKey] = match || DEFAULT_SCHEMA_MAPPING[mappingKey];
  });

  return detected as SchemaFieldMapping;
}

/**
 * Normalizes a raw Firestore record or object into a strict TouchpointRecord.
 */
export function normalizeFirestoreDoc(
  docId: string,
  raw: Record<string, any>,
  mapping: SchemaFieldMapping = DEFAULT_SCHEMA_MAPPING
): TouchpointRecord {
  // Helper to extract value using candidate fallbacks if primary mapping is missing
  const getField = (primaryField: string, aliases: string[], defaultValue: any) => {
    if (raw[primaryField] !== undefined && raw[primaryField] !== null) {
      return raw[primaryField];
    }
    for (const alias of aliases) {
      if (raw[alias] !== undefined && raw[alias] !== null) {
        return raw[alias];
      }
    }
    return defaultValue;
  };

  const customerId = String(
    getField(mapping.customerIdField, FIELD_ALIASES.customerIdField, 'unknown_customer')
  );

  const journeyId = String(
    getField(mapping.journeyIdField, FIELD_ALIASES.journeyIdField, `j_${customerId}`)
  );

  const touchpointId = String(
    getField(mapping.touchpointIdField, FIELD_ALIASES.touchpointIdField, docId)
  );

  const channel = String(
    getField(mapping.channelField, FIELD_ALIASES.channelField, 'Direct')
  );

  const rawSeq = getField(mapping.sequenceStepField, FIELD_ALIASES.sequenceStepField, 1);
  const sequenceStep = Math.max(1, parseInt(String(rawSeq), 10) || 1);

  // Normalize timestamp
  let timestampStr = new Date().toISOString();
  const rawTs = getField(mapping.timestampField, FIELD_ALIASES.timestampField, null);
  if (rawTs) {
    if (typeof rawTs.toDate === 'function') {
      // Firebase Timestamp object
      timestampStr = rawTs.toDate().toISOString();
    } else if (typeof rawTs === 'string') {
      timestampStr = new Date(rawTs).toISOString();
    } else if (typeof rawTs === 'number') {
      timestampStr = new Date(rawTs).toISOString();
    }
  }

  // Normalize revenue (handle numbers, strings with currency symbols or commas)
  const rawRev = getField(mapping.revenueField, FIELD_ALIASES.revenueField, 0);
  let revenue = 0;
  if (typeof rawRev === 'number') {
    revenue = Math.max(0, isNaN(rawRev) ? 0 : rawRev);
  } else if (typeof rawRev === 'string') {
    const cleaned = rawRev.replace(/[^0-9.-]+/g, '');
    revenue = Math.max(0, parseFloat(cleaned) || 0);
  }

  // Normalize converted boolean (explicit boolean OR inferred if revenue/conversion_value > 0)
  const rawConverted = getField(mapping.convertedField, FIELD_ALIASES.convertedField, false);
  const explicitConverted =
    rawConverted === true ||
    rawConverted === 'true' ||
    rawConverted === 1 ||
    rawConverted === '1' ||
    (typeof rawConverted === 'number' && rawConverted > 0);

  // If revenue/conversion_value is greater than 0, it represents a conversion event
  const converted = explicitConverted || revenue > 0;

  const conversionId = converted
    ? String(getField(mapping.conversionIdField, FIELD_ALIASES.conversionIdField, `conv_${journeyId}`))
    : undefined;

  const campaign = raw[mapping.campaignField] || raw.campaignName || raw.campaign;
  const type = raw[mapping.typeField] || raw.touchpointType || raw.type;
  const customerName = raw.customerName || raw.name || raw.customer;
  const segment = raw.segment;

  return {
    id: docId,
    customerId,
    customerName,
    journeyId,
    touchpointId,
    channel,
    sequenceStep,
    timestamp: timestampStr,
    converted,
    conversionId,
    revenue,
    campaign,
    type,
    segment,
  };
}
