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