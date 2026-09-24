import React from 'react';
import Icon from './Icon';

export default function ConfirmDialog({
  title = "Confirm Deletion",
  message,
  confirmLabel = "Delete Record",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="confirm-dialog-enhanced">
      <div className="confirm-dialog-icon">
        <Icon name="alert" size={28} />
      </div>

      <div className="confirm-dialog-content">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <p className="confirm-dialog-warning">
          Warning: This action will remove the record and cannot be undone.
        </p>
      </div>

      <div className="confirm-dialog-actions">
        <button
          type="button"
          className="confirm-dialog-btn confirm-dialog-btn-cancel manager-btn-secondary"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="confirm-dialog-btn confirm-dialog-btn-delete manager-btn-danger"
          onClick={onConfirm}
        >
          <Icon name="trash" size={14} />
          <span>{confirmLabel}</span>
        </button>
      </div>
    </div>
  );
}
