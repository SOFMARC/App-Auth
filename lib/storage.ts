import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Armazenamento seguro para dados sensíveis (token JWT)
async function setSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return sessionStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeSecure(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// Armazenamento normal para dados não sensíveis (configurações)
async function setItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const storage = {
  setSecure,
  getSecure,
  removeSecure,
  setItem,
  getItem,
  removeItem,
};

// Chaves de armazenamento
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'iam_auth_token',
  AUTH_EXPIRES: 'iam_auth_expires',
  AUTH_USER: 'iam_auth_user',
  AUTH_COMPANIES: 'iam_auth_companies',
  AUTH_ACCESS: 'iam_auth_access',
  API_BASE_URL: 'iam_api_base_url',
} as const;

export const DEFAULT_API_URL = 'https://auth.cndtax.com.br';
