import type { Timestamp } from 'firebase/firestore'

export interface Post {
  id: string
  uid: string
  url: string
  title: string
  description: string
  ogpImageUrl: string | null
  tags: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type CreatePostInput = Pick<Post, 'url' | 'title' | 'description' | 'ogpImageUrl' | 'tags'>

export interface OgpData {
  title: string
  description: string
  imageUrl: string | null
  siteName: string | null
}

export interface GeminiSummaryData {
  summary: string
  suggestedTags: string[]
}

export interface PostErrorMap {
  [errorCode: string]: string
}

export interface TagSuggestion {
  name: string
  count: number
}
