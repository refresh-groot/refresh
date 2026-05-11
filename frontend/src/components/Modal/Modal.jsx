import React from 'react';
import './Modal.css';

function Modal({ title, onClose, children }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>{title}</h2>
        {children}
        </div>
        </div>
);
}

export default Modal;