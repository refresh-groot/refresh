import { MAIN_COLOR } from './constants';
import Swal from 'sweetalert2';

export const showAlert = (icon, title, text, timer) => {
  return Swal.fire({
    icon: icon, // 'success', 'error', 'warning', 'info'
    title: title,
    text: text,
    timer: timer,
    timerProgressBar: timer ? true : false,
    showConfirmButton: timer ? true : false,
    confirmButtonColor: MAIN_COLOR,
  });
};

export const showToast = (icon, title) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end', // 화면 하단
        showConfirmButton: false,
        timer: 1000, // 3초 뒤 자동 사라짐
        timerProgressBar: true,
        width: '300px',
        padding: '0.5rem',
        didOpen: (toast) => {
            toast.style.marginBottom = '60px';
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
};