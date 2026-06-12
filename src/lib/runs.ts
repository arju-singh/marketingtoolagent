"use client";

// Firestore persistence for generation runs, scoped per signed-in user:
//   users/{uid}/runs/{runId}
// All functions no-op (return null/[]) when Firebase isn't configured.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { ProductContext, Deliverable } from "./types";

export interface SavedRun {
  id: string;
  productName: string;
  oneLiner: string;
  createdAt: number;
  context: ProductContext;
  deliverables: Deliverable[];
}

export async function saveRun(
  uid: string,
  context: ProductContext,
  deliverables: Deliverable[]
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  await setDoc(doc(db, "users", uid, "runs", id), {
    id,
    productName: context.summary.productName,
    oneLiner: context.summary.oneLiner,
    createdAt: Date.now(),
    serverCreatedAt: serverTimestamp(),
    context,
    deliverables,
  });
  return id;
}

export async function listRuns(uid: string): Promise<SavedRun[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(collection(db, "users", uid, "runs"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SavedRun);
}

export async function getRun(uid: string, id: string): Promise<SavedRun | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid, "runs", id));
  return snap.exists() ? (snap.data() as SavedRun) : null;
}
