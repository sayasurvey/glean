<script setup lang="ts">
interface Props {
  modelValue: string
  activeTags: string[]
  availableTags: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:activeTags': [tags: string[]]
}>()

const toggleTag = (tag: string) => {
  const current = props.activeTags
  if (current.includes(tag)) {
    emit('update:activeTags', current.filter((t) => t !== tag))
  } else {
    emit('update:activeTags', [...current, tag])
  }
}
</script>

<template>
  <div>
    <!-- 検索入力 -->
    <div class="relative mb-3">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <input
        :value="modelValue"
        type="text"
        placeholder="タイトル・概要で検索"
        class="w-full rounded-md border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        @click="emit('update:modelValue', '')"
      >
        ×
      </button>
    </div>

    <!-- タグフィルタ -->
    <div v-if="availableTags.length > 0" class="flex flex-wrap gap-2">
      <button
        v-for="tag in availableTags"
        :key="tag"
        type="button"
        class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
        :class="
          activeTags.includes(tag)
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </button>
    </div>
  </div>
</template>
