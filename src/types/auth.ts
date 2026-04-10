import type { Timestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  provider: 'google' | 'email'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AuthErrorMap {
  [firebaseErrorCode: string]: string
}

export type { User }
