<script setup lang="ts">
import type { TagSuggestion } from '~/types/post'

interface Props {
  modelValue: string[]
  suggestions?: TagSuggestion[]
  maxTags?: number
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  maxTags: 10,
})

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
}>()

const inputText = ref('')
const showDropdown = ref(false)

const filteredSuggestions = computed(() => {
  if (!inputText.value.trim()) return []
  const kw = inputText.value.toLowerCase()
  return props.suggestions
    .filter((s) => s.name.toLowerCase().includes(kw) && !props.modelValue.includes(s.name))
    .slice(0, 8)
})

const addTag = (tag: string) => {
  const trimmed = tag.trim()
  if (!trimmed) return
  if (props.modelValue.includes(trimmed)) return
  if (props.modelValue.length >= props.maxTags) return
  emit('update:modelValue', [...props.modelValue, trimmed])
  inputText.value = ''
  showDropdown.value = false
}

const removeTag = (index: number) => {
  const newTags = [...props.modelValue]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag(inputText.value)
  } else if (e.key === 'Backspace' && !inputText.value && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  }
}

const handleInput = () => {
  showDropdown.value = inputText.value.trim().length > 0
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}
</script>

<template>
  <div class="relative">
    <div
      class="flex min-h-[2.5rem] flex-wrap gap-1 rounded-md border border-gray-300 px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
    >
      <span
        v-for="(tag, index) in modelValue"
        :key="tag"
        class="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-sm text-blue-800"
      >
        {{ tag }}
        <button
          type="button"
          class="text-blue-600 hover:text-blue-800"
          @click="removeTag(index)"
        >
          ×
        </button>
      </span>
      <input
        v-if="modelValue.length < maxTags"
        v-model="inputText"
        type="text"
        placeholder="タグを入力"
        class="min-w-[6rem] flex-1 bg-transparent text-sm outline-none"
        @keydown="handleKeydown"
        @input="handleInput"
        @blur="handleBlur"
      />
    </div>
    <ul
      v-if="showDropdown && filteredSuggestions.length > 0"
      class="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
    >
      <li
        v-for="suggestion in filteredSuggestions"
        :key="suggestion.name"
        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
        @mousedown.prevent="addTag(suggestion.name)"
      >
        {{ suggestion.name }}
        <span class="ml-1 text-xs text-gray-400">{{ suggestion.count }}</span>
      </li>
    </ul>
    <p v-if="modelValue.length >= maxTags" class="mt-1 text-xs text-gray-400">
      タグは最大{{ maxTags }}件まで追加できます
    </p>
  </div>
</template>
