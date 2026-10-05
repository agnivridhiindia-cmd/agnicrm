import React from "react";
import Icon from "../../components/Icon";
import { apiFetch } from "../../services/apiClient";
import "./AuthScreen.css";

const ROLE_MAP = {
  OWNER: "Owner",
  ADMIN: "Admin",
  BRANCH_MANAGER: "Branch Manager",
  MANAGER: "Manager",
  SALES_PERSON: "Sales Person",
  IT: "IT",
  MARKETING: "Marketing",
  CLIENT: "Client",
};

const MOCK_USERS = {
  "owner@agni.com": "Owner",
  "client@company.com": "Client",
  "chaddionpants@gmail.com": "Client",
  "sanjay@delhiapex.com": "Client",
  "ariana@agni.com": "Branch Manager",
  "eli@agni.com": "Manager",
  "mia@agni.com": "Sales Person",
  "lucas@agni.com": "Sales Person",
  "noah@agni.com": "IT",
  "sophia.it@agni.com": "IT",
  "daniel@agni.com": "Marketing",
  "chloe@agni.com": "Marketing",
  "admin@agni.com": "Admin",
  "priya.admin@agni.com": "Admin",
  "rajesh.bm@agni.com": "Branch Manager",
  "ananya.sm@agni.com": "Manager",
  "rohan.sales@agni.com": "Sales Person",
  "kavya.sales@agni.com": "Sales Person",
  "aarav.it@agni.com": "IT",
  "ishaan.it@agni.com": "IT",
  "neha.mkt@agni.com": "Marketing",
  "sanya.mkt@agni.com": "Marketing",
  "amit.admin@agni.com": "Admin",
  "simran.admin@agni.com": "Admin",
  "suresh.bm@agni.com": "Branch Manager",
  "karthik.sm@agni.com": "Manager",
  "arjun.sales@agni.com": "Sales Person",
  "deepa.sales@agni.com": "Sales Person",
  "vikram.it@agni.com": "IT",
  "niharika.it@agni.com": "IT",
  "pooja.mkt@agni.com": "Marketing",
  "tarun.mkt@agni.com": "Marketing",
  "lakshmi.admin@agni.com": "Admin",
  "rahul.admin@agni.com": "Admin",
  "subhash.bm@agni.com": "Branch Manager",
  "debolina.sm@agni.com": "Manager",
  "sourav.sales@agni.com": "Sales Person",
  "riya.sales@agni.com": "Sales Person",
  "arindam.it@agni.com": "IT",
  "swati.it@agni.com": "IT",
  "tanmoy.mkt@agni.com": "Marketing",
  "sneha.mkt@agni.com": "Marketing",
  "pronab.admin@agni.com": "Admin",
  "moumita.admin@agni.com": "Admin",
};

const DEMO_PASSWORD = "password123";
const DEFAULT_DEMO_EMAIL = "owner@agni.com";

const loginFeatures = [
  { icon: "clients", label: "Manage Leads" },
  { icon: "document", label: "Track Clients" },
  { icon: "reports", label: "Monitor Projects" },
  { icon: "checkCircle", label: "Improve Productivity" },
];

