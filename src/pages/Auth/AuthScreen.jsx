import React from "react";
import Brand from "../../components/Brand";
import Icon from "../../components/Icon";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

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

// Seed accounts fallback map in case backend port is blocked
const MOCK_USERS = {
  "owner@agni.com": "Owner",
  "client@company.com": "Client",
  "chaddionpants@gmail.com": "Client",
  "sanjay@delhiapex.com": "Client",

  // --- BRANCH 1 (MUMBAI) ---
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

  // --- BRANCH 2 (DELHI) ---
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

  // --- BRANCH 3 (BENGALURU) ---
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

  // --- BRANCH 4 (KOLKATA) ---
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

export default function AuthScreen({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleQuickSelect = (accEmail) => {
    setEmail(accEmail);
    setPassword("password123");
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
    }

    let isNetworkError = false;
    let response;
    try {
      response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
    } catch (networkErr) {
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

      setIsLoading(false);
      onLogin(data.user.email, mappedRole, data.token);
      return;
    }

    // Only if backend server is completely unreachable (network offline), allow mock user login
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

  const isApprovedClientInStorage = (targetEmail) => {
    if (!targetEmail) return false;
    const cleanEmail = targetEmail.trim().toLowerCase();
    try {
      const savedSales = localStorage.getItem("agni_sales_clients");
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed) && parsed.some((c) => c.email && c.email.trim().toLowerCase() === cleanEmail)) {
          return true;
        }
      }
      const savedBranch = localStorage.getItem("agni_branch_clients");
      if (savedBranch) {
        const parsed = JSON.parse(savedBranch);
        if (Array.isArray(parsed) && parsed.some((c) => c.email && c.email.trim().toLowerCase() === cleanEmail)) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  return (
    <main id="top" className="auth-page">
      <section className="showcase" aria-label="Agni CRM introduction">
        <div className="mesh mesh-one" />
        <div className="mesh mesh-two" />
        <div className="showcase-inner">
          <Brand />
          <div className="showcase-copy">
            <p className="eyebrow">
              <span /> THE RELATIONSHIP OS
            </p>
            <h1>
              Make every customer
              <br />
              interaction <em>count.</em>
            </h1>
            <p className="lede">
              One focused workspace for your team to turn conversations into
              lasting customer relationships.
            </p>
          </div>
          <div className="activity-card">
            <div className="activity-top">
              <span className="pulse" /> Live activity{" "}
              <span className="activity-more">•••</span>
            </div>
            <div className="activity-row">
              <div className="avatar avatar-purple">A</div>
              <div>
                <strong>Acme Inc.</strong>
                <small>
                  Deal moved to <b>Proposal</b>
                </small>
              </div>
              <time>Now</time>
            </div>
            <div className="activity-row">
              <div className="avatar avatar-coral">M</div>
              <div>
                <strong>Maria Santos</strong>
                <small>New lead assigned to you</small>
              </div>
              <time>2m</time>
            </div>
            <div className="activity-row">
              <div className="avatar avatar-blue">S</div>
              <div>
                <strong>Summit Co.</strong>
                <small>Meeting confirmed for today</small>
              </div>
              <time>18m</time>
            </div>
          </div>
          <div className="trusted">
            <div className="trusted-avatars">
              <span>J</span>
              <span>K</span>
              <span>R</span>
              <span>+</span>
            </div>
            <p>
              Trusted by growing teams
              <br />
              <b>around the world</b>
            </p>
          </div>
        </div>
        <p className="copyright">© 2026 Agni CRM. Built for momentum.</p>
      </section>

      <section className="auth-area" aria-labelledby="form-title">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-panel" style={{ maxWidth: 460, width: "100%" }}>
          <div className="form-intro">
            <p className="eyebrow">WELCOME BACK</p>
            <h2 id="form-title">Sign in to your account</h2>
            <p>Enter credentials or click a staff role below for 1-click access.</p>
          </div>

          {/* Quick Seed Accounts Dropdown Selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#9a74e9", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              ⚡ Quick Select Seed Account (4 Branches & All Roles)
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickSelect(e.target.value);
                }
              }}
              value={email}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid rgba(154, 116, 233, 0.4)",
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              }}
            >
              <option value="">-- Choose Account to Auto-Fill Credentials --</option>

              <optgroup label="👑 PAN-INDIA OWNER">
                <option value="owner@agni.com">Devika Shah (Owner) — owner@agni.com</option>
              </optgroup>

              <optgroup label="👥 CLIENT ACCOUNTS">
                <option value="client@company.com">Rajesh Sharma (Sunrise Ent.) — client@company.com</option>
                <option value="chaddionpants@gmail.com">Chad D. Pants (Chaddi Ent.) — chaddionpants@gmail.com</option>
                <option value="sanjay@delhiapex.com">Sanjay Singhania (Delhi Apex) — sanjay@delhiapex.com</option>
              </optgroup>

              <optgroup label="🏛️ BRANCH 1: WEST ZONE (MUMBAI)">
                <option value="ariana@agni.com">Ariana Lee — [Branch Manager] ariana@agni.com</option>
                <option value="eli@agni.com">Eli Brooks — [Sales Manager] eli@agni.com</option>
                <option value="mia@agni.com">Mia Rose — [Salesperson] mia@agni.com</option>
                <option value="lucas@agni.com">Lucas Scott — [Salesperson] lucas@agni.com</option>
                <option value="noah@agni.com">Noah Kim — [IT Lead] noah@agni.com</option>
                <option value="sophia.it@agni.com">Sophia Patel — [IT Specialist] sophia.it@agni.com</option>
                <option value="daniel@agni.com">Daniel Cruz — [Marketing Lead] daniel@agni.com</option>
                <option value="chloe@agni.com">Chloe Bennett — [Marketing Assoc] chloe@agni.com</option>
                <option value="admin@agni.com">Vikramaditya Roy — [Admin Lead] admin@agni.com</option>
                <option value="priya.admin@agni.com">Priya Nair — [Admin Officer] priya.admin@agni.com</option>
              </optgroup>

              <optgroup label="🏛️ BRANCH 2: NORTH ZONE (DELHI)">
                <option value="rajesh.bm@agni.com">Rajesh Khanna — [Branch Manager] rajesh.bm@agni.com</option>
                <option value="ananya.sm@agni.com">Ananya Sen — [Sales Manager] ananya.sm@agni.com</option>
                <option value="rohan.sales@agni.com">Rohan Gupta — [Salesperson] rohan.sales@agni.com</option>
                <option value="kavya.sales@agni.com">Kavya Sharma — [Salesperson] kavya.sales@agni.com</option>
                <option value="aarav.it@agni.com">Aarav Mehta — [IT Lead] aarav.it@agni.com</option>
                <option value="ishaan.it@agni.com">Ishaan Verma — [Sys Admin] ishaan.it@agni.com</option>
                <option value="neha.mkt@agni.com">Neha Kapoor — [Marketing Lead] neha.mkt@agni.com</option>
                <option value="sanya.mkt@agni.com">Sanya Malhotra — [Digital Specialist] sanya.mkt@agni.com</option>
                <option value="amit.admin@agni.com">Amit Joshi — [Admin Lead] amit.admin@agni.com</option>
                <option value="simran.admin@agni.com">Simran Kaur — [Admin Officer] simran.admin@agni.com</option>
              </optgroup>

              <optgroup label="🏛️ BRANCH 3: SOUTH ZONE (BENGALURU)">
                <option value="suresh.bm@agni.com">Suresh Reddy — [Branch Manager] suresh.bm@agni.com</option>
                <option value="karthik.sm@agni.com">Karthik Iyer — [Sales Manager] karthik.sm@agni.com</option>
                <option value="arjun.sales@agni.com">Arjun Hegde — [Salesperson] arjun.sales@agni.com</option>
                <option value="deepa.sales@agni.com">Deepa Rao — [Salesperson] deepa.sales@agni.com</option>
                <option value="vikram.it@agni.com">Vikram Rao — [Cloud Architect] vikram.it@agni.com</option>
                <option value="niharika.it@agni.com">Niharika Bhat — [IT Lead] niharika.it@agni.com</option>
                <option value="pooja.mkt@agni.com">Pooja Menon — [Marketing Lead] pooja.mkt@agni.com</option>
                <option value="tarun.mkt@agni.com">Tarun Kumar — [Campaign Lead] tarun.mkt@agni.com</option>
                <option value="lakshmi.admin@agni.com">Lakshmi Narayanan — [Admin Lead] lakshmi.admin@agni.com</option>
                <option value="rahul.admin@agni.com">Rahul Gowda — [Admin Officer] rahul.admin@agni.com</option>
              </optgroup>

              <optgroup label="🏛️ BRANCH 4: EAST ZONE (KOLKATA)">
                <option value="subhash.bm@agni.com">Subhash Banerjee — [Branch Manager] subhash.bm@agni.com</option>
                <option value="debolina.sm@agni.com">Debolina Roy — [Sales Manager] debolina.sm@agni.com</option>
                <option value="sourav.sales@agni.com">Sourav Das — [Salesperson] sourav.sales@agni.com</option>
                <option value="riya.sales@agni.com">Riya Mukherjee — [Salesperson] riya.sales@agni.com</option>
                <option value="arindam.it@agni.com">Arindam Bose — [IT Lead] arindam.it@agni.com</option>
                <option value="swati.it@agni.com">Swati Ganguly — [Network Eng] swati.it@agni.com</option>
                <option value="tanmoy.mkt@agni.com">Tanmoy Dutta — [Marketing Lead] tanmoy.mkt@agni.com</option>
                <option value="sneha.mkt@agni.com">Sneha Ghosh — [Brand Assoc] sneha.mkt@agni.com</option>
                <option value="pronab.admin@agni.com">Pronab Paul — [Admin Lead] pronab.admin@agni.com</option>
                <option value="moumita.admin@agni.com">Moumita Kar — [Admin Officer] moumita.admin@agni.com</option>
              </optgroup>
            </select>
          </div>

          <form onSubmit={submit} autoComplete="off">
            <label className="field-label">
              Work email
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="field-label">
              Password
              <span className="password-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                </button>
              </span>
            </label>

            <div className="form-options">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span />
                Remember me
              </label>
              <a href="#forgot">Forgot password?</a>
            </div>

            {errorMsg && (
              <div
                style={{
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
                role="alert"
              >
                ⚠️ {errorMsg}
              </div>
            )}

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign in to Agni"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </div>
        <p className="secure">
          <span>
            <Icon name="check" size={14} />
          </span>
          Your data is encrypted and authenticated via PostgreSQL &amp; JWT
        </p>
      </section>
    </main>
  );
}

