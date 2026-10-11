import { MAIN_COLOR } from './constants';
import Swal from 'sweetalert2';

const AppSwal = Swal.mixin({
  confirmButtonText: '확인',
  confirmButtonColor: MAIN_COLOR,
  buttonsStyling: false,
  customClass: {
    popup: 'refresh-alert-popup',
    title: 'refresh-alert-title',
    htmlContainer: 'refresh-alert-text',
    confirmButton: 'refresh-alert-confirm',
    cancelButton: 'refresh-alert-cancel',
  },
});

export const showAlert = (icon, title, text, timer) => {
  return AppSwal.fire({
    icon: icon === 'fail' ? 'error' : icon,
    title,
    text,
    timer: timer,
    timerProgressBar: timer ? true : false,
    showConfirmButton: !timer,
  });
};

export const showToast = (icon, title, text, timer = 2200) => {
    const Toast = AppSwal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        width: '320px',
        padding: '0.7rem 0.85rem',
        customClass: {
          popup: 'refresh-toast-popup',
          title: 'refresh-toast-title',
        },
        didOpen: (toast) => {
            toast.style.marginBottom = '60px';
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    return Toast.fire({
        icon: icon === 'fail' ? 'error' : icon,
        title,
        text,
    });
};

export default AppSwal;
