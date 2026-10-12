import {
  collection,
  getDocs,
  query,
  limit,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { TouchpointRecord, SchemaFieldMapping, ConnectionStatus } from '../../types';
import { getFirestoreInstance } from './client';
import { normalizeFirestoreDoc, DEFAULT_SCHEMA_MAPPING } from '../analytics/schemaMapping';
import { DEMO_TOUCHPOINTS } from './demoData';

export interface LoadTouchpointsResult {
  records: TouchpointRecord[];
  status: ConnectionStatus;
  isDemoData: boolean;
  rawSampleDoc?: Record<string, any>;
  errorMessage?: string;
  collectionName: string;
}

/** Streams a CSV file and writes its rows to Firestore in safe batches. */
export async function uploadCsvToFirestore(
  file: File,
  onProgress: (uploaded: number) => void
): Promise<number> {
  const { db, isConfigured, collectionName } = getFirestoreInstance();
  if (!isConfigured || !db) throw new Error('Configure a Firebase project before uploading CSV data.');
  if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Choose a .csv file.');

  const reader = file.stream().getReader();
  const decoder = new TextDecoder();
  const headers: string[] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let firstCharacter = true;
  let uploaded = 0;
  let batch = writeBatch(db);
  let batchSize = 0;

  const saveRow = async () => {
    if (headers.length === 0) {
      headers.push(...row.map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim()));
    } else if (row.some((value) => value.trim() !== '')) {
      const data: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header) data[header] = row[index] ?? '';
      });
      batch.set(doc(collection(db, collectionName)), data);
      batchSize += 1;
      uploaded += 1;
      if (batchSize >= 450) {
        await batch.commit();
        onProgress(uploaded);
        batch = writeBatch(db);
        batchSize = 0;
      }
    }
    row = [];
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true });
      for (let i = 0; i < chunk.length; i += 1) {
        const char = chunk[i];
        if (firstCharacter) {
          firstCharacter = false;
          if (char === '\uFEFF') continue;
        }
        if (quoted) {
          if (char === '"' && chunk[i + 1] === '"') { field += '"'; i += 1; }
          else if (char === '"') quoted = false;
          else field += char;
        } else if (char === '"' && field.length === 0) quoted = true;
        else if (char === ',') { row.push(field); field = ''; }
        else if (char === '\n' || char === '\r') {
          row.push(field); field = '';
          if (char === '\r' && chunk[i + 1] === '\n') i += 1;
          await saveRow();
        } else field += char;
      }
      if (done) break;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); await saveRow(); }
    if (headers.length === 0) throw new Error('The CSV file is empty or has no header row.');
    if (batchSize > 0) await batch.commit();
    onProgress(uploaded);
    return uploaded;
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
}

/**
 * Loads touchpoints from either live Firestore or the isolated demo dataset.
 * Guarantees honest status reporting and never silently substitutes fake data for production data.
 */
export async function loadTouchpoints(
  mode: 'live_firestore' | 'demo_data',
  schemaMapping: SchemaFieldMapping = DEFAULT_SCHEMA_MAPPING,
  queryLimit: number = 250
): Promise<LoadTouchpointsResult> {
  const { db, isConfigured, collectionName } = getFirestoreInstance();

  // If user explicitly requested Demo Mode
  if (mode === 'demo_data') {
    return {
      records: DEMO_TOUCHPOINTS,
      status: 'demo_mode',
      isDemoData: true,
      collectionName: 'demo_dataset',
    };
  }

  // Live Firestore requested: check configuration
  if (!isConfigured || !db) {
    return {
      records: [],
      status: 'configuration_required',
      isDemoData: false,
      errorMessage: 'Firestore project credentials not yet configured in environment or settings.',
      collectionName,
    };
  }

  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(queryLimit));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        records: [],
        status: 'empty',
        isDemoData: false,
        collectionName,
      };
    }

    const rawDocs = snapshot.docs.map((d) => ({
      id: d.id,
      data: d.data(),
    }));

    const sampleRaw = rawDocs[0]?.data;

    const normalizedRecords = rawDocs.map(({ id, data }) =>
      normalizeFirestoreDoc(id, data, schemaMapping)
    );

    return {
      records: normalizedRecords,
      status: 'connected',
      isDemoData: false,
      rawSampleDoc: sampleRaw,
      collectionName,
    };
  } catch (err: any) {
    const isPermissionDenied =
      err?.code === 'permission-denied' ||
      String(err?.message || '').toLowerCase().includes('permission');

    const cleanErrorMsg = isPermissionDenied
      ? `Missing or insufficient permissions on collection '${collectionName}'. Update your Firestore security rules (allow read: if true;) or switch to Demo Mode.`
      : err?.message || 'Failed to connect or fetch from Firestore.';

    console.warn(`Firestore read notice [${collectionName}]:`, cleanErrorMsg);

    return {
      records: [],
      status: 'error',
      isDemoData: false,
      errorMessage: cleanErrorMsg,
      collectionName,
    };
  }
}

/**
 * Adds a new touchpoint record to Firestore or demo dataset.
 */
export async function createTouchpointDoc(
  record: Omit<TouchpointRecord, 'id'>,
  mode: 'live_firestore' | 'demo_data'
): Promise<TouchpointRecord> {
  const { db, isConfigured, collectionName } = getFirestoreInstance();

  if (mode === 'live_firestore' && isConfigured && db) {
    const docRef = await addDoc(collection(db, collectionName), {
      ...record,
    });
    return {
      ...record,
      id: docRef.id,
    };
  }

  // Fallback demo local ID
  return {
    ...record,
    id: `local_${Date.now()}`,
  };
}

/**
 * Deletes a touchpoint record from Firestore.
 */
export async function deleteTouchpointDoc(
  id: string,
  mode: 'live_firestore' | 'demo_data'
): Promise<void> {
  const { db, isConfigured, collectionName } = getFirestoreInstance();

  if (mode === 'live_firestore' && isConfigured && db && !id.startsWith('local_') && !id.startsWith('demo_')) {
    await deleteDoc(doc(db, collectionName, id));
  }
}
