// File: src/components/Toast.jsx
import { toast, Slide } from 'react-toastify';
import '../App.css';

export const showToast = (type, message) => {
  toast[type](message, {
    position: 'top-center',
    autoClose: 2000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'colored',
    transition: Slide,
  });
};

export const showSuccessToast = (message) => showToast('success', message);
export const showErrorToast = (message) => showToast('error', message);
export const showWarningToast = (message) => showToast('warn', message);
export const showInfoToast = (message) => showToast('info', message);

export const showConfirmToast = (message, onConfirm, onCancel, confirmText = "Hapus", confirmColor = "bg-red-500") => {
  toast(
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm mx-auto">
      <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Konfirmasi</h3>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => {
            toast.dismiss();
            if (onCancel) onCancel();
          }}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() => {
            toast.dismiss();
            if (onConfirm) onConfirm();
          }}
          // Ubah class bg-red-500 menjadi dynamic `${confirmColor}`
          className={`flex-1 px-4 py-2 text-sm font-medium text-white ${confirmColor} border border-transparent rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
        >
          {/* Gunakan variabel confirmText di sini */}
          {confirmText}
        </button>
      </div>
    </div>,
    {
      position: 'top-center',
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      theme: 'light',
      transition: Slide,
      className: 'confirm-modal-toast',
      bodyClassName: 'p-0',
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: '0',
        margin: '0',
        width: 'auto',
        maxWidth: '400px'
      }
    }
  );
};
