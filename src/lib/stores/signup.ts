// src/lib/stores/signup.ts
// Persists signup form data across the multi-step flow in memory.
import { writable } from 'svelte/store';

export interface SignupData {
  accountType: string;
  email: string; password: string;
  firstName: string; lastName: string;
  dateOfBirth: string; phone: string; ssn: string;
  street: string; apartment: string; city: string; state: string; zip: string;
}

const empty: SignupData = {
  accountType: '', email: '', password: '',
  firstName: '', lastName: '', dateOfBirth: '', phone: '', ssn: '',
  street: '', apartment: '', city: '', state: '', zip: '',
};

function createSignupStore() {
  const { subscribe, update, set } = writable<SignupData>({ ...empty });
  return {
    subscribe,
    save: (partial: Partial<SignupData>) => update((s) => ({ ...s, ...partial })),
    reset: () => set({ ...empty }),
  };
}

export const signup = createSignupStore();
