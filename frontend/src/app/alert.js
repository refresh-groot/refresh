import { MAIN_COLOR } from './constants';
import Swal from 'sweetalert2';

export const showAlert = (icon, title, text) => {
  return Swal.fire({
    icon: icon, // 'success', 'error', 'warning', 'info'
    title: title,
    text: text,
    confirmButtonColor: MAIN_COLOR,
  });
};

export const showToast = (icon, title) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom', // 화면 하단
        showConfirmButton: false,
        timer: 3000, // 3초 뒤 자동 사라짐
        timerProgressBar: true,
        width: '300px',
        padding: '0.5rem',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
};