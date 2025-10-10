<template>
  <div class="skeleton-loader">
    <div v-for="index in count" :key="index" class="skeleton-item" :class="getSkeletonClass(index)">
      <!-- 文本骨架 -->
      <div v-if="type === 'text' || type === 'mixed'" class="skeleton-text">
        <div class="skeleton-line skeleton-line--title"></div>
        <div v-if="type === 'mixed'" class="skeleton-line skeleton-line--subtitle"></div>
        <div v-if="type === 'mixed'" class="skeleton-line skeleton-line--content"></div>
      </div>

      <!-- 卡片骨架 -->
      <div v-if="type === 'card' || type === 'mixed'" class="skeleton-card">
        <div class="skeleton-card__poster"></div>
        <div class="skeleton-card__content">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--subtitle"></div>
          <div class="skeleton-tags">
            <div v-for="i in 3" :key="i" class="skeleton-tag"></div>
          </div>
          <div class="skeleton-meta">
            <div class="skeleton-line skeleton-line--meta"></div>
            <div class="skeleton-line skeleton-line--meta"></div>
          </div>
        </div>
      </div>

      <!-- 列表骨架 -->
      <div v-if="type === 'list' || type === 'mixed'" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="skeleton-list__item">
          <div class="skeleton-list__poster"></div>
          <div class="skeleton-list__content">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--subtitle"></div>
          </div>
        </div>
      </div>

      <!-- 网格骨架 -->
      <div v-if="type === 'grid' || type === 'mixed'" class="skeleton-grid">
        <div v-for="i in 4" :key="i" class="skeleton-grid__item">
          <div class="skeleton-grid__poster"></div>
          <div class="skeleton-grid__content">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--subtitle"></div>
            <div class="skeleton-line skeleton-line--meta"></div>
          </div>
        </div>
      </div>

      <!-- 按钮骨架 -->
      <div v-if="type === 'button' || type === 'mixed'" class="skeleton-buttons">
        <div v-for="i in 2" :key="i" class="skeleton-button"></div>
        <div class="skeleton-button skeleton-button--primary"></div>
      </div>

      <!-- 表单骨架 -->
      <div v-if="type === 'form' || type === 'mixed'" class="skeleton-form">
        <div v-for="i in 4" :key="i" class="skeleton-form__group">
          <div class="skeleton-line skeleton-line--label"></div>
          <div class="skeleton-line skeleton-line--input"></div>
        </div>
        <div class="skeleton-form__actions">
          <div class="skeleton-button" style="width: 100px"></div>
          <div class="skeleton-button skeleton-button--primary" style="width: 120px"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    count?: number;
    type?: 'text' | 'card' | 'list' | 'grid' | 'button' | 'form' | 'mixed';
    animated?: boolean;
    shimmer?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    count: 1,
    type: 'mixed',
    animated: true,
    shimmer: true,
  });

  /**
   * 根据索引生成不同的骨架样式，避免重复
   */
  const getSkeletonClass = (index: number): string => {
    // 基于索引生成伪随机但一致的样式
    const patterns = [
      'skeleton-pattern--1',
      'skeleton-pattern--2',
      'skeleton-pattern--3',
      'skeleton-pattern--4',
    ];
    return patterns[index % patterns.length];
  };
</script>

