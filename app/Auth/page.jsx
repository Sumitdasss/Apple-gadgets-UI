"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { showReviewToast } from "../Componant/SavedToast";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  LogIn,
  UserPlus,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://apple-gadgets-ui-backend.vercel.app";

const ADMIN_PANEL_URL =
  "https://apple-gadgets-ui-adminpanel.vercel.app";

const ADMIN_ROLES = ["admin", "subadmin","order_manager"];
const FLIP_DURATION = 900;
const LAMP_REVEAL_DELAY = 550;
const OTP_COOLDOWN = 30;
const PHONE_REGEX = /^01[3-9]\d{8}$/;

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };

  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return {
    score,
    label: ["Weak", "Fair", "Good", "Strong", "Excellent"][score],
  };
}

export default function AuthPage() {
  const router = useRouter();

  const revealTimer = useRef(null);
  const flipTimer = useRef(null);
  const tugTimer = useRef(null);
  const otpInputRef = useRef(null);

  const [lampOn, setLampOn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("login");
  const [flipping, setFlipping] = useState(false);
  const [tugging, setTugging] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const isOtpStep = step === "register-otp" || step === "login-otp";
  const isRegisterOtp = step === "register-otp";
  const flipped = formType === "register";

  const passwordStrength = useMemo(
    () => getPasswordStrength(registerData.password),
    [registerData.password],
  );

  useEffect(() => {
    document.body.style.background = "#11120d";

    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(revealTimer.current);
      window.clearTimeout(flipTimer.current);
      window.clearTimeout(tugTimer.current);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!isOtpStep) return;

    const timer = window.setTimeout(
      () => otpInputRef.current?.focus(),
      450,
    );

    return () => window.clearTimeout(timer);
  }, [isOtpStep]);

  const showMessage = useCallback((text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  // Success message + SaveToast
  const showSuccessToast = useCallback(
    (text) => {
      showMessage(text, "success");

      try {
        showReviewToast(text);
      } catch (error) {
        console.error("SaveToast error:", error);
      }
    },
    [showMessage],
  );

  const resetToForm = useCallback(() => {
    setStep("form");
    setOtp("");
    setCooldown(0);
    clearMessage();
  }, [clearMessage]);

  // 3D flip: login <-> register
  const flipTo = useCallback(
    (type) => {
      if (type === formType) {
        resetToForm();
        return;
      }

      setFlipping(true);
      setFormType(type);
      resetToForm();

      window.clearTimeout(flipTimer.current);

      flipTimer.current = window.setTimeout(() => {
        setFlipping(false);
      }, FLIP_DURATION);
    },
    [formType, resetToForm],
  );

  // Lamp cord pull
  const pullLamp = () => {
    if (loading) return;

    setTugging(true);
    window.clearTimeout(tugTimer.current);

    tugTimer.current = window.setTimeout(() => {
      setTugging(false);
    }, 450);

    if (!lampOn) {
      setLampOn(true);

      window.clearTimeout(revealTimer.current);

      revealTimer.current = window.setTimeout(() => {
        setShowForm(true);
      }, LAMP_REVEAL_DELAY);

      return;
    }

    flipTo(formType === "login" ? "register" : "login");
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveSession = (result) => {
    const token = result?.token || result?.data?.token;
    const user = result?.user || result?.data?.user;

    try {
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Unable to save session:", error);
    }

    const role = String(user?.role || "customer").toLowerCase();

    if (ADMIN_ROLES.includes(role)) {
      window.location.href = ADMIN_PANEL_URL;
    } else {
      router.push("/");
    }
  };

  const request = async (endpoint, body) => {
    let response;

    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(
        "Server-er sathe connect kora jachchhe na. Internet check kore abar chesta korun.",
      );
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || result.error || "Something went wrong.",
      );
    }

    return result;
  };

  const extractAuth = (result) => ({
    token: result?.token || result?.data?.token,
    user: result?.user || result?.data?.user,
  });

  // LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();
    clearMessage();

    const payload = {
      email: loginData.email.trim().toLowerCase(),
      password: loginData.password,
    };

    setLoading(true);

    try {
      const result = await request("/api/users/login", payload);
      const { token, user } = extractAuth(result);

      if (token && user) {
        saveSession(result);
        return;
      }

      setStep("login-otp");
      setCooldown(OTP_COOLDOWN);

      showSuccessToast(
        result.message || "Check your email for the verification code.",
      );
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (event) => {
    event.preventDefault();
    clearMessage();

    const phone = registerData.phone.replace(/[\s-]/g, "");

    if (!PHONE_REGEX.test(phone)) {
      showMessage("Sothik Bangladeshi phone number din (e.g. 01XXXXXXXXX).");
      return;
    }

    const payload = {
      ...registerData,
      name: registerData.name.trim(),
      email: registerData.email.trim().toLowerCase(),
      phone,
    };

    setLoading(true);

    try {
      const result = await request("/api/users/register", payload);

      setRegisterData((previous) => ({
        ...previous,
        email: payload.email,
        phone,
      }));

      setStep("register-otp");
      setCooldown(OTP_COOLDOWN);

      showSuccessToast(
        result.message ||
          "Account created. Enter the OTP sent to your email.",
      );
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // VERIFY EMAIL OTP OR LOGIN OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearMessage();
    setLoading(true);

    try {
      const endpoint = isRegisterOtp
        ? "/api/users/verify-email-otp"
        : "/api/users/verify-login-otp";

      const email = (
        isRegisterOtp ? registerData.email : loginData.email
      )
        .trim()
        .toLowerCase();

      const result = await request(endpoint, {
        email,
        otp: otp.trim(),
      });

      const { token, user } = extractAuth(result);

      if (token && user) {
        saveSession(result);
        return;
      }

      if (isRegisterOtp) {
        setLoginData((previous) => ({
          ...previous,
          email: registerData.email,
        }));

        flipTo("login");

        showSuccessToast(
          result.message ||
            "Email verified successfully. You can now log in.",
        );
      } else {
        resetToForm();

        showSuccessToast(
          result.message ||
            "Verification completed. Please log in again if needed.",
        );
      }
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;

    clearMessage();
    setLoading(true);

    try {
      const email = isRegisterOtp
        ? registerData.email
        : loginData.email;

      const endpoint = isRegisterOtp
        ? "/api/users/resend-email-otp"
        : "/api/users/login";

      const body = isRegisterOtp
        ? { email: email.trim().toLowerCase() }
        : {
            email: loginData.email.trim().toLowerCase(),
            password: loginData.password,
          };

      const result = await request(endpoint, body);

      setCooldown(OTP_COOLDOWN);

      showSuccessToast(
        result.message || "A new verification code has been requested.",
      );
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = () =>
    message ? (
      <div
        className={`message ${
          messageType === "success" ? "message-success" : ""
        }`}
        role={messageType === "success" ? "status" : "alert"}
      >
        {messageType === "success" ? (
          <CheckCircle2 size={17} />
        ) : (
          <span className="message-error-dot" />
        )}

        <span>{message}</span>
      </div>
    ) : null;

  const renderPasswordToggle = () => (
    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowPassword((value) => !value)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  const renderSubmitLabel = (label) =>
    loading ? (
      <LoaderCircle className="spinner" size={19} />
    ) : (
      <>
        {label}
        <ArrowRight size={18} />
      </>
    );

  // OTP FORM
  const renderOtpForm = () => (
    <form className="auth-form" onSubmit={handleVerifyOtp}>
      <label htmlFor="otp">VERIFICATION CODE</label>

      <div className="input-wrap otp-wrap">
        <ShieldCheck size={18} />

        <input
          ref={otpInputRef}
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          value={otp}
          onChange={(event) =>
            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          required
          minLength={4}
          maxLength={6}
        />
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {renderSubmitLabel("VERIFY CODE")}
      </button>

      <button
        type="button"
        className="text-button resend-button"
        onClick={handleResendOtp}
        disabled={loading || cooldown > 0}
      >
        <RotateCcw size={14} />

        {cooldown > 0
          ? `Resend code in ${cooldown}s`
          : "Resend verification code"}
      </button>

      <button
        type="button"
        className="back-button"
        onClick={resetToForm}
      >
        <ArrowLeft size={15} />
        Back to form
      </button>
    </form>
  );

  // LOGIN FORM
  const renderLoginForm = () => (
    <form className="auth-form" onSubmit={handleLogin}>
      <label htmlFor="login-email">EMAIL ADDRESS</label>

      <div className="input-wrap">
        <Mail size={18} />

        <input
          id="login-email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={loginData.email}
          onChange={handleLoginChange}
          required
        />
      </div>

      <label htmlFor="login-password">PASSWORD</label>

      <div className="input-wrap">
        <Lock size={18} />

        <input
          id="login-password"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={loginData.password}
          onChange={handleLoginChange}
          required
        />

        {renderPasswordToggle()}
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {renderSubmitLabel("SIGN IN")}
      </button>

      <div className="form-switch">
        <span>New around here?</span>

        <button
          type="button"
          className="text-button"
          onClick={() => flipTo("register")}
        >
          Create an account
        </button>
      </div>
    </form>
  );

  // REGISTER FORM
  const renderRegisterForm = () => (
    <form className="auth-form register-form" onSubmit={handleRegister}>
      <label htmlFor="register-name">FULL NAME</label>

      <div className="input-wrap">
        <User size={18} />

        <input
          id="register-name"
          type="text"
          name="name"
          placeholder="Your full name"
          autoComplete="name"
          value={registerData.name}
          onChange={handleRegisterChange}
          required
        />
      </div>

      <label htmlFor="register-email">EMAIL ADDRESS</label>

      <div className="input-wrap">
        <Mail size={18} />

        <input
          id="register-email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={registerData.email}
          onChange={handleRegisterChange}
          required
        />
      </div>

      <label htmlFor="register-phone">PHONE NUMBER</label>

      <div className="input-wrap">
        <Phone size={18} />

        <input
          id="register-phone"
          type="tel"
          name="phone"
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
          inputMode="numeric"
          value={registerData.phone}
          onChange={handleRegisterChange}
          required
        />
      </div>

      <label htmlFor="register-password">PASSWORD</label>

      <div className="input-wrap input-wrap-tight">
        <Lock size={18} />

        <input
          id="register-password"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={registerData.password}
          onChange={handleRegisterChange}
          minLength={6}
          required
        />

        {renderPasswordToggle()}
      </div>

      <div
        className={`strength strength-${passwordStrength.score} ${
          registerData.password ? "strength-visible" : ""
        }`}
        aria-live="polite"
      >
        <div className="strength-bars">
          <span />
          <span />
          <span />
          <span />
        </div>

        <small>{passwordStrength.label}</small>
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {renderSubmitLabel("CREATE ACCOUNT")}
      </button>

      <div className="form-switch">
        <span>Already a member?</span>

        <button
          type="button"
          className="text-button"
          onClick={() => flipTo("login")}
        >
          Sign in
        </button>
      </div>
    </form>
  );

  // 3D CARD FACES
  const renderFace = (type) => {
    const active = formType === type;
    const showOtp = active && isOtpStep;
    const isLogin = type === "login";

    return (
      <div
        className={`face ${isLogin ? "face-front" : "face-back"} ${
          active ? "active" : "inactive"
        }`}
        aria-hidden={!active}
        key={type}
      >
        <div className="panel-topline">
          <span className="panel-indicator">
            <span />
            {showOtp
              ? "VERIFICATION"
              : isLogin
                ? "SIGN IN"
                : "NEW ACCOUNT"}
          </span>

          <span className="secure-label">
            <ShieldCheck size={13} />
            SECURE ACCESS
          </span>
        </div>

        <div className="form-heading">
          <div className="form-icon">
            {showOtp ? (
              <ShieldCheck size={23} />
            ) : isLogin ? (
              <LogIn size={23} />
            ) : (
              <UserPlus size={23} />
            )}
          </div>

          <div>
            <h2>
              {showOtp
                ? "Check your inbox"
                : isLogin
                  ? "Welcome back."
                  : "Join Apple Gadgets."}
            </h2>

            <p>
              {showOtp
                ? "Enter the code we sent to your email."
                : isLogin
                  ? "Sign in to continue your journey."
                  : "Create your account and get started."}
            </p>
          </div>
        </div>

        {active && renderMessage()}

        {showOtp
          ? renderOtpForm()
          : isLogin
            ? renderLoginForm()
            : renderRegisterForm()}

        <div className="panel-footer">
          <span>APPLE GADGETS</span>
          <span className="footer-separator">•</span>
          <span>PREMIUM EXPERIENCE</span>
        </div>
      </div>
    );
  };

  return (
    <main className={`auth-page ${lampOn ? "lamp-on" : ""}`}>
      <div className="grain" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>

        <span className="brand-name">APPLE GADGETS</span>
        <span className="brand-caption">YOUR APPLE. YOUR WORLD.</span>
      </header>

      <section className="scene">
        <div className={`light-beam ${lampOn ? "beam-active" : ""}`} />

        {/* LAMP */}
        <div className={`lamp-scene ${lampOn ? "illuminated" : ""}`}>
          <div className="lamp-wire" />

          <div className="lamp-shade">
            <div className="shade-top" />
            <div className="shade-body" />
            <div className="shade-bottom" />
          </div>

          <div className="lamp-bulb">
            <div className="bulb-core" />
          </div>

          <div className="lamp-stem" />
          <div className="lamp-base" />
          <div className="lamp-floor-glow" />

          <div className="cord-area">
            <div className={`cord-line ${tugging ? "cord-tug" : ""}`} />

            <button
              type="button"
              className={`pull-handle ${tugging ? "handle-tug" : ""}`}
              onClick={pullLamp}
              aria-label={
                !lampOn
                  ? "Pull to turn on the lamp"
                  : "Pull to switch between login and register"
              }
              title={
                !lampOn
                  ? "Pull to turn on the lamp"
                  : "Pull to flip Login/Register"
              }
            >
              <span className="handle-string" />
              <span className="handle-ball" />
            </button>
          </div>

          <div className="lamp-label">
            <span className={`label-dot ${lampOn ? "active-dot" : ""}`} />
            {lampOn ? "PULL TO FLIP" : "PULL TO TURN ON"}
          </div>
        </div>

        {/* INTRO */}
        <div className={`intro-copy ${showForm ? "intro-hidden" : ""}`}>
          <p className="eyebrow">
            <span />
            PREMIUM APPLE EXPERIENCE
          </p>

          <h1>
            A little light.
            <br />
            <span>A world of Apple.</span>
          </h1>

          <p className="intro-description">
            Pull the cord to sign in or create your Apple Gadgets account.
            Your next experience starts here.
          </p>

          <div className="intro-bottom">
            <span className="intro-line" />
            <span>DESIGNED FOR APPLE LOVERS</span>
          </div>
        </div>

        {/* 3D FLIP CARD */}
        <div
          className={`auth-panel ${
            showForm && lampOn ? "panel-visible" : ""
          }`}
          aria-hidden={!showForm}
        >
          <div
            className={`flip-card ${flipped ? "flipped" : ""} ${
              flipping ? "flipping" : ""
            }`}
          >
            {renderFace("login")}
            {renderFace("register")}
          </div>
        </div>
      </section>

      <footer className="page-footer">
        <span>© {new Date().getFullYear()} APPLE GADGETS</span>

        <span className="footer-center">
          <span className={lampOn ? "footer-light-on" : ""} />
          {lampOn ? "THE LIGHT IS ON" : "WAITING FOR A SPARK"}
        </span>

        <span>LIGHT UP YOUR WORLD</span>
      </footer>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #11120d;
        }

        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        button,
        input {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .auth-page {
          --gold: #d7b86b;
          --gold-bright: #f3d68c;
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: #f5f0df;
          background:
            radial-gradient(
              ellipse at 18% 48%,
              rgba(190, 156, 68, 0.08),
              transparent 40%
            ),
            radial-gradient(
              ellipse at 80% 20%,
              rgba(209, 177, 100, 0.045),
              transparent 32%
            ),
            #11120d;
          isolation: isolate;
        }

        .grain {
          position: absolute;
          inset: 0;
          z-index: -1;
          opacity: 0.14;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
        }

        .ambient {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: -1;
          opacity: 0.08;
          transition: opacity 1s ease;
        }

        .ambient-one {
          top: 20%;
          left: -180px;
          background: #cba34c;
        }

        .ambient-two {
          right: -220px;
          bottom: -100px;
          background: #b8a15f;
        }

        .lamp-on .ambient {
          opacity: 0.18;
        }

        .brand {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 29px 6.5%;
        }

        .brand-mark {
          width: 27px;
          height: 27px;
          border: 1px solid rgba(215, 184, 107, 0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .brand-mark span {
          width: 2px;
          border-radius: 2px;
          background: var(--gold);
        }

        .brand-mark span:nth-child(1) {
          height: 7px;
        }

        .brand-mark span:nth-child(2) {
          height: 13px;
        }

        .brand-mark span:nth-child(3) {
          height: 9px;
        }

        .brand-name {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 3px;
          white-space: nowrap;
        }

        .brand-caption {
          padding-left: 13px;
          margin-left: 4px;
          border-left: 1px solid #414233;
          color: #81816f;
          font-size: 9px;
          letter-spacing: 1.8px;
        }

        .scene {
          width: min(1200px, 100%);
          flex: 1;
          min-height: 650px;
          margin: 0 auto;
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 20px 6.5% 55px;
        }

        .light-beam {
          position: absolute;
          top: 70px;
          left: 3%;
          width: 48%;
          height: 70%;
          background: radial-gradient(
            ellipse at 50% 40%,
            rgba(246, 213, 137, 0.14),
            rgba(226, 187, 99, 0.045) 35%,
            transparent 70%
          );
          opacity: 0;
          transform: scale(0.75);
          transition: opacity 1s ease, transform 1.1s ease;
          pointer-events: none;
        }

        .light-beam.beam-active {
          opacity: 1;
          transform: scale(1.2);
        }

        /* LAMP */
        .lamp-scene {
          position: relative;
          width: 100%;
          height: 510px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateX(-10px);
          z-index: 2;
        }

        .lamp-wire {
          position: absolute;
          width: 2px;
          height: 86px;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(#6a6a57, #a09b7e);
        }

        .lamp-shade {
          position: absolute;
          top: 85px;
          left: 50%;
          transform: translateX(-50%);
          width: 215px;
          height: 117px;
          filter: drop-shadow(0 15px 16px rgba(0, 0, 0, 0.25));
          z-index: 3;
        }

        .shade-top {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 25px;
          height: 12px;
          border-radius: 5px 5px 1px 1px;
          background: linear-gradient(90deg, #716b50, #b9a77b, #70694d);
        }

        .shade-body {
          position: absolute;
          inset: 8px 0 0;
          background: linear-gradient(
            100deg,
            #716849 0%,
            #c6b587 20%,
            #ead8a6 48%,
            #b5a16e 77%,
            #6c6348 100%
          );
          clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
        }

        .shade-bottom {
          position: absolute;
          bottom: -3px;
          left: -5px;
          width: calc(100% + 10px);
          height: 9px;
          border-radius: 50%;
          background: linear-gradient(90deg, #766c4e, #e0cc96, #716849);
        }

        .lamp-bulb {
          position: absolute;
          top: 196px;
          left: 50%;
          transform: translateX(-50%);
          width: 35px;
          height: 43px;
          border-radius: 45% 45% 42% 42%;
          background: #b5aa7b;
          z-index: 2;
          transition: background 0.6s ease, box-shadow 0.7s ease;
        }

        .bulb-core {
          position: absolute;
          top: 9px;
          left: 8px;
          width: 19px;
          height: 22px;
          border-radius: 50%;
          background: #e9d9a7;
          opacity: 0.3;
          transition: opacity 0.5s ease, box-shadow 0.5s ease;
        }

        .illuminated .lamp-bulb {
          background: #fff4c5;
          box-shadow:
            0 0 25px 8px rgba(255, 222, 132, 0.75),
            0 0 90px 40px rgba(255, 206, 94, 0.22);
        }

        .illuminated .bulb-core {
          opacity: 1;
          box-shadow: 0 0 20px 8px rgba(255, 226, 139, 0.8);
        }

        .lamp-stem {
          position: absolute;
          top: 235px;
          left: 50%;
          transform: translateX(-50%);
          height: 178px;
          width: 13px;
          border-radius: 5px;
          background: linear-gradient(
            90deg,
            #59533e,
            #b8a779 34%,
            #d2c092 50%,
            #817653 100%
          );
          z-index: 1;
        }

        .lamp-base {
          position: absolute;
          top: 390px;
          left: 50%;
          transform: translateX(-50%);
          width: 150px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(180deg, #c2b182, #7f7554 35%, #403c2c);
          box-shadow: 0 13px 20px rgba(0, 0, 0, 0.4);
          z-index: 2;
        }

        .lamp-floor-glow {
          position: absolute;
          top: 403px;
          left: 50%;
          transform: translateX(-50%);
          width: 230px;
          height: 85px;
          background: radial-gradient(
            ellipse,
            rgba(255, 211, 111, 0.22),
            transparent 68%
          );
          opacity: 0.1;
          transition: opacity 0.8s ease;
        }

        .illuminated .lamp-floor-glow {
          opacity: 1;
        }

        .cord-area {
          position: absolute;
          top: 172px;
          left: calc(50% + 104px);
          width: 50px;
          height: 150px;
          z-index: 10;
        }

        .cord-line {
          position: absolute;
          left: 13px;
          top: 0;
          width: 1px;
          height: 79px;
          background: #a9a18a;
          transform-origin: top center;
        }

        .cord-line.cord-tug {
          animation: cordStretch 0.45s ease-out;
        }

        .pull-handle {
          position: absolute;
          left: 0;
          top: 62px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: grab;
          touch-action: manipulation;
        }

        .pull-handle:focus-visible {
          outline: 1px dashed var(--gold);
          outline-offset: 6px;
        }

        .pull-handle:active {
          cursor: grabbing;
          transform: translateY(9px);
        }

        .pull-handle.handle-tug {
          animation: handleTug 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
        }

        @keyframes handleTug {
          0%, 100% { transform: translateY(0); }
          35% { transform: translateY(16px); }
          70% { transform: translateY(-3px); }
        }

        @keyframes cordStretch {
          0%, 100% { transform: scaleY(1); }
          35% { transform: scaleY(1.2); }
          70% { transform: scaleY(0.96); }
        }

        .handle-string {
          width: 1px;
          height: 36px;
          background: #d1c4a0;
        }

        .handle-ball {
          width: 14px;
          height: 23px;
          border-radius: 45% 45% 50% 50%;
          background: linear-gradient(90deg, #796a46, #e3ce94 45%, #a48e5b);
          box-shadow:
            inset -2px -2px 3px rgba(0, 0, 0, 0.25),
            0 0 0 5px rgba(215, 184, 107, 0.05);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }

        .pull-handle:hover .handle-ball {
          box-shadow:
            0 0 0 7px rgba(215, 184, 107, 0.09),
            0 0 22px rgba(215, 184, 107, 0.35);
          transform: scale(1.08);
        }

        .lamp-label {
          position: absolute;
          top: 332px;
          left: calc(50% + 125px);
          display: flex;
          align-items: center;
          gap: 7px;
          width: 145px;
          color: #8b8974;
          font-size: 8px;
          letter-spacing: 1.2px;
          white-space: nowrap;
        }

        .label-dot,
        .panel-indicator > span,
        .footer-center > span {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #777663;
        }

        .active-dot,
        .footer-light-on {
          background: #e7c66e !important;
          box-shadow: 0 0 10px rgba(231, 198, 110, 0.8);
        }

        /* INTRO */
        .intro-copy {
          position: relative;
          z-index: 2;
          max-width: 420px;
          padding-left: 35px;
          opacity: 1;
          transform: translateX(0);
          transition: opacity 0.55s ease, transform 0.65s ease;
        }

        .intro-copy.intro-hidden {
          opacity: 0;
          transform: translateX(-35px);
          pointer-events: none;
          position: absolute;
          right: 0;
          visibility: hidden;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--gold);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2.4px;
          margin: 0 0 26px;
        }

        .eyebrow span {
          width: 25px;
          height: 1px;
          background: var(--gold);
        }

        .intro-copy h1 {
          margin: 0;
          font-size: clamp(35px, 4.3vw, 58px);
          line-height: 1.16;
          font-weight: 500;
          letter-spacing: -2.7px;
        }

        .intro-copy h1 span {
          color: var(--gold);
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: 400;
        }

        .intro-description {
          max-width: 310px;
          margin: 23px 0 0;
          color: #9b9b8a;
          font-size: 13px;
          line-height: 1.9;
        }

        .intro-bottom {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 42px;
          color: #767665;
          font-size: 8px;
          letter-spacing: 1.8px;
        }

        .intro-line {
          display: inline-block;
          width: 34px;
          height: 1px;
          background: #5e5c45;
        }

        /* 3D FLIP CARD */
        .auth-panel {
          position: absolute;
          z-index: 6;
          right: 6.5%;
          top: 50%;
          width: min(430px, 43%);
          perspective: 1600px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translate(35px, -46%);
          transition:
            opacity 0.65s ease,
            transform 0.7s ease,
            visibility 0.65s;
        }

        .auth-panel.panel-visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translate(0, -50%);
        }

        .flip-card {
          display: grid;
          position: relative;
          transform-style: preserve-3d;
          transition: transform ${FLIP_DURATION}ms
            cubic-bezier(0.45, 0.05, 0.2, 1.1);
          will-change: transform;
        }

        .flip-card.flipped {
          transform: rotateY(180deg);
        }

        .face {
          grid-area: 1 / 1;
          position: relative;
          max-height: calc(100svh - 170px);
          overflow-x: hidden;
          overflow-y: auto;
          padding: 32px 34px 24px;
          border: 1px solid rgba(215, 184, 107, 0.2);
          border-radius: 9px;
          background: linear-gradient(
            145deg,
            rgba(37, 38, 27, 0.97),
            rgba(19, 21, 15, 0.98)
          );
          box-shadow:
            0 25px 90px rgba(0, 0, 0, 0.4),
            0 0 70px rgba(224, 190, 102, 0.065),
            inset 0 1px rgba(255, 255, 255, 0.025);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          scrollbar-width: thin;
          scrollbar-color: #3b3c2c transparent;
        }

        .face-back {
          transform: rotateY(180deg);
        }

        .face.inactive {
          visibility: hidden;
          transition: visibility 0s linear ${FLIP_DURATION / 2}ms;
        }

        .face.active {
          visibility: visible;
          transition: visibility 0s;
        }

        .face::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 236, 176, 0.2) 50%,
            transparent 70%
          );
        }

        .flipping .face.active::after {
          animation: sheen ${FLIP_DURATION}ms ease-in-out;
        }

        @keyframes sheen {
          0% {
            opacity: 0;
            transform: translateX(-100%);
          }
          30% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .panel-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.065);
        }

        .panel-indicator,
        .secure-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 8px;
          letter-spacing: 1.6px;
          color: #a8a58e;
        }

        .panel-indicator > span {
          background: var(--gold);
        }

        .secure-label {
          gap: 5px;
          color: #777b68;
          letter-spacing: 0.8px;
        }

        .secure-label svg {
          color: var(--gold);
        }

        .form-heading {
          display: flex;
          gap: 15px;
          align-items: center;
          margin: 25px 0 24px;
        }

        .form-icon {
          display: flex;
          flex: 0 0 47px;
          width: 47px;
          height: 47px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(215, 184, 107, 0.25);
          border-radius: 7px;
          background: rgba(215, 184, 107, 0.07);
          color: var(--gold);
        }

        .form-heading h2 {
          margin: 0 0 6px;
          color: #f1ecd9;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 27px;
          font-weight: 400;
          letter-spacing: -0.7px;
        }

        .form-heading p {
          margin: 0;
          color: #939383;
          font-size: 11px;
          line-height: 1.7;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
        }

        .auth-form label {
          margin: 0 0 8px;
          color: #aaa891;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.3px;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 48px;
          padding: 0 13px;
          margin-bottom: 19px;
          border: 1px solid #393a2d;
          border-radius: 5px;
          background: rgba(11, 12, 9, 0.48);
          color: #8e8c74;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .input-wrap-tight {
          margin-bottom: 10px;
        }

        .input-wrap:focus-within {
          border-color: rgba(215, 184, 107, 0.75);
          background: rgba(18, 18, 12, 0.9);
          box-shadow: 0 0 0 3px rgba(215, 184, 107, 0.055);
        }

        .input-wrap > svg {
          flex-shrink: 0;
        }

        .input-wrap input {
          width: 100%;
          min-width: 0;
          height: 46px;
          padding: 0;
          border: 0;
          outline: 0;
          color: #eee9d8;
          background: transparent;
          font-size: 12px;
        }

        .input-wrap input::placeholder {
          color: #626356;
        }

        .input-wrap input:-webkit-autofill {
          -webkit-text-fill-color: #eee9d8;
          box-shadow: 0 0 0 40px #14150f inset;
          caret-color: #eee9d8;
        }

        .otp-wrap input {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas,
            monospace;
          font-size: 20px;
          letter-spacing: 10px;
          text-align: center;
          padding-left: 10px;
        }

        .password-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 5px;
          border: 0;
          background: transparent;
          color: #8c8b78;
          cursor: pointer;
        }

        .password-toggle:hover {
          color: var(--gold);
        }

        .strength {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 14px;
          margin-bottom: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .strength-visible {
          opacity: 1;
        }

        .strength-bars {
          display: flex;
          flex: 1;
          gap: 4px;
        }

        .strength-bars span {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: #34352a;
          transition: background 0.3s ease;
        }

        .strength small {
          min-width: 58px;
          text-align: right;
          color: #8f8f7c;
          font-size: 9px;
          letter-spacing: 0.8px;
        }

        .strength-1 .strength-bars span:nth-child(-n + 1) {
          background: #d4705a;
        }

        .strength-2 .strength-bars span:nth-child(-n + 2) {
          background: #d9a65a;
        }

        .strength-3 .strength-bars span:nth-child(-n + 3),
        .strength-4 .strength-bars span:nth-child(-n + 4) {
          background: #9cc27a;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 49px;
          margin-top: 3px;
          border: 1px solid #e3c77d;
          border-radius: 5px;
          background: linear-gradient(110deg, #c7a85d, #e8cf8e);
          color: #242114;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 8px 23px rgba(209, 175, 96, 0.16);
        }

        .submit-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .submit-button:focus-visible,
        .text-button:focus-visible,
        .back-button:focus-visible,
        .password-toggle:focus-visible {
          outline: 1px solid var(--gold-bright);
          outline-offset: 3px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-switch {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 23px;
          color: #8c8c7a;
          font-size: 11px;
        }

        .text-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--gold-bright);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .text-button:hover:not(:disabled) {
          color: #fff0bd;
          text-decoration: underline;
        }

        .text-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .panel-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 25px;
          padding-top: 17px;
          border-top: 1px solid rgba(255, 255, 255, 0.055);
          color: #6e6e5d;
          font-size: 8px;
          letter-spacing: 1.6px;
        }

        .footer-separator {
          color: var(--gold);
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: -7px 0 18px;
          padding: 11px 12px;
          border: 1px solid rgba(226, 113, 90, 0.25);
          border-radius: 5px;
          background: rgba(165, 65, 48, 0.08);
          color: #efb1a4;
          font-size: 11px;
          line-height: 1.65;
          overflow-wrap: anywhere;
          animation: messageIn 0.35s ease;
        }

        @keyframes messageIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message-success {
          border-color: rgba(143, 184, 118, 0.25);
          background: rgba(94, 140, 74, 0.09);
          color: #bdd7a7;
        }

        .message-success svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .message-error-dot {
          flex: 0 0 7px;
          width: 7px;
          height: 7px;
          margin-top: 4px;
          border-radius: 50%;
          background: #e17f69;
        }

        .resend-button {
          margin-top: 17px;
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          border: 0;
          background: transparent;
          color: #9b9b87;
          font-size: 11px;
          cursor: pointer;
        }

        .back-button:hover {
          color: var(--gold);
        }

        .page-footer {
          position: relative;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 19px 6.5%;
          border-top: 1px solid rgba(255, 255, 255, 0.055);
          color: #747465;
          font-size: 8px;
          letter-spacing: 1.3px;
        }

        .footer-center {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-center > span {
          width: 5px;
          height: 5px;
        }

        @media (min-width: 1400px) {
          .scene {
            padding-right: 7%;
            padding-left: 7%;
          }

          .lamp-scene {
            transform: translateX(-20px) scale(1.05);
          }
        }

        @media (max-width: 950px) {
          .scene {
            min-height: 680px;
            grid-template-columns: 0.8fr 1.2fr;
            padding-right: 4%;
            padding-left: 4%;
          }

          .lamp-scene {
            transform: translateX(-15px) scale(0.83);
          }

          .intro-copy {
            padding-left: 10px;
          }

          .intro-copy h1 {
            font-size: 39px;
          }

          .auth-panel {
            right: 4%;
            width: 49%;
          }

          .face {
            padding: 26px 24px 22px;
          }

          .lamp-label {
            left: calc(50% + 112px);
          }
        }

        @media (max-width: 650px) {
          .brand {
            padding: 20px 22px;
            flex-wrap: wrap;
          }

          .brand-name {
            font-size: 11px;
            letter-spacing: 2px;
          }

          .brand-caption {
            font-size: 7px;
            letter-spacing: 1px;
          }

          .scene {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            min-height: 0;
            padding: 0 19px 35px;
          }

          .lamp-scene {
            flex: 0 0 auto;
            height: 325px;
            width: 100%;
            transform: scale(0.64);
            transform-origin: center top;
            margin-bottom: -100px;
          }

          .lamp-wire {
            top: 0;
            height: 63px;
          }

          .lamp-shade {
            top: 62px;
          }

          .lamp-bulb {
            top: 173px;
          }

          .lamp-stem {
            top: 212px;
          }

          .lamp-base {
            top: 365px;
          }

          .lamp-floor-glow {
            top: 380px;
          }

          .cord-area {
            top: 145px;
          }

          .lamp-label {
            top: 305px;
          }

          .intro-copy {
            position: relative;
            width: 100%;
            max-width: 430px;
            padding: 5px 4px 35px;
            text-align: center;
          }

          .intro-copy.intro-hidden {
            display: none;
          }

          .eyebrow {
            justify-content: center;
            margin-bottom: 15px;
            font-size: 8px;
          }

          .intro-copy h1 {
            font-size: clamp(34px, 9vw, 45px);
            letter-spacing: -1.9px;
          }

          .intro-description {
            max-width: 300px;
            margin: 15px auto 0;
            font-size: 12px;
          }

          .intro-bottom {
            justify-content: center;
            margin-top: 23px;
            font-size: 7px;
          }

          .light-beam {
            top: 0;
            left: 0;
            width: 100%;
            height: 350px;
          }

          .auth-panel {
            position: relative;
            top: auto;
            right: auto;
            width: 100%;
            max-width: 430px;
            margin: 0 auto;
            transform: translateY(20px);
          }

          .auth-panel.panel-visible {
            transform: translateY(0);
          }

          .face {
            max-height: none;
            overflow: visible;
            padding: 24px 22px 20px;
          }

          .form-heading h2 {
            font-size: 25px;
          }

          .page-footer {
            padding: 17px 19px;
            font-size: 7px;
            letter-spacing: 0.6px;
          }

          .page-footer > span:last-child {
            display: none;
          }
        }

        @media (max-width: 380px) {
          .brand {
            padding-right: 15px;
            padding-left: 15px;
          }

          .brand-caption {
            padding-left: 8px;
          }

          .scene {
            padding-right: 13px;
            padding-left: 13px;
          }

          .face {
            padding-right: 17px;
            padding-left: 17px;
          }

          .panel-indicator,
          .secure-label {
            font-size: 7px;
            letter-spacing: 0.8px;
          }

          .form-heading {
            gap: 10px;
          }

          .form-heading h2 {
            font-size: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}