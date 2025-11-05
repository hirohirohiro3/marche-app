// src/__mocks__/firebase.ts
import { vi } from 'vitest';

export const auth = {
  // You can add mock properties or methods if needed by your tests
  onAuthStateChanged: vi.fn(),
};

export const db = {
  // Mock Firestore instance
};

// Mock other exports from the original firebase.ts if they are used in tests
