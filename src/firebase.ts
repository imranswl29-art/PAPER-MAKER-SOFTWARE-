import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserAccount } from './types/user';
import { GeneratedExamPaper } from './types/paper';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initialization
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
      return false;
    }
    // Expected if document doesn't exist, connection is alive
    return true;
  }
}

// Run non-blocking connection validation
testConnection().catch(() => {});

// ==========================================
// Accounts Cloud Persistence Operations
// ==========================================

export async function fetchAccountsFromFirestore(): Promise<UserAccount[]> {
  const collectionPath = 'accounts';
  try {
    const snap = await getDocs(collection(db, collectionPath));
    const list: UserAccount[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push(data as UserAccount);
    });
    return list;
  } catch (error) {
    console.warn('Failed to fetch accounts from Firestore:', error);
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

export async function saveAccountToFirestore(account: UserAccount): Promise<void> {
  const docPath = `accounts/${account.id}`;
  try {
    // Sanitize account object to ensure plain data
    const cleanAccount = JSON.parse(JSON.stringify(account));
    await setDoc(doc(db, 'accounts', account.id), cleanAccount);
  } catch (error) {
    console.error(`Failed to save account ${account.id} to Firestore:`, error);
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveAllAccountsToFirestore(accounts: UserAccount[]): Promise<void> {
  const collectionPath = 'accounts';
  try {
    const batch = writeBatch(db);
    for (const acc of accounts) {
      const cleanAcc = JSON.parse(JSON.stringify(acc));
      batch.set(doc(db, 'accounts', acc.id), cleanAcc);
    }
    await batch.commit();
  } catch (error) {
    console.error('Failed to batch save accounts to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}

export async function deleteAccountFromFirestore(accountId: string): Promise<void> {
  const docPath = `accounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'accounts', accountId));
  } catch (error) {
    console.error(`Failed to delete account ${accountId} from Firestore:`, error);
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==========================================
// Papers Cloud Persistence Operations
// ==========================================

export async function fetchPapersFromFirestore(userId?: string): Promise<GeneratedExamPaper[]> {
  const collectionPath = 'papers';
  try {
    let q = query(collection(db, collectionPath));
    if (userId) {
      q = query(collection(db, collectionPath), where('userId', '==', userId));
    }
    const snap = await getDocs(q);
    const list: GeneratedExamPaper[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push(data as GeneratedExamPaper);
    });
    // Sort descending by createdAt
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (error) {
    console.warn('Failed to fetch papers from Firestore:', error);
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

export async function savePaperToFirestore(paper: GeneratedExamPaper): Promise<void> {
  const docPath = `papers/${paper.id}`;
  try {
    const cleanPaper = JSON.parse(JSON.stringify(paper));
    await setDoc(doc(db, 'papers', paper.id), cleanPaper);
  } catch (error) {
    console.error(`Failed to save paper ${paper.id} to Firestore:`, error);
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePaperFromFirestore(paperId: string): Promise<void> {
  const docPath = `papers/${paperId}`;
  try {
    await deleteDoc(doc(db, 'papers', paperId));
  } catch (error) {
    console.error(`Failed to delete paper ${paperId} from Firestore:`, error);
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
