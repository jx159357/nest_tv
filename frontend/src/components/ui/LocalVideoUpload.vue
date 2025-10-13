<template>
  <div class="local-video-upload">
    <!-- 文件上传区域 -->
    <div
      v-if="!videoFile"
      class="upload-area"
      :class="{
        'upload-area--dragover': isDragOver,
        'upload-area--uploading': isUploading,
        'upload-area--error': uploadError,
      }"
      @click="triggerFileInput"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="upload-area__content">
        <div class="upload-area__icon">
          <svg v-if="!isUploading" class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
            />
            <path d="M12,11L8,15H10.5V19H13.5V15H16L12,11Z" />
          </svg>
          <div v-else class="upload-spinner"></div>
        </div>

        <h3 class="upload-area__title">{{ uploadTitle }}</h3>
        <p class="upload-area__description">{{ uploadDescription }}</p>

        <!-- 支持格式提示 -->
        <div class="upload-area__formats">
          <span class="format-tag">MP4</span>
          <span class="format-tag">AVI</span>
          <span class="format-tag">MKV</span>
          <span class="format-tag">MOV</span>
          <span class="format-tag">WMV</span>
          <span class="format-tag">FLV</span>
          <span class="format-tag">WEBM</span>
        </div>

        <!-- 文件大小限制 -->
        <div class="upload-area__size-limit">最大文件大小: {{ formatFileSize(maxFileSize) }}</div>

        <!-- 上传按钮 -->
        <button class="upload-button" :disabled="isUploading" @click.stop="triggerFileInput">
          <svg class="upload-button__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
          </svg>
          {{ uploadButtonText }}
        </button>

        <!-- 错误提示 -->
        <div v-if="uploadError" class="upload-error">
          <div class="upload-error__icon">⚠️</div>
          <span class="upload-error__text">{{ uploadError }}</span>
        </div>
      </div>
    </div>

    <!-- 视频预览区域 -->
    <div v-else class="video-preview">
      <div class="video-preview__header">
        <div class="video-info">
          <h4 class="video-info__title">{{ videoFile.name }}</h4>
          <div class="video-info__meta">
            <span class="video-info__size">{{ formatFileSize(videoFile.size) }}</span>
            <span class="video-info__type">{{ videoFile.type || '未知类型' }}</span>
            <span v-if="videoDuration" class="video-info__duration">{{
              formatTime(videoDuration)
            }}</span>
          </div>
        </div>
        <div class="video-actions">
          <button class="action-button action-button--play" title="播放视频" @click="playVideo">
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </button>
          <button
            class="action-button action-button--replace"
            title="替换视频"
            @click="replaceVideo"
          >
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
              />
              <path d="M12,11L8,15H10.5V19H13.5V15H16L12,11Z" />
            </svg>
          </button>
          <button class="action-button action-button--remove" title="移除视频" @click="removeVideo">
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 视频缩略图预览 -->
      <div class="video-preview__content">
        <video
          ref="videoPreviewRef"
          class="video-preview__video"
          :src="videoUrl"
          preload="metadata"
          muted
          @loadedmetadata="onVideoLoadedMetadata"
          @error="onVideoError"
        ></video>

        <!-- 视频信息加载中 -->
        <div v-if="isLoadingVideoInfo" class="video-loading">
          <div class="video-loading__spinner"></div>
          <span class="video-loading__text">加载视频信息...</span>
        </div>

        <!-- 视频加载失败 -->
        <div v-if="videoLoadError" class="video-error">
          <div class="video-error__icon">❌</div>
          <span class="video-error__text">{{ videoLoadError }}</span>
        </div>
      </div>

      <!-- 视频属性 -->
      <div v-if="videoMetadata" class="video-metadata">
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">分辨率:</span>
            <span class="metadata-value"
              >{{ videoMetadata.width }} × {{ videoMetadata.height }}</span
            >
          </div>
          <div class="metadata-item">
            <span class="metadata-label">时长:</span>
            <span class="metadata-value">{{ formatTime(videoMetadata.duration) }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">文件大小:</span>
            <span class="metadata-value">{{ formatFileSize(videoMetadata.size) }}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">格式:</span>
            <span class="metadata-value">{{ videoMetadata.format }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      class="file-input"
      accept="video/*"
      :multiple="multiple"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue';
  import type { Ref } from 'vue';

  interface VideoMetadata {
    width: number;
    height: number;
    duration: number;
    size: number;
    format: string;
    codec?: string;
    bitrate?: number;
  }

  interface Props {
    maxFileSize?: number; // 最大文件大小（字节），默认2GB
    acceptedFormats?: string[]; // 接受的视频格式
    allowMultiple?: boolean; // 是否允许多文件上传
    autoUpload?: boolean; // 是否自动上传
    uploadEndpoint?: string; // 上传接口地址
  }

  interface Emits {
    (e: 'file-selected', file: File, metadata?: VideoMetadata): void;
    (e: 'file-removed'): void;
    (e: 'upload-progress', progress: number): void;
    (e: 'upload-complete', response: any): void;
    (e: 'upload-error', error: string): void;
    (e: 'play-video', file: File, url: string): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    acceptedFormats: () => ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
    allowMultiple: false,
    autoUpload: false,
    uploadEndpoint: '',
  });

  const emit = defineEmits<Emits>();

  // 引用
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const videoPreviewRef = ref<HTMLVideoElement | null>(null);

  // 状态
  const videoFile = ref<File | null>(null);
  const videoUrl = ref<string>('');
  const isDragOver = ref(false);
  const isUploading = ref(false);
  const uploadError = ref('');
  const uploadProgress = ref(0);
  const isLoadingVideoInfo = ref(false);
  const videoLoadError = ref('');
  const videoDuration = ref(0);
  const videoMetadata = ref<VideoMetadata | null>(null);

  // 计算属性
  const uploadTitle = computed(() => {
    if (isUploading.value) return '上传中...';
    if (uploadError.value) return '上传失败';
    return '上传本地视频';
  });

  const uploadDescription = computed(() => {
    if (isUploading.value) return `正在上传: ${uploadProgress.value}%`;
    if (uploadError.value) return '请重新选择文件';
    return '点击选择文件或拖拽文件到此处';
  });

  const uploadButtonText = computed(() => {
    return isUploading.value ? '上传中...' : '选择视频文件';
  });

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 验证文件类型
  const validateFileType = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return props.acceptedFormats.includes(extension);
  };

  // 验证文件大小
  const validateFileSize = (file: File): boolean => {
    return file.size <= props.maxFileSize;
  };

  // 触发文件选择
  const triggerFileInput = () => {
    if (isUploading.value) return;
    fileInputRef.value?.click();
  };

  // 处理文件选择
  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  // 处理拖拽
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;

    if (isUploading.value) return;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  // 拖拽事件处理
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = true;
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;
  };

  // 处理文件
  const processFile = async (file: File) => {
    // 重置状态
    uploadError.value = '';
    videoLoadError.value = '';

    // 验证文件类型
    if (!validateFileType(file)) {
      uploadError.value = `不支持的文件格式: ${file.name}`;
      return;
    }

    // 验证文件大小
    if (!validateFileSize(file)) {
      uploadError.value = `文件大小超过限制: ${formatFileSize(file.size)} > ${formatFileSize(props.maxFileSize)}`;
      return;
    }

    // 设置文件
    videoFile.value = file;

    // 创建本地URL
    videoUrl.value = URL.createObjectURL(file);

    // 加载视频信息
    await loadVideoInfo(file);

    // 触发事件
    emit('file-selected', file, videoMetadata.value);

    // 自动上传
    if (props.autoUpload && props.uploadEndpoint) {
      await uploadFile(file);
    }
  };

  // 加载视频信息
  const loadVideoInfo = async (file: File): Promise<void> => {
    isLoadingVideoInfo.value = true;
    videoLoadError.value = '';

    try {
      await nextTick();

      if (videoPreviewRef.value) {
        // 等待视频元数据加载
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('视频元数据加载超时'));
          }, 10000);

          videoPreviewRef.value!.addEventListener(
            'loadedmetadata',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );

          videoPreviewRef.value!.addEventListener(
            'error',
            () => {
              clearTimeout(timeout);
              reject(new Error('视频文件损坏或格式不支持'));
            },
            { once: true },
          );
        });

        // 获取视频信息
        const video = videoPreviewRef.value;
        videoDuration.value = video.duration || 0;

        videoMetadata.value = {
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          duration: video.duration || 0,
          size: file.size,
          format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        };
      }
    } catch (error) {
      videoLoadError.value = error instanceof Error ? error.message : '视频信息加载失败';
      console.error('视频信息加载失败:', error);
    } finally {
      isLoadingVideoInfo.value = false;
    }
  };

  // 视频元数据加载完成
  const onVideoLoadedMetadata = () => {
    // 已在 loadVideoInfo 中处理
  };

  // 视频加载错误
  const onVideoError = (event: Event) => {
    videoLoadError.value = '视频文件损坏或格式不支持';
    isLoadingVideoInfo.value = false;
    console.error('视频加载错误:', event);
  };

  // 上传文件
  const uploadFile = async (file: File): Promise<void> => {
    if (!props.uploadEndpoint) {
      console.warn('未配置上传接口地址');
      return;
    }

    isUploading.value = true;
    uploadProgress.value = 0;
    uploadError.value = '';

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 添加其他元数据
      if (videoMetadata.value) {
        formData.append('metadata', JSON.stringify(videoMetadata.value));
      }

      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          uploadProgress.value = Math.round((event.loaded / event.total) * 100);
          emit('upload-progress', uploadProgress.value);
        }
      });

      // 处理完成
      xhr.addEventListener('load', () => {
        isUploading.value = false;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            emit('upload-complete', response);
          } catch (error) {
            uploadError.value = '响应格式错误';
            emit('upload-error', uploadError.value);
          }
        } else {
          uploadError.value = `上传失败: ${xhr.statusText}`;
          emit('upload-error', uploadError.value);
        }
      });

      // 处理错误
      xhr.addEventListener('error', () => {
        isUploading.value = false;
        uploadError.value = '网络错误，上传失败';
        emit('upload-error', uploadError.value);
      });

      // 发送请求
      xhr.open('POST', props.uploadEndpoint, true);
      xhr.send(formData);
    } catch (error) {
      isUploading.value = false;
      uploadError.value = error instanceof Error ? error.message : '上传失败';
      emit('upload-error', uploadError.value);
    }
  };

  // 播放视频
  const playVideo = () => {
    if (videoFile.value && videoUrl.value) {
      emit('play-video', videoFile.value, videoUrl.value);
    }
  };

  // 替换视频
  const replaceVideo = () => {
    // 清理当前URL
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
    }

    // 重置状态
    videoFile.value = null;
    videoUrl.value = '';
    videoMetadata.value = null;
    videoDuration.value = 0;
    videoLoadError.value = '';
    uploadError.value = '';

    // 触发事件
    emit('file-removed');

    // 重新选择文件
    triggerFileInput();
  };

  // 移除视频
  const removeVideo = () => {
    if (confirm('确定要移除当前视频吗？')) {
      replaceVideo();
    }
  };

  // 清理资源
  const cleanup = () => {
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value);
      videoUrl.value = '';
    }
  };

  // 暴露方法
  defineExpose({
    triggerFileInput,
    removeVideo,
    cleanup,
  });
