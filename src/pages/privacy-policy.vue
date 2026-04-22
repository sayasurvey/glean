<template>
  <div class="flex min-h-screen flex-col bg-paper px-4 py-10">
    <div class="mx-auto w-full max-w-2xl">
      <div class="mb-6">
        <button
          class="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
          @click="router.back()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span>戻る</span>
        </button>
        <h1 class="mt-4 text-2xl font-bold text-ink">プライバシーポリシー</h1>
        <p class="mt-1 text-xs text-ink-3">制定日：2026年4月22日</p>
      </div>

      <div class="rounded-2xl border border-rule bg-white p-6 shadow-[var(--shadow-hover)] sm:p-8 space-y-6">
        <p class="text-sm text-ink-2 leading-relaxed">
          本プライバシーポリシー（以下「本ポリシー」）は、myGlean（以下「本サービス」）における
          ユーザーの個人情報の取り扱いについて定めるものです。
        </p>

        <PolicySection title="第1条（収集する情報）">
          <p class="text-sm text-ink-2 leading-relaxed">本サービスは、以下の情報を収集します。</p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>メールアドレス（アカウント登録時）</li>
            <li>パスワード（Firebase Authentication により暗号化して管理）</li>
            <li>ユーザーが登録した記事URLおよびタグ情報等のデータ</li>
          </ul>
        </PolicySection>

        <PolicySection title="第2条（情報の利用目的）">
          <p class="text-sm text-ink-2 leading-relaxed">収集した情報は、以下の目的に限り使用します。</p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>本サービスのアカウント認証および提供</li>
            <li>ユーザーが登録したデータの表示・管理</li>
            <li>Gemini API を用いた記事概要の自動生成</li>
            <li>サービスの不具合対応・改善</li>
          </ul>
        </PolicySection>

        <PolicySection title="第3条（第三者提供）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
          </p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>ユーザーご本人の同意がある場合</li>
            <li>法令に基づき開示が必要な場合</li>
          </ul>
        </PolicySection>

        <PolicySection title="第4条（利用するサービス）">
          <p class="text-sm text-ink-2 leading-relaxed">本サービスは、以下の外部サービスを利用しています。各サービスのプライバシーポリシーもあわせてご確認ください。</p>
          <ul class="mt-2 text-sm text-ink-2 space-y-2 pl-5 list-disc">
            <li>
              Google Firebase（認証・データベース）<br>
              <span class="text-xs text-ink-3">Google LLC が提供するクラウドサービス</span>
            </li>
            <li>
              Google Gemini API（記事概要生成）<br>
              <span class="text-xs text-ink-3">Google LLC が提供する生成 AI サービス</span>
            </li>
            <li>
              AWS CloudFront / S3（ホスティング）<br>
              <span class="text-xs text-ink-3">Amazon Web Services, Inc. が提供するクラウドサービス</span>
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="第5条（データの保管と削除）">
          <p class="text-sm text-ink-2 leading-relaxed">
            ユーザーのデータは Google Firebase（Firestore）上に保管されます。
            ユーザーはアカウントを削除することで、登録データの削除を申請できます。
            ただし、サービスの都合により予告なくデータが削除される場合があります（詳細は利用規約をご確認ください）。
          </p>
        </PolicySection>

        <PolicySection title="第6条（Cookieの使用）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスは、Firebase Authentication のセッション管理のために Cookie を使用します。
            ブラウザの設定により Cookie を無効にすることができますが、その場合は本サービスの一部機能が利用できなくなる場合があります。
          </p>
        </PolicySection>

        <PolicySection title="第7条（セキュリティ）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスは、ユーザーの情報を適切に管理するために合理的なセキュリティ対策を講じています。
            ただし、インターネット上での情報送受信において完全なセキュリティを保証することはできません。
          </p>
        </PolicySection>

        <PolicySection title="第8条（お問い合わせ）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービス、本ポリシーに関するお問い合わせは、X（旧Twitter）のDMよりご連絡ください。<br>
            <a href="https://x.com/Runteq_sayaka" target="_blank" rel="noopener noreferrer" class="text-brand-700 hover:text-brand-800 hover:underline transition-colors">@Runteq_sayaka</a>
          </p>
        </PolicySection>

        <PolicySection title="第9条（ポリシーの変更）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本ポリシーの内容は、予告なく変更することがあります。
            変更後のポリシーは本ページに掲載された時点で効力を生じるものとします。
          </p>
        </PolicySection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, ssr: false })

const router = useRouter()

const PolicySection = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('section', { class: 'space-y-1' }, [
      h('h2', { class: 'text-sm font-semibold text-ink border-b border-rule pb-1' }, props.title),
      slots.default?.(),
    ])
  },
})
</script>
