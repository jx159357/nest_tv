<template>
  <NavigationLayout>
    <div class="space-y-8">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">偏好设置</h1>
          <p class="mt-2 text-sm text-gray-600">在这里维护你的公开资料与推荐偏好，让推荐结果更贴近你的真实兴趣。</p>
        </div>
        <router-link
          :to="{ name: 'recommendations', query: { focus: 'profile' } }"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          查看推荐画像
        </router-link>
      </header>

      <section
        v-if="hasUnsavedChanges"
        class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
      >
        你有尚未保存的更改。离开页面或刷新前，建议先保存。
      </section>

      <InlineNotice
        v-if="notice"
        :type="notice.type"
        :title="notice.title"
        :message="notice.message"
        dismissible
        @dismiss="clearNotice"
      />

      <div class="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <section class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">公开资料</h2>
              <p class="mt-2 text-sm text-gray-600">这些信息会影响页面上的个人展示和部分推荐文案。</p>
            </div>
          </div>

          <div v-if="loading" class="py-8 text-center">
            <LoadingSpinner text="加载中..." />
          </div>

          <div v-else class="mt-6 space-y-5">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-gray-700">昵称</span>
              <input v-model="form.nickname" type="text" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="给自己一个更容易识别的昵称" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-gray-700">手机号</span>
              <input v-model="form.phone" type="text" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="用于找回或联系（选填）" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-gray-700">头像链接</span>
              <input v-model="form.avatar" type="text" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="https://example.com/avatar.png" />
            </label>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="text-sm font-medium text-gray-700">头像预览</div>
              <div class="mt-3 flex items-center gap-4">
                <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                  <img
                    v-if="avatarPreviewUrl && !avatarPreviewError"
                    :src="avatarPreviewUrl"
                    alt="avatar-preview"
                    class="h-full w-full object-cover"
                    @error="avatarPreviewError = true"
                  />
                  <span v-else class="text-sm text-slate-400">暂无预览</span>
                </div>
                <div class="text-sm text-slate-500">
                  <p>建议使用可公开访问的 `http` / `https` 图片地址。</p>
                  <p v-if="avatarValidationMessage" class="mt-1 text-red-600">{{ avatarValidationMessage }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold text-gray-900">推荐偏好</h2>
          <p class="mt-2 text-sm text-gray-600">显式告诉系统你偏好什么、排斥什么，以及希望推荐更偏“新”还是更偏“经典”。</p>

          <div v-if="loading" class="py-8 text-center">
            <LoadingSpinner text="加载中..." />
          </div>

          <div v-else class="mt-6 space-y-6">
            <div>
              <div class="text-sm font-medium text-gray-700">偏好类型</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="option in typeOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  :class="isSelected(form.recommendationSettings.preferredTypes, option.value) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                  @click="toggleItem(form.recommendationSettings.preferredTypes, option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div>
              <div class="text-sm font-medium text-gray-700">偏好标签</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="genre in genreOptions"
                  :key="`preferred-${genre}`"
                  type="button"
                  class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  :class="isSelected(form.recommendationSettings.preferredGenres, genre) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                  @click="toggleItem(form.recommendationSettings.preferredGenres, genre)"
                >
                  {{ genre }}
                </button>
              </div>
            </div>

            <div>
              <div class="text-sm font-medium text-gray-700">排除标签</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="genre in genreOptions"
                  :key="`excluded-${genre}`"
                  type="button"
                  class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  :class="isSelected(form.recommendationSettings.excludedGenres, genre) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                  @click="toggleItem(form.recommendationSettings.excludedGenres, genre)"
                >
                  {{ genre }}
                </button>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-medium text-gray-700">偏好关键词</div>
                <button
                  v-if="recentSearches.length > 0"
                  type="button"
                  class="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  @click="applyRecentSearchKeywords"
                >
                  一键使用最近搜索
                </button>
              </div>
              <input
                v-model="keywordInput"
                type="text"
                class="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="输入关键词，用逗号分隔，例如：沙丘, 科幻, 悬疑"
              />
              <div v-if="recentSearches.length > 0" class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="keyword in recentSearches"
                  :key="`recent-${keyword}`"
                  type="button"
                  class="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-200"
                  @click="addKeyword(keyword)"
                >
                  + {{ keyword }}
                </button>
              </div>
            </div>

            <div>
              <div class="text-sm font-medium text-gray-700">新鲜度偏好</div>
              <div class="mt-3 grid gap-3 sm:grid-cols-3">
                <button
                  v-for="option in freshnessOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-2xl border px-4 py-3 text-left transition-colors"
                  :class="form.recommendationSettings.freshnessBias === option.value ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'"
                  @click="form.recommendationSettings.freshnessBias = option.value"
                >
                  <div class="font-medium">{{ option.label }}</div>
                  <div class="mt-1 text-xs">{{ option.description }}</div>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-xl font-semibold text-gray-900">密码安全</h2>
        <p class="mt-2 text-sm text-gray-600">定期更新密码，避免与当前密码重复，并确保两次输入一致。</p>

        <div class="mt-6 grid gap-5 md:grid-cols-3">
          <label class="block space-y-2">
            <span class="text-sm font-medium text-gray-700">当前密码</span>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              autocomplete="current-password"
            />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-medium text-gray-700">新密码</span>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              autocomplete="new-password"
            />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-medium text-gray-700">确认新密码</span>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              autocomplete="new-password"
            />
          </label>
        </div>

        <p v-if="passwordValidationMessage" class="mt-4 text-sm text-red-600">
          {{ passwordValidationMessage }}
        </p>

        <div class="mt-5 flex justify-end">
          <button
            class="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving || !canSubmitPassword"
            @click="submitPasswordChange"
          >
            {{ saving && passwordDirty ? '修改中...' : '修改密码' }}
          </button>
        </div>
      </section>

      <div class="flex justify-end">
        <button
          class="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || saving || !!avatarValidationMessage || !profileDirty"
          @click="saveSettings"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
  import { onBeforeRouteLeave } from 'vue-router';
  import InlineNotice from '@/components/InlineNotice.vue';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import { authApi } from '@/api/auth';
  import { searchApi } from '@/api/search';
  import { notifyError, notifySuccess } from '@/composables/useModal';
  import { usePageNotice } from '@/composables/usePageNotice';
  import { useAuthStore } from '@/stores/auth';
  import type { ChangePasswordData, User, UserRecommendationSettings } from '@/types/user';
  import { getErrorMessage } from '@/utils/error-message';

  const authStore = useAuthStore();
  const { notice, setNotice, clearNotice } = usePageNotice();

  const loading = ref(false);
  const saving = ref(false);
  const initialProfileSnapshot = ref('');
  const keywordInput = ref('');
  const recentSearches = ref<string[]>([]);
  const avatarPreviewError = ref(false);

  const form = reactive<{
    nickname: string;
    phone: string;
    avatar: string;
    recommendationSettings: Required<UserRecommendationSettings>;
  }>({
    nickname: '',
    phone: '',
    avatar: '',
    recommendationSettings: {
      preferredTypes: [],
      preferredGenres: [],
      excludedGenres: [],
      preferredKeywords: [],
      freshnessBias: 'balanced',
    },
  });

  const passwordForm = reactive<ChangePasswordData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const typeOptions = [
    { value: 'movie', label: '电影' },
    { value: 'tv_series', label: '电视剧' },
    { value: 'variety', label: '综艺' },
    { value: 'anime', label: '动漫' },
    { value: 'documentary', label: '纪录片' },
  ];

  const genreOptions = ['科幻', '悬疑', '动作', '爱情', '动画', '犯罪', '剧情', '喜剧', '纪录片', '冒险'];

  const freshnessOptions = [
    { value: 'balanced', label: '平衡', description: '新片和经典内容均衡推荐' },
    { value: 'fresh', label: '更偏新片', description: '优先让推荐结果更靠近最近发布' },
    { value: 'classic', label: '更偏经典', description: '降低新片权重，更看重稳定高分内容' },
  ] as const;

  const normalizeKeywords = (value: string) =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 10);

  const buildProfilePayload = () => ({
    nickname: form.nickname.trim() || undefined,
    phone: form.phone.trim() || undefined,
    avatar: form.avatar.trim() || undefined,
    recommendationSettings: {
      preferredTypes: [...form.recommendationSettings.preferredTypes],
      preferredGenres: [...form.recommendationSettings.preferredGenres],
      excludedGenres: [...form.recommendationSettings.excludedGenres],
      preferredKeywords: normalizeKeywords(keywordInput.value),
      freshnessBias: form.recommendationSettings.freshnessBias,
    },
  });

  const avatarValidationMessage = computed(() => {
    const value = form.avatar.trim();
    if (!value) {
      return '';
    }

    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '头像链接仅支持 http / https 地址';
      }
      return '';
    } catch (error) {
      return '请输入有效的头像链接';
    }
  });

  const avatarPreviewUrl = computed(() => (avatarValidationMessage.value ? '' : form.avatar.trim()));

  const profileDirty = computed(
    () => JSON.stringify(buildProfilePayload()) !== initialProfileSnapshot.value,
  );

  const passwordDirty = computed(
    () => !!(passwordForm.oldPassword || passwordForm.newPassword || passwordForm.confirmPassword),
  );

  const hasUnsavedChanges = computed(() => profileDirty.value || passwordDirty.value);

  const passwordValidationMessage = computed(() => {
    if (!passwordDirty.value) {
      return '';
    }

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return '请完整填写当前密码、新密码和确认密码';
    }

    if (passwordForm.newPassword.length < 6) {
      return '新密码至少需要 6 位';
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      return '新密码不能与当前密码相同';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return '两次输入的新密码不一致';
    }

    return '';
  });

  const canSubmitPassword = computed(() => passwordDirty.value && !passwordValidationMessage.value);

  const applyUser = (user: User) => {
    authStore.user = user;
    form.nickname = user.nickname || '';
    form.phone = user.phone || '';
    form.avatar = user.avatar || '';
    form.recommendationSettings.preferredTypes = [...(user.recommendationSettings?.preferredTypes || [])];
    form.recommendationSettings.preferredGenres = [...(user.recommendationSettings?.preferredGenres || [])];
    form.recommendationSettings.excludedGenres = [...(user.recommendationSettings?.excludedGenres || [])];
    form.recommendationSettings.preferredKeywords = [...(user.recommendationSettings?.preferredKeywords || [])];
    form.recommendationSettings.freshnessBias = user.recommendationSettings?.freshnessBias || 'balanced';
    keywordInput.value = form.recommendationSettings.preferredKeywords.join(', ');
    avatarPreviewError.value = false;
    initialProfileSnapshot.value = JSON.stringify(buildProfilePayload());
  };

  watch(
    () => form.avatar,
    () => {
      avatarPreviewError.value = false;
    },
  );

  const loadSettings = async () => {
    loading.value = true;
    clearNotice();

    try {
      const [profile, history] = await Promise.all([
        authApi.getProfile(),
        searchApi.getHistory(8).catch(() => []),
      ]);
      applyUser(profile);
      recentSearches.value = history;
    } catch (error) {
      setNotice('error', getErrorMessage(error, '加载设置失败'));
    } finally {
      loading.value = false;
    }
  };

  const isSelected = (list: string[], value: string) => list.includes(value);

  const toggleItem = (list: string[], value: string) => {
    const index = list.indexOf(value);
    if (index >= 0) {
      list.splice(index, 1);
      return;
    }
    list.push(value);
  };

  const addKeyword = (keyword: string) => {
    const nextKeywords = new Set(normalizeKeywords(keywordInput.value));
    nextKeywords.add(keyword);
    keywordInput.value = [...nextKeywords].slice(0, 10).join(', ');
  };

  const applyRecentSearchKeywords = () => {
    keywordInput.value = recentSearches.value.slice(0, 6).join(', ');
  };

  const resetPasswordForm = () => {
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  };

  const saveSettings = async () => {
    saving.value = true;
    clearNotice();

    try {
      const payload = buildProfilePayload();

      const updatedUser = await authApi.updateProfile(payload);
      applyUser(updatedUser);
      setNotice('success', '偏好设置已保存，新的推荐会逐步参考这些显式偏好。');
      notifySuccess('设置已保存', '资料和推荐偏好已更新。');
    } catch (error) {
      const message = getErrorMessage(error, '保存设置失败');
      setNotice('error', message);
      notifyError('保存失败', message);
    } finally {
      saving.value = false;
    }
  };

  const submitPasswordChange = async () => {
    if (!canSubmitPassword.value) {
      return;
    }

    saving.value = true;
    clearNotice();

    try {
      await authApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      resetPasswordForm();
      setNotice('success', '密码修改成功，请使用新密码继续登录。');
      notifySuccess('密码已修改', '账号安全信息已更新。');
    } catch (error) {
      const message = getErrorMessage(error, '密码修改失败');
      setNotice('error', message);
      notifyError('密码修改失败', message);
    } finally {
      saving.value = false;
    }
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges.value) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  };

  onBeforeRouteLeave(() => {
    if (!hasUnsavedChanges.value) {
      return true;
    }

    return window.confirm('你有尚未保存的更改，确定要离开当前页面吗？');
  });

  onMounted(() => {
    void loadSettings();
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>
