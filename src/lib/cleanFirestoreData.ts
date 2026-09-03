/**
 * Recursively removes any undefined values from Firestore payloads (objects & arrays),
 * preventing "Unsupported field value: undefined" errors in setDoc/updateDoc.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as any;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      result[key] = cleanFirestoreData(val);
    }
  }
  return result as T;
}
