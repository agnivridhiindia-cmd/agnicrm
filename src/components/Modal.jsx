import React from 'react';
import Icon from './Icon';

export default function Modal({ title, children, footer, onClose, closeLabel, className = "" }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`modal-content ${className}`.trim()}>
        <header className="modal-header">
          <div>
            <h3>{title}</h3>
          </div>
          <button
            className={closeLabel ? "table-action" : "modal-close"}
            type="button"
            onClick={onClose}
            aria-label={closeLabel ? closeLabel : "Close modal"}
          >
            {closeLabel || <Icon name="arrowUp" size={18} />}
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