</script>

<style scoped>
  .local-video-upload {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  /* 上传区域 */
  .upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .upload-area:hover {
    border-color: #667eea;
    background: #f1f5f9;
  }

  .upload-area--dragover {
    border-color: #667eea;
    background: #e0e7ff;
    transform: scale(1.02);
  }

  .upload-area--uploading {
    border-color: #94a3b8;
    background: #f8fafc;
    cursor: not-allowed;
  }

  .upload-area--error {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .upload-area__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .upload-area__icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }

  .upload-icon {
    width: 100%;
    height: 100%;
  }

  .upload-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .upload-area__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
  }

  .upload-area__description {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.5;
  }

  .upload-area__formats {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .format-tag {
    padding: 0.25rem 0.5rem;
    background: #e2e8f0;
    color: #475569;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .upload-area__size-limit {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.5rem;
  }

  .upload-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1rem;
  }

  .upload-button:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-1px);
  }

  .upload-button:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }

  .upload-button__icon {
    width: 20px;
    height: 20px;
  }

  .upload-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #dc2626;
    margin-top: 1rem;
  }

  .upload-error__icon {
    font-size: 1rem;
  }

  .upload-error__text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* 视频预览 */
  .video-preview {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    background: #1f2937;
  }

  .video-preview__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #111827;
    border-bottom: 1px solid #374151;
  }

  .video-info {
    flex: 1;
  }

  .video-info__title {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    word-break: break-all;
  }

  .video-info__meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .video-info__size,
  .video-info__type,
  .video-info__duration {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }

  .video-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .action-button--play {
    background: #667eea;
  }

  .action-button--play:hover {
    background: #5a67d8;
  }

  .action-button--replace {
    background: #f59e0b;
  }

  .action-button--replace:hover {
    background: #d97706;
  }

  .action-button--remove {
    background: #ef4444;
  }

  .action-button--remove:hover {
    background: #dc2626;
  }

  .action-icon {
    width: 20px;
    height: 20px;
  }

  .video-preview__content {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    overflow: hidden;
  }

  .video-preview__video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .video-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: white;
  }

  .video-loading__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .video-loading__text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .video-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(239, 68, 68, 0.9);
    border-radius: 0.5rem;
    color: white;
    backdrop-filter: blur(10px);
  }

  .video-error__icon {
    font-size: 1.25rem;
  }

  .video-error__text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .video-metadata {
    padding: 1rem;
    background: #111827;
    border-top: 1px solid #374151;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .metadata-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .metadata-label {
    color: #9ca3af;
    font-weight: 500;
  }

  .metadata-value {
    color: white;
    font-weight: 600;
  }

  /* 隐藏的文件输入 */
  .file-input {
    display: none;
  }

  /* 动画 */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .upload-area {
      padding: 2rem;
    }

    .upload-area__title {
      font-size: 1.125rem;
    }

    .upload-area__description {
      font-size: 0.8rem;
    }

    .upload-button {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
    }

    .video-preview__header {
      padding: 0.75rem;
    }

    .video-info__title {
      font-size: 0.875rem;
    }

    .video-info__meta {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .action-button {
      width: 32px;
      height: 32px;
    }

    .metadata-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
    }

    .metadata-item {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .upload-area {
      padding: 1.5rem;
    }

    .upload-area__formats {
      display: none; /* 移动端隐藏格式标签 */
    }

    .upload-button {
      width: 100%;
      justify-content: center;
    }

    .video-preview__header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .video-actions {
      align-self: stretch;
      justify-content: center;
    }

    .metadata-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