export default function AuthScreen({ onLogin }) {
  const rememberedEmail = localStorage.getItem("agni_remember_email") || "";
  const [email, setEmail] = React.useState(rememberedEmail);
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(Boolean(rememberedEmail));
  const [errorMsg, setErrorMsg] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleQuickSelect = (accountEmail) => {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setErrorMsg("");
  };

  async function submit(event) {
    event.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password;

    if (rememberMe && targetEmail) {
      localStorage.setItem("agni_remember_email", targetEmail);
    } else {
      localStorage.removeItem("agni_remember_email");
    }

    let isNetworkError = false;
    let response;
    try {
      response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
    } catch {
      isNetworkError = true;
    }

    if (!isNetworkError && response) {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setIsLoading(false);
        setErrorMsg(data.message || "Invalid email or password.");
        return;
      }

      const rawRole = data.user?.role;
      const mappedRole = ROLE_MAP[rawRole] || rawRole || "Client";

      localStorage.setItem("agni_token", data.token);
      localStorage.setItem("agni_user_email", data.user.email);
      localStorage.setItem("agni_user_role", mappedRole);
      if (data.user?.fullName) {
        localStorage.setItem("agni_user_name", data.user.fullName);
      }
      if (data.user) {
        localStorage.setItem("agni_user", JSON.stringify(data.user));
      }

      setIsLoading(false);
      onLogin(data.user.email, mappedRole, data.token);
      return;
    }

    console.warn("Backend API unreachable, checking mock user demo login...");
    if (targetEmail && MOCK_USERS[targetEmail]) {
      const fallbackRole = MOCK_USERS[targetEmail];
      localStorage.setItem("agni_user_email", targetEmail);
      localStorage.setItem("agni_user_role", fallbackRole);
      setIsLoading(false);
      onLogin(targetEmail, fallbackRole);
      return;
    }

    setIsLoading(false);
    setErrorMsg("Network error: Unable to reach Agni CRM API server.");
  }

  return (
    <main id="top" className="agn-auth-page">
      <section className="agn-auth-showcase" aria-label="Agnivridhi India CRM">
        <div className="agn-auth-showcase-shade" />
        <div className="agn-auth-showcase-inner">
          <a className="agn-auth-brand" href="#top" aria-label="Agnivridhi India">
            <img src="/logo-horizontal-dark.png" alt="Agnivridhi India" />
          </a>

          <div className="agn-auth-message">
            <p className="agn-auth-eyebrow">YOUR GROWTH PARTNER</p>
            <h1>
              Make every client
              <br />
              interaction <span>count.</span>
            </h1>
            <p className="agn-auth-lede">
              A unified CRM to manage your leads, clients, projects and team.
            </p>
          </div>

          <div className="agn-auth-features" aria-label="CRM features">
            {loginFeatures.map((feature) => (
              <div className="agn-auth-feature" key={feature.label}>
                <span className="agn-auth-feature-icon">
                  <Icon name={feature.icon} size={25} />
                </span>
                <span>{feature.label}</span>
              </div>
            ))}
          </div>

          <div className="agn-auth-signoff">
            <span />
            <p>PEOPLE&nbsp;&nbsp; PROCESS&nbsp;&nbsp; GROWTH</p>
          </div>
        </div>
      </section>

      <section className="agn-auth-area" aria-labelledby="auth-title">
        <div className="agn-auth-panel">
          <img className="agn-auth-form-logo" src="/logo-horizontal.png" alt="Agnivridhi India" />
          <p className="agn-auth-welcome">WELCOME BACK</p>
          <h2 id="auth-title">Sign in to your account</h2>
          <p className="agn-auth-description">
            Access your Agnivridhi India CRM and continue building stronger client relationships.
          </p>

          <form className="agn-auth-form" onSubmit={submit} autoComplete="on">
            <label className="agn-auth-field" htmlFor="auth-email">
              <span>Work email</span>
              <span className="agn-auth-input-wrap">
                <Icon name="mail" size={17} />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="agn-auth-field" htmlFor="auth-password">
              <span>Password</span>
              <span className="agn-auth-input-wrap">
                <Icon name="roles" size={17} />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
                <button
                  className="agn-auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                </button>
              </span>
            </label>

            <div className="agn-auth-options">
              <label className="agn-auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                className="agn-auth-forgot"
                type="button"
                onClick={() => setErrorMsg("Please contact your administrator to reset your password.")}
              >
                Forgot password?
              </button>
            </div>

            {errorMsg && (
              <div className="agn-auth-error" role="alert">
                {errorMsg}
              </div>
            )}

            <button className="agn-auth-submit" type="submit" disabled={isLoading}>
              <span>{isLoading ? "Signing in..." : "Sign in to Agnivridhi"}</span>
              <Icon name="arrow" size={17} />
            </button>
          </form>

          {import.meta.env.DEV && (
            <section className="agn-auth-demo" aria-label="Development test credentials">
              <p className="agn-auth-demo-title">Development test credentials</p>
              <dl className="agn-auth-demo-credentials">
                <div>
                  <dt>Email</dt>
                  <dd>{DEFAULT_DEMO_EMAIL}</dd>
                </div>
                <div>
                  <dt>Password</dt>
                  <dd>{DEMO_PASSWORD}</dd>
                </div>
              </dl>
              <label>
                <span className="agn-auth-demo-label">Or choose a role to fill the form</span>
                <select defaultValue="" onChange={(event) => event.target.value && handleQuickSelect(event.target.value)}>
                  <option value="" disabled>Choose a role account</option>
                  {Object.entries(MOCK_USERS).map(([accountEmail, role]) => (
                    <option value={accountEmail} key={accountEmail}>
                      {role} - {accountEmail}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          )}
        </div>
        <p className="agn-auth-secure">
          <Icon name="checkCircle" size={15} />
          Secure access to your Agnivridhi India workspace
        </p>
      </section>
    </main>
  );
}
