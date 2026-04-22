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
        <h1 class="mt-4 text-2xl font-bold text-ink">利用規約</h1>
        <p class="mt-1 text-xs text-ink-3">制定日：2026年4月22日</p>
      </div>

      <div class="rounded-2xl border border-rule bg-white p-6 shadow-[var(--shadow-hover)] sm:p-8 space-y-6">
        <p class="text-sm text-ink-2 leading-relaxed">
          本利用規約（以下「本規約」）は、myGlean（以下「本サービス」）の利用条件を定めるものです。
          本サービスを利用された場合、本規約に同意したものとみなします。
        </p>

        <div class="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p class="text-sm text-amber-800">
            本サービスはAIを使用して作成されており、個人が試験的に運営するサービスです。
            予告なくサービスを終了・データを削除する場合があります。重要なデータのバックアップは各自で行ってください。
          </p>
        </div>

        <TermsSection title="第1条（適用）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本規約は、本サービスの利用に関して、ユーザーと運営者との間に適用されます。
            本サービスを利用した場合、本規約の全条項に同意したものとみなします。
          </p>
        </TermsSection>

        <TermsSection title="第2条（AIによる作成）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスは、AIツールを活用して作成・開発されております。
            AIによる生成物を含む性質上、予期しない動作・不具合が発生する可能性があることをご了承ください。
          </p>
        </TermsSection>

        <TermsSection title="第3条（利用登録）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスの利用にはメールアドレスとパスワード、またはGoogleアカウントによるアカウント登録が必要です。
            登録情報は正確・最新の状態を維持してください。
            虚偽の情報による登録が判明した場合、予告なくアカウントを削除することがあります。
          </p>
        </TermsSection>

        <TermsSection title="第4条（禁止事項）">
          <p class="text-sm text-ink-2 leading-relaxed">ユーザーは以下の行為を行ってはなりません。</p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>法令または公序良俗に反する行為</li>
            <li>本サービスのサーバー・ネットワークに過度な負荷をかける行為</li>
            <li>他のユーザーまたは第三者の権利・利益を侵害する行為</li>
            <li>本サービスの運営を妨げる行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </TermsSection>

        <TermsSection title="第5条（サービスの終了）">
          <p class="text-sm text-ink-2 leading-relaxed">
            運営者は、以下の場合を含む理由により、<strong class="font-semibold text-ink">予告なく本サービスを終了することがあります</strong>。
            サービス終了に際してユーザーへの補償・通知義務は負いません。
          </p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>運営者の都合によるサービス停止・終了</li>
            <li>技術的な問題によるサービス継続困難</li>
            <li>法令・規制への対応</li>
            <li>その他、運営者が必要と判断した場合</li>
          </ul>
        </TermsSection>

        <TermsSection title="第6条（登録データの削除）">
          <p class="text-sm text-ink-2 leading-relaxed">
            運営者は、以下の場合に<strong class="font-semibold text-ink">予告なくユーザーの登録データを削除することがあります</strong>。
            データ削除に際して運営者はいかなる補償も行いません。
            重要なデータは各自でバックアップを取ることを強く推奨します。
          </p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>サービス終了時</li>
            <li>長期間ログインのないアカウントのデータ整理</li>
            <li>ストレージ容量等の技術的な都合</li>
            <li>禁止事項に違反したアカウントへの対応</li>
            <li>その他、運営者が必要と判断した場合</li>
          </ul>
        </TermsSection>

        <TermsSection title="第7条（免責事項）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスに関して、<strong class="font-semibold text-ink">いかなる内容においても運営者は一切の責任を負いません</strong>。
            これには以下を含みますが、これらに限りません。
          </p>
          <ul class="mt-2 text-sm text-ink-2 space-y-1 pl-5 list-disc">
            <li>本サービスの中断・停止・終了によって生じた損害</li>
            <li>登録データの紛失・破損・削除によって生じた損害</li>
            <li>本サービスの利用によって生じた直接的・間接的な損害</li>
            <li>本サービスの不具合・誤作動によって生じた損害</li>
            <li>セキュリティ上の問題によって生じた損害</li>
            <li>ユーザー間またはユーザーと第三者との間で生じたトラブル</li>
          </ul>
        </TermsSection>

        <TermsSection title="第8条（知的財産権）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本サービスに含まれるコンテンツ・デザイン・プログラム等の知的財産権は、運営者または正当な権利者に帰属します。
            ユーザーが本サービスに登録したデータの権利はユーザーに帰属します。
          </p>
        </TermsSection>

        <TermsSection title="第9条（規約の変更）">
          <p class="text-sm text-ink-2 leading-relaxed">
            運営者は、必要に応じて本規約を変更することがあります。
            変更後の規約は本ページに掲載された時点で効力を生じ、継続して本サービスを利用した場合は変更に同意したものとみなします。
          </p>
        </TermsSection>

        <TermsSection title="第10条（準拠法）">
          <p class="text-sm text-ink-2 leading-relaxed">
            本規約の解釈は日本法に準拠するものとします。
          </p>
        </TermsSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, ssr: false })

const router = useRouter()

const TermsSection = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('section', { class: 'space-y-1' }, [
      h('h2', { class: 'text-sm font-semibold text-ink border-b border-rule pb-1' }, props.title),
      slots.default?.(),
    ])
  },
})
</script>