<style scoped>
  .skeleton-loader {
    width: 100%;
    padding: 1rem;
  }

  .skeleton-item {
    margin-bottom: 2rem;
  }

  /* 基础骨架线条 */
  .skeleton-line {
    height: 1rem;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
    background-size: 400% 100%;
    border-radius: 0.25rem;
    position: relative;
    overflow: hidden;
  }

  .skeleton-line::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.6) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  /* 不同高度的骨架线 */
  .skeleton-line--title {
    height: 1.5rem;
    width: 70%;
    margin-bottom: 0.75rem;
  }

  .skeleton-line--subtitle {
    height: 1rem;
    width: 90%;
    margin-bottom: 0.5rem;
  }

  .skeleton-line--content {
    height: 0.875rem;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .skeleton-line--meta {
    height: 0.75rem;
    width: 60%;
    margin-bottom: 0.25rem;
  }

  .skeleton-line--label {
    height: 0.875rem;
    width: 80px;
    margin-bottom: 0.5rem;
  }

  .skeleton-line--input {
    height: 2.5rem;
    width: 100%;
    margin-bottom: 1rem;
  }

  /* 文本骨架 */
  .skeleton-text {
    width: 100%;
  }

  /* 卡片骨架 */
  .skeleton-card {
    display: flex;
    gap: 1rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .skeleton-card__poster {
    width: 120px;
    height: 180px;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%);
    flex-shrink: 0;
  }

  .skeleton-card__content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .skeleton-tags {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .skeleton-tag {
    height: 1.5rem;
    width: 60px;
    border-radius: 0.25rem;
    background: linear-gradient(135deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%);
  }

  .skeleton-meta {
    margin-top: auto;
    display: flex;
    gap: 1rem;
  }

  /* 列表骨架 */
  .skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skeleton-list__item {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 0.5rem;
  }

  .skeleton-list__poster {
    width: 80px;
    height: 120px;
    border-radius: 0.375rem;
    background: linear-gradient(135deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%);
    flex-shrink: 0;
  }

  .skeleton-list__content {
    flex: 1;
  }

  /* 网格骨架 */
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .skeleton-grid__item {
    background: #f8fafc;
    border-radius: 0.5rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skeleton-grid__poster {
    width: 100%;
    height: 150px;
    border-radius: 0.375rem;
    background: linear-gradient(135deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%);
  }

  .skeleton-grid__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* 按钮骨架 */
  .skeleton-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  }

  .skeleton-button {
    height: 2.5rem;
    border-radius: 0.375rem;
    background: linear-gradient(135deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%);
  }

  .skeleton-button--primary {
    width: 120px;
  }

  /* 表单骨架 */
  .skeleton-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 500px;
  }

  .skeleton-form__group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-form__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  /* 闪光动画 */
  @keyframes shimmer {
    0% {
      background-position: -400% 0;
    }
    100% {
      background-position: 400% 0;
    }
  }

  /* 脉动模式 */
  .skeleton-animated .skeleton-line {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .skeleton-loader {
      padding: 0.75rem;
    }

    .skeleton-card {
      flex-direction: column;
    }

    .skeleton-card__poster {
      width: 100%;
      height: 200px;
    }

    .skeleton-list {
      gap: 0.75rem;
    }

    .skeleton-list__item {
      padding: 0.5rem;
    }

    .skeleton-list__poster {
      width: 60px;
      height: 90px;
    }

    .skeleton-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .skeleton-grid__poster {
      height: 120px;
    }

    .skeleton-form {
      max-width: 100%;
    }
  }

  @media (max-width: 480px) {
    .skeleton-loader {
      padding: 0.5rem;
    }

    .skeleton-item {
      margin-bottom: 1.5rem;
    }

    .skeleton-grid {
      grid-template-columns: 1fr;
    }

    .skeleton-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .skeleton-form__actions {
      flex-direction: column;
    }
  }

  /* 模式变体 - 避免重复 */
  .skeleton-pattern--1 .skeleton-line--title {
    width: 80%;
  }

  .skeleton-pattern--2 .skeleton-line--title {
    width: 70%;
  }

  .skeleton-pattern--3 .skeleton-line--title {
    width: 85%;
  }

  .skeleton-pattern--4 .skeleton-line--title {
    width: 75%;
  }

  .skeleton-pattern--1 .skeleton-line--subtitle {
    width: 95%;
  }

  .skeleton-pattern--2 .skeleton-line--subtitle {
    width: 85%;
  }

  .skeleton-pattern--3 .skeleton-line--subtitle {
    width: 90%;
  }

  .skeleton-pattern--4 .skeleton-line--subtitle {
    width: 80%;
  }
</style>
