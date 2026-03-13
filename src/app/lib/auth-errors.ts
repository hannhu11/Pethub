import axios from 'axios';
import { extractApiError } from './api-client';

export type AuthAction =
  | 'login'
  | 'register'
  | 'google-login'
  | 'reset-password'
  | 'profile-update'
  | 'sync'
  | 'generic';

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Email không đúng định dạng.',
  'auth/user-disabled': 'Tài khoản này đã bị khóa. Vui lòng liên hệ hỗ trợ.',
  'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
  'auth/wrong-password': 'Mật khẩu chưa đúng. Vui lòng thử lại.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-login-credentials': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-password': 'Mật khẩu chưa đúng. Vui lòng thử lại.',
  'auth/missing-password': 'Bạn chưa nhập mật khẩu.',
  'auth/missing-email': 'Bạn chưa nhập email.',
  'auth/invalid-api-key': 'Cấu hình đăng nhập chưa hợp lệ. Vui lòng thử lại sau.',
  'auth/app-not-authorized': 'Ứng dụng chưa được cấp quyền đăng nhập. Vui lòng liên hệ quản trị.',
  'auth/configuration-not-found':
    'Dịch vụ đăng nhập đang thiếu cấu hình. Vui lòng thử lại sau ít phút.',
  'auth/admin-restricted-operation':
    'Thao tác này đang bị giới hạn bởi quản trị hệ thống.',
  'auth/unauthorized-domain':
    'Tên miền hiện tại chưa được phép đăng nhập. Vui lòng liên hệ quản trị.',
  'auth/web-storage-unsupported':
    'Trình duyệt đang chặn lưu phiên đăng nhập. Vui lòng bật cookie/local storage.',
  'auth/too-many-requests':
    'Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.',
  'auth/network-request-failed':
    'Không thể kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
  'auth/email-already-in-use':
    'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
  'auth/weak-password':
    'Mật khẩu quá yếu. Vui lòng dùng mật khẩu mạnh hơn (tối thiểu 8 ký tự).',
  'auth/operation-not-allowed':
    'Phương thức đăng nhập này chưa được bật trong Firebase.',
  'auth/popup-closed-by-user':
    'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.',
  'auth/popup-blocked':
    'Trình duyệt đang chặn popup đăng nhập Google. Vui lòng cho phép popup.',
  'auth/cancelled-popup-request':
    'Yêu cầu đăng nhập Google đã bị hủy.',
  'auth/account-exists-with-different-credential':
    'Email này đã liên kết với phương thức đăng nhập khác.',
  'auth/credential-already-in-use':
    'Thông tin đăng nhập này đã được liên kết với tài khoản khác.',
  'auth/requires-recent-login':
    'Vui lòng đăng nhập lại để tiếp tục thao tác bảo mật này.',
  'auth/expired-action-code':
    'Liên kết đã hết hạn. Vui lòng yêu cầu lại.',
  'auth/invalid-action-code':
    'Liên kết không hợp lệ hoặc đã được sử dụng.',
  'auth/internal-error': 'Hệ thống xác thực đang bận. Vui lòng thử lại.',
};

const ACTION_DEFAULT_MESSAGES: Record<AuthAction, string> = {
  login: 'Đăng nhập thất bại. Vui lòng thử lại.',
  register: 'Đăng ký thất bại. Vui lòng thử lại.',
  'google-login': 'Đăng nhập Google thất bại. Vui lòng thử lại.',
  'reset-password': 'Không gửi được email khôi phục. Vui lòng thử lại.',
  'profile-update': 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
  sync: 'Lỗi máy chủ: Không thể đồng bộ tài khoản. Vui lòng thử lại.',
  generic: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
};

function extractFirebaseAuthCode(rawMessage: string) {
  const match = rawMessage.match(/auth\/[a-z0-9-]+/i);
  return match ? match[0].toLowerCase() : null;
}

function looksLikeFirebaseMessage(rawMessage: string) {
  const normalized = rawMessage.toLowerCase();
  return normalized.includes('firebase:') || normalized.includes('auth/');
}

function getStatusMessage(status: number) {
  if (status >= 500) {
    return 'Máy chủ đang bận hoặc gặp lỗi. Vui lòng thử lại sau.';
  }

  const map: Record<number, string> = {
    400: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.',
    401: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    403: 'Bạn không có quyền thực hiện thao tác này.',
    404: 'Không tìm thấy dữ liệu yêu cầu.',
    409: 'Dữ liệu bị xung đột hoặc đã tồn tại.',
    422: 'Thông tin nhập chưa đúng định dạng.',
    429: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  };

  return map[status] ?? null;
}

function looksLikeInfraError(rawMessage: string) {
  const normalized = rawMessage.toLowerCase();
  return (
    normalized.includes('status code 500') ||
    normalized.includes('status code 502') ||
    normalized.includes('status code 503') ||
    normalized.includes('status code 504') ||
    normalized.includes('network error') ||
    normalized.includes('firebase admin credentials missing') ||
    normalized.includes('service unavailable')
  );
}

export function toFriendlyAuthError(
  error: unknown,
  action: AuthAction = 'generic',
) {
  const fallback = ACTION_DEFAULT_MESSAGES[action];

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const byStatus = status ? getStatusMessage(status) : null;
    if (byStatus) {
      return byStatus;
    }

    const apiMessage = extractApiError(error);
    const firebaseCodeFromApi = extractFirebaseAuthCode(apiMessage);
    if (firebaseCodeFromApi && FIREBASE_AUTH_MESSAGES[firebaseCodeFromApi]) {
      return FIREBASE_AUTH_MESSAGES[firebaseCodeFromApi];
    }
    if (looksLikeInfraError(apiMessage)) {
      return ACTION_DEFAULT_MESSAGES.sync;
    }

    if (apiMessage && apiMessage !== 'Network Error' && !looksLikeFirebaseMessage(apiMessage)) {
      return apiMessage;
    }
    return fallback;
  }

  const codeFromObject =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? String((error as { code: string }).code).toLowerCase()
      : null;

  if (codeFromObject && FIREBASE_AUTH_MESSAGES[codeFromObject]) {
    return FIREBASE_AUTH_MESSAGES[codeFromObject];
  }

  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const firebaseCodeFromText = extractFirebaseAuthCode(rawMessage);
  if (firebaseCodeFromText && FIREBASE_AUTH_MESSAGES[firebaseCodeFromText]) {
    return FIREBASE_AUTH_MESSAGES[firebaseCodeFromText];
  }

  if (looksLikeInfraError(rawMessage)) {
    return ACTION_DEFAULT_MESSAGES.sync;
  }

  if (looksLikeFirebaseMessage(rawMessage)) {
    return fallback;
  }

  if (!rawMessage || rawMessage === 'undefined' || rawMessage === 'null') {
    return fallback;
  }

  return rawMessage;
}
