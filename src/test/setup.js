import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Never initialise real Firebase in unit tests (no API key, no network).
vi.mock('../firebase/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));
