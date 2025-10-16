// 组件 Props 类型
import type { MediaResource, MediaType, MediaQuality } from './media';

export interface MediaCardProps {
  media: MediaResource;
  showRating?: boolean;
  showViewCount?: boolean;
  clickable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}

export interface SearchInputProps {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  suggestions?: SearchSuggestion[];
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

export interface SearchSuggestion {
  id: number;
  title: string;
  type: 'media' | 'user' | 'genre';
  subtitle?: string;
}

// 表单类型
export interface LoginForm {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  nickname?: string;
}

export interface MediaFilterForm {
  type?: MediaType;
  genre?: string;
  quality?: MediaQuality;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 路由类型
export interface RouteMeta {
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  title?: string;
  preload?: boolean;
  keepAlive?: boolean;
  hideAuth?: boolean;
}
