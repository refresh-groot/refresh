import React from 'react';
import './Modal.css';

const AlertModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-warning-icon">!</div>
          <h2>{title}</h2>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>나중에</button>
          <button className="btn-primary" onClick={onConfirm}>연결하러 가기</button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;