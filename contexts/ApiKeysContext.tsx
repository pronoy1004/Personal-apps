'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { ApiKeyEntry, ApiKeysData } from '@/lib/types';
import { loadApiKeysDataAsync, saveApiKeysData } from '@/lib/storage';
import {
  generateSalt,
  hashPasscode,
  deriveKey,
  encryptSecret,
  decryptSecret,
  bufferToBase64,
  base64ToBuffer,
} from '@/lib/utils/crypto';

export interface DecryptedApiKeyEntry extends Omit<ApiKeyEntry, 'key'> {
  decryptedKey: string;
}

interface ApiKeysContextValue {
  loading: boolean;
  authenticated: boolean;
  keys: DecryptedApiKeyEntry[];
  encryptedData: ApiKeysData | null;
  verifyPasscode(passcode: string): Promise<boolean>;
  setupPasscode(passcode: string): Promise<void>;
  addKey(entry: Omit<DecryptedApiKeyEntry, 'id' | 'createdAt' | 'updatedAt'> & { decryptedKey: string }): Promise<void>;
  updateKey(id: string, updates: Partial<Omit<DecryptedApiKeyEntry, 'id'>>): Promise<void>;
  deleteKey(id: string): Promise<void>;
  lock(): void;
}

const ApiKeysContext = createContext<ApiKeysContextValue | undefined>(undefined);

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [encryptedData, setEncryptedData] = useState<ApiKeysData | null>(null);
  const [keys, setKeys] = useState<DecryptedApiKeyEntry[]>([]);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await loadApiKeysDataAsync();
        if (mounted) {
          setEncryptedData(data);
        }
      } catch (error) {
        console.error('Failed to load API keys:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const authenticated = useMemo(() => !!cryptoKey, [cryptoKey]);

  const decryptEntries = async (entries: ApiKeyEntry[], key: CryptoKey): Promise<DecryptedApiKeyEntry[]> => {
    return Promise.all(entries.map(async (entry) => ({
      id: entry.id,
      name: entry.name,
      service: entry.service,
      decryptedKey: await decryptSecret(entry.key, key),
      expiry: entry.expiry,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })));
  };

  const persistData = async (data: ApiKeysData) => {
    setEncryptedData(data);
    await saveApiKeysData(data);
  };

  const verifyPasscode = async (passcode: string): Promise<boolean> => {
    if (!encryptedData?.passcodeHash || !encryptedData.passcodeSalt) {
      return false;
    }
    try {
      const salt = base64ToBuffer(encryptedData.passcodeSalt);
      const hashed = await hashPasscode(passcode, salt);
      if (hashed !== encryptedData.passcodeHash) {
        return false;
      }

      const key = await deriveKey(passcode, salt);
      const decrypted = await decryptEntries(encryptedData.keys || [], key);
      setCryptoKey(key);
      setKeys(decrypted);
      return true;
    } catch (error) {
      console.error('Failed to verify passcode:', error);
      return false;
    }
  };

  const setupPasscode = async (passcode: string) => {
    const salt = generateSalt();
    const saltBase64 = bufferToBase64(salt);
    const passcodeHash = await hashPasscode(passcode, salt);
    const key = await deriveKey(passcode, salt);

    const data: ApiKeysData = {
      passcodeHash,
      passcodeSalt: saltBase64,
      keys: [],
      lastModified: new Date().toISOString(),
    };

    await persistData(data);
    setCryptoKey(key);
    setKeys([]);
  };

  const requireKey = () => {
    if (!cryptoKey) {
      throw new Error('Not authenticated');
    }
    return cryptoKey;
  };

  const addKey: ApiKeysContextValue['addKey'] = async ({ name, service, decryptedKey, expiry }) => {
    const key = requireKey();
    if (!encryptedData) return;

    const encryptedValue = await encryptSecret(decryptedKey, key);
    const now = new Date().toISOString();
    const newEntry: ApiKeyEntry = {
      id: crypto.randomUUID(),
      name,
      service,
      key: encryptedValue,
      expiry,
      createdAt: now,
      updatedAt: now,
    };

    const updatedData: ApiKeysData = {
      ...encryptedData,
      keys: [...(encryptedData.keys || []), newEntry],
      lastModified: now,
    };

    await persistData(updatedData);
    setKeys([...keys, { ...newEntry, decryptedKey }]);
  };

  const updateKey: ApiKeysContextValue['updateKey'] = async (id, updates) => {
    const key = requireKey();
    if (!encryptedData) return;

    const existing = encryptedData.keys?.find((entry) => entry.id === id);
    if (!existing) {
      throw new Error('API key not found');
    }

    const decryptedExisting = keys.find((entry) => entry.id === id);
    const updatedDecryptedValue = updates.decryptedKey ?? decryptedExisting?.decryptedKey ?? '';
    const encryptedValue = await encryptSecret(updatedDecryptedValue, key);
    const now = new Date().toISOString();

    const updatedEntries = (encryptedData.keys || []).map((entry) =>
      entry.id === id
        ? {
            ...entry,
            name: updates.name ?? entry.name,
            service: updates.service ?? entry.service,
            expiry: updates.expiry ?? entry.expiry,
            key: encryptedValue,
            updatedAt: now,
          }
        : entry
    );

    const updatedData: ApiKeysData = {
      ...encryptedData,
      keys: updatedEntries,
      lastModified: now,
    };

    await persistData(updatedData);

    const updatedDecrypted = keys.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            name: updates.name ?? entry.name,
            service: updates.service ?? entry.service,
            expiry: updates.expiry ?? entry.expiry,
            decryptedKey: updatedDecryptedValue,
            updatedAt: now,
          }
        : entry
    );

    setKeys(updatedDecrypted);
  };

  const deleteKey: ApiKeysContextValue['deleteKey'] = async (id) => {
    if (!encryptedData) return;

    const updatedEntries = (encryptedData.keys || []).filter((entry) => entry.id !== id);
    const now = new Date().toISOString();
    const updatedData: ApiKeysData = {
      ...encryptedData,
      keys: updatedEntries,
      lastModified: now,
    };

    await persistData(updatedData);
    setKeys(keys.filter((entry) => entry.id !== id));
  };

  const lock = () => {
    setCryptoKey(null);
    setKeys([]);
  };

  const value: ApiKeysContextValue = {
    loading,
    authenticated,
    keys,
    encryptedData,
    verifyPasscode,
    setupPasscode,
    addKey,
    updateKey,
    deleteKey,
    lock,
  };

  return <ApiKeysContext.Provider value={value}>{children}</ApiKeysContext.Provider>;
}

export function useApiKeys() {
  const ctx = useContext(ApiKeysContext);
  if (!ctx) throw new Error('useApiKeys must be used within an ApiKeysProvider');
  return ctx;
}

