import React from "react";
import Icon from "./Icon";

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Agnivridhi CRM home">
      <span className="brand-mark" style={{ background: "#ffffff", padding: "2px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <img
          src="/icons/icon-192.png"
          alt="Agnivridhi"
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "7px" }}
        />
      </span>
      <span>
        agnivridhi<span>crm</span>
      </span>
    </a>
  );
}

export default Brand;
