import React, { useState } from "react";
import usePwaInstall from "../hooks/usePwaInstall";

export default function ClientInstallButton({ className = "" }) {
  const { isInstalled, isPromptAvailable, isIos, installApp, markAsInstalled } = usePwaInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Requirement: Do NOT show the button if already installed or running as standalone app
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isPromptAvailable) {
      setIsInstalling(true);
      try {
        const result = await installApp();
        if (result && result.outcome === "accepted") {
          // Successfully installed! Button will automatically disappear.
          return;
        }
      } catch (err) {
        console.error("Installation error:", err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If native deferred prompt is not directly available (e.g. iOS Safari, or desktop Chrome address bar prompt)
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`cd-install-pwa-btn ${className}`}
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install Agni CRM Client App on your phone, laptop, or desktop"
        aria-label="Install Agni CRM Client App"
      >
        <span className="cd-install-pwa-icon-wrap">
          <svg
            className="cd-install-pwa-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
        <span className="cd-install-pwa-text">
          {isInstalling ? "Installing…" : "Install App"}
        </span>
      </button>

      {/* Guide modal for iOS or manual install */}
      {showGuideModal && (
        <div
          className="cd-install-modal-overlay"
          onClick={() => setShowGuideModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="cd-install-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cd-install-modal-header">
              <div className="cd-install-modal-brand">
                <img
                  src="/icons/icon-192.png"
                  alt="Agnivridhi CRM App Icon"
                  className="cd-install-modal-logo"
                />
                <div>
                  <h3>Install Agnivridhi CRM</h3>
                  <p>Client Portal Web App</p>
                </div>
              </div>
              <button
                type="button"
                className="cd-install-modal-close"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="cd-install-modal-body">
              {isIos ? (
                <div className="cd-install-steps">
                  <p className="cd-install-hint">
                    Install this web app on your iPhone or iPad for quick access directly from your Home Screen:
                  </p>
                  <ol className="cd-install-steps-list">
                    <li>
                      <span className="cd-step-num">1</span>
                      <span>
                        Tap the <strong>Share</strong> button{" "}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ verticalAlign: "-2px", display: "inline" }}
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>{" "}
                        in your Safari browser menu bar.
                      </span>
                    </li>
                    <li>
                      <span className="cd-step-num">2</span>
                      <span>
                        Scroll down the menu and tap <strong>Add to Home Screen</strong>.
                      </span>
                    </li>
                    <li>
                      <span className="cd-step-num">3</span>
                      <span>
                        Tap <strong>Add</strong> in the top-right corner.
                      </span>
                    </li>
                  </ol>
                  <div className="cd-install-note">
                    The Agni CRM icon will appear on your Home Screen. Open it anytime to log in and access your portal!
                  </div>
                </div>
              ) : (
                <div className="cd-install-steps">
                  <p className="cd-install-hint">
                    You can install Agni CRM on your laptop or phone for instant one-click access:
                  </p>
                  <ol className="cd-install-steps-list">
                    <li>
                      <span className="cd-step-num">1</span>
                      <span>
                        Look for the <strong>Install</strong> icon{" "}
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ verticalAlign: "-2px", display: "inline" }}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>{" "}
                        in your browser's address bar (on Chrome / Edge).
                      </span>
                    </li>
                    <li>
                      <span className="cd-step-num">2</span>
                      <span>
                        Or click your browser's menu (<strong>⋮</strong> or <strong>…</strong>) and select{" "}
                        <strong>Install Agni CRM</strong> or <strong>Add to Phone / Desktop</strong>.
                      </span>
                    </li>
                    <li>
                      <span className="cd-step-num">3</span>
                      <span>
                        Confirm installation to place the Agni CRM icon directly on your home screen or desktop.
                      </span>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="cd-install-modal-footer">
              <button
                type="button"
                className="cd-install-modal-dismiss-btn"
                onClick={() => setShowGuideModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="cd-install-modal-confirm-btn"
                onClick={() => {
                  markAsInstalled();
                  setShowGuideModal(false);
                }}
              >
                Already Installed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
