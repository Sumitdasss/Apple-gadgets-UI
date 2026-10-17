/* eslint-disable react/no-unescaped-entities */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://apple-gadgets-ui-backend.vercel.app"; // Backend API base URL

const API = {
  register: `${API_BASE}/api/users/register`,
  login: `${API_BASE}/api/users/login`,
  getProfile: `${API_BASE}/api/users/me`,
  verifyEmailOtp: `${API_BASE}/api/users/verify-email-otp`,
  resendEmailOtp: `${API_BASE}/api/users/resend-email-otp`,
  verifyLoginOtp: `${API_BASE}/api/users/verify-login-otp`,
};

export default function AuthPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpType, setOtpType] = useState("email");

  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    phone: "",
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const switchForm = (register) => {
    setIsRegister(register);
    setShowOtp(false);
    setOtp("");
    setMessage({ type: "", text: "" });
  };

  const apiRequest = async (url, body, method = "POST", token = "") => {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Something went wrong.");
    }

    return result;
  };

  // LOGIN: password যাচাইয়ের পর OTP পাঠাবে
  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await apiRequest(API.login, {
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password,
      });

      setOtpEmail(loginData.email.trim().toLowerCase());
      setOtp("");
      setOtpType("login");
      setShowOtp(true);

      showMessage(
        "success",
        result.message || "Login OTP আপনার ইমেইলে পাঠানো হয়েছে।"
      );
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // REGISTER: registration-এর পর Email OTP পাঠাবে
  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await apiRequest(API.register, {
        name: registerData.name.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
        address: registerData.address.trim(),
        phone: registerData.phone.trim(),
      });

      setLoginData({
        email: registerData.email.trim().toLowerCase(),
        password: "",
      });

      setOtpEmail(registerData.email.trim().toLowerCase());
      setOtp("");
      setOtpType("email");
      setShowOtp(true);

      showMessage(
        "success",
        result.message || "Email OTP আপনার ইমেইলে পাঠানো হয়েছে।"
      );
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP VERIFY
  
const handleVerifyOtp = async (e) => {
  e.preventDefault();

  if (!/^\d{6}$/.test(otp)) {
    showMessage("error", "সঠিক ৬ সংখ্যার OTP লিখুন।");
    return;
  }

  setLoading(true);
  setMessage({ type: "", text: "" });

  try {
    const url =
      otpType === "email"
        ? API.verifyEmailOtp
        : API.verifyLoginOtp;

    const result = await apiRequest(url, {
      email: otpEmail,
      otp,
    });

    // =========================
    // EMAIL OTP VERIFICATION
    // =========================
    if (otpType === "email") {
      setShowOtp(false);
      setIsRegister(false);
      setOtp("");

      showMessage(
        "success",
        result.message ||
          "Email verification সফল হয়েছে। এবার লগইন করুন।"
      );

      return;
    }

    // =========================
    // LOGIN OTP VERIFICATION
    // =========================
    const data = result.data ?? result;

    if (!data.token) {
      throw new Error(
        "Login response-এ token পাওয়া যায়নি। Backend response চেক করুন।"
      );
    }

    if (!data.user) {
      throw new Error(
        "Login response-এ user পাওয়া যায়নি। Backend response চেক করুন।"
      );
    }

    // Save token and user
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showMessage("success", "Login successful!");

    // =========================
    // ROLE-BASED REDIRECT
    // =========================
    const role = data.user.role;

   
if (role === "admin") {
  // Redirect to separate React Admin Panel
  window.location.href =
    "https://apple-gadgets-ui-adminpanel.vercel.app";
} else if (
  role === "subadmin" ||
  role === "employee" ||
  role === "order_manager"
) {
  // Redirect to admin dashboard in Next.js storefront
  router.replace("https://apple-gadgets-ui-adminpanel.vercel.app");
} else if (role === "customer") {
  // Redirect customer to storefront home
  router.replace("/");
} else {
  // Unknown role: don't grant dashboard access
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  throw new Error(
    "আপনার account role সঠিক নয়। Admin-এর সঙ্গে যোগাযোগ করুন।"
  );
}

  } catch (error) {
    showMessage("error", error.message);
  } finally {
    setLoading(false);
  }
};


  // শুধু Email verification OTP পুনরায় পাঠানো
  const handleResendOtp = async () => {
    if (otpType !== "email") {
      showMessage(
        "error",
        "Login OTP পুনরায় পাঠানোর জন্য backend-এ আলাদা resend endpoint প্রয়োজন।"
      );
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await apiRequest(API.resendEmailOtp, {
        email: otpEmail,
      });

      setOtp("");
      showMessage(
        "success",
        result.message || "নতুন OTP পাঠানো হয়েছে।"
      );
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const backFromOtp = () => {
    setShowOtp(false);
    setOtp("");
    setMessage({ type: "", text: "" });
  };

  return (
    <main className="auth-page">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .auth-page {
          --accent: #6558f5;
          --accent-light: #958aff;
          min-height: 100vh;
          width: 100%;
          padding: 35px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background: #f6f7ff;
          color: #17172c;
        }

        .auth-page::before {
          content: "";
          position: absolute;
          z-index: -2;
          width: 650px;
          height: 650px;
          top: -280px;
          left: -180px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(130, 111, 255, 0.25),
            transparent 70%
          );
        }

        .auth-page::after {
          content: "";
          position: absolute;
          z-index: -2;
          width: 650px;
          height: 650px;
          right: -250px;
          bottom: -300px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(95, 216, 211, 0.22),
            transparent 70%
          );
        }

        .ambient-grid {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.4;
          background-image: radial-gradient(
            #b5b3d8 0.7px,
            transparent 0.7px
          );
          background-size: 25px 25px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            black 30%,
            black 75%,
            transparent
          );
        }

        .auth-layout {
          width: 100%;
          max-width: 1120px;
          display: grid;
          grid-template-columns: 1fr 450px;
          align-items: center;
          gap: 65px;
          position: relative;
          z-index: 1;
        }

        .auth-intro {
          padding: 20px 0;
          animation: enterLeft 0.7s ease both;
        }

        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          border: 1px solid #e5e2ff;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.78);
          color: #6355db;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          box-shadow: 0 5px 20px rgba(80, 69, 170, 0.06);
        }

        .brand-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #6558f5;
          box-shadow: 0 0 0 4px #eceaff;
        }

        .auth-intro h1 {
          font-size: clamp(42px, 5vw, 69px);
          line-height: 1.06;
          letter-spacing: -3px;
          margin: 30px 0 22px;
          font-weight: 900;
          color: #19182f;
        }

        .gradient-text {
          background: linear-gradient(100deg, #7965fa, #37bfc1);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-intro > p {
          max-width: 440px;
          color: #77768f;
          font-size: 15px;
          line-height: 1.9;
        }

        .feature-list {
          display: grid;
          gap: 17px;
          margin-top: 34px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #45445e;
          font-size: 14px;
          font-weight: 600;
        }

        .feature-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: white;
          border: 1px solid #e9e7fb;
          box-shadow: 0 7px 20px rgba(66, 57, 130, 0.06);
          font-size: 18px;
        }

        .intro-bottom {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 38px;
          color: #88869e;
          font-size: 12px;
        }

        .avatar-stack {
          display: flex;
          padding-left: 4px;
        }

        .avatar-stack span {
          width: 30px;
          height: 30px;
          margin-left: -4px;
          display: grid;
          place-items: center;
          border: 2px solid #f6f7ff;
          border-radius: 50%;
          background: #e7e2ff;
          color: #6558f5;
          font-size: 10px;
          font-weight: 800;
        }

        .card-scene {
          width: 100%;
          height: 690px;
          perspective: 1500px;
          position: relative;
          animation: enterRight 0.7s ease both;
        }

        .card-scene::before {
          content: "";
          position: absolute;
          inset: 35px -15px -15px 25px;
          border-radius: 32px;
          background: linear-gradient(140deg, #a89cff, #83e2d8);
          opacity: 0.4;
          filter: blur(1px);
          transform: rotate(3deg);
        }

        .flip-card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.85s
            cubic-bezier(0.2, 0.75, 0.25, 1);
        }

        .flip-card.register-mode {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 34px;
          border-radius: 28px;
          overflow-y: auto;
          overflow-x: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 30px 80px rgba(58, 48, 122, 0.13),
            inset 0 1px 0 white;
          scrollbar-width: thin;
          scrollbar-color: #c4baff transparent;
        }

        .card-face::before {
          content: "";
          position: absolute;
          top: 0;
          left: 12%;
          right: 12%;
          height: 3px;
          border-radius: 0 0 10px 10px;
          background: linear-gradient(90deg, #7965fa, #54d4ce);
        }

        .card-back {
          transform: rotateY(180deg);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        .mini-brand {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1.4px;
          color: #24223c;
        }

        .mini-brand span {
          color: #7663f5;
        }

        .secure-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #258a70;
          font-size: 10px;
          font-weight: 700;
          padding: 8px 10px;
          border-radius: 50px;
          background: #eaf9f3;
          border: 1px solid #d4f1e5;
          white-space: nowrap;
        }

        .card-heading {
          font-size: 31px;
          letter-spacing: -1.1px;
          margin: 0 0 10px;
          color: #1e1d35;
        }

        .card-description {
          color: #85839a;
          font-size: 13px;
          line-height: 1.8;
          margin: 0 0 25px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 12px;
          font-weight: 700;
          color: #45435e;
        }

        .input-wrap {
          position: relative;
        }

        .field input,
        .field textarea {
          width: 100%;
          padding: 14px 15px;
          color: #27263d;
          background: #f8f8fd;
          border: 1px solid #e7e6f1;
          border-radius: 12px;
          outline: none;
          transition:
            border-color 0.2s,
            box-shadow 0.2s,
            background 0.2s;
          font-size: 13px;
        }

        .field textarea {
          resize: vertical;
          min-height: 70px;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #aaa8bd;
        }

        .field input:focus,
        .field textarea:focus {
          background: white;
          border-color: #8c7df7;
          box-shadow: 0 0 0 4px rgba(124, 104, 245, 0.1);
        }

        .password-input {
          padding-right: 70px !important;
        }

        .password-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: #6b5bea;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .primary-button {
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 16px;
          margin-top: 4px;
          cursor: pointer;
          color: white;
          font-weight: 800;
          font-size: 14px;
          background: linear-gradient(105deg, #7965f8, #5d52e6);
          box-shadow: 0 10px 24px rgba(103, 85, 235, 0.24);
          transition:
            transform 0.2s,
            box-shadow 0.2s,
            opacity 0.2s;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(103, 85, 235, 0.32);
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .switch-text {
          text-align: center;
          font-size: 12px;
          color: #89879e;
          margin: 22px 0 0;
          line-height: 1.8;
        }

        .switch-button {
          color: #6b5bea;
          background: none;
          border: 0;
          padding: 0 4px;
          font-size: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .switch-button:hover {
          color: #4435c5;
          text-decoration: underline;
        }

        .message {
          padding: 11px 13px;
          border-radius: 11px;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 17px;
          overflow-wrap: anywhere;
        }

        .message.success {
          background: #eaf9f1;
          border: 1px solid #c9eedc;
          color: #187a53;
        }

        .message.error {
          background: #fff0f1;
          border: 1px solid #ffd7db;
          color: #c33348;
        }

        .card-footer {
          margin-top: 23px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: #aaa8bc;
        }

        .otp-icon {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          margin: 24px auto;
          border-radius: 22px;
          color: #6959ed;
          background: linear-gradient(135deg, #eeebff, #e3fbf8);
          border: 1px solid #e1dcff;
          font-size: 28px;
          box-shadow: 0 10px 25px rgba(103, 85, 235, 0.1);
        }

        .otp-input {
          text-align: center;
          font-size: 26px !important;
          font-weight: 800;
          letter-spacing: 12px;
          padding-left: 24px !important;
        }

        .otp-email {
          color: #6355db;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .back-link {
          display: block;
          margin: 20px auto 0;
        }

        @keyframes enterLeft {
          from {
            opacity: 0;
            transform: translateX(-22px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes enterRight {
          from {
            opacity: 0;
            transform: translateX(22px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 900px) {
          .auth-layout {
            max-width: 480px;
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .auth-intro {
            text-align: center;
            padding: 10px 0 0;
          }

          .auth-intro h1 {
            font-size: 42px;
            margin: 20px 0 12px;
            letter-spacing: -1.7px;
          }

          .auth-intro > p {
            margin: 0 auto;
            font-size: 13px;
          }

          .feature-list,
          .intro-bottom {
            display: none;
          }

          .card-scene {
            height: 690px;
          }
        }

        @media (max-width: 480px) {
          .auth-page {
            padding: 22px 12px;
          }

          .auth-intro h1 {
            font-size: 34px;
          }

          .brand-pill {
            padding: 8px 12px;
            font-size: 10px;
          }

          .card-scene {
            height: 690px;
          }

          .card-face {
            padding: 25px 20px;
            border-radius: 23px;
          }

          .card-heading {
            font-size: 27px;
          }

          .card-top {
            margin-bottom: 23px;
          }

          .card-description {
            margin-bottom: 22px;
          }

          .auth-form {
            gap: 15px;
          }

          .otp-input {
            letter-spacing: 8px;
            padding-left: 16px !important;
          }
        }

        @media (max-width: 360px) {
          .card-face {
            padding: 22px 16px;
          }

          .secure-badge {
            font-size: 9px;
            padding: 7px;
          }

          .card-heading {
            font-size: 25px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="ambient-grid" />

      <section className="auth-layout">
        {/* LEFT HERO SECTION */}
        <div className="auth-intro">
          <div className="brand-pill">
            <span className="brand-dot" />
            SHOPSPACE
          </div>

          <h1>
            Your world.
            <br />
            Your <span className="gradient-text">shopping.</span>
          </h1>

          <p>
            Discover your favorite products, unlock exclusive deals,
            and enjoy a simpler, smarter shopping experience.
            Everything you love, all in one place.
          </p>

          <div className="feature-list">
            <div className="feature">
              <span className="feature-icon">🔐</span>
              <span>Safe and secure account access</span>
            </div>

            <div className="feature">
              <span className="feature-icon">🚀</span>
              <span>Fast checkout with less effort</span>
            </div>

            <div className="feature">
              <span className="feature-icon">🎁</span>
              <span>Special offers made for you</span>
            </div>
          </div>

          <div className="intro-bottom">
            <div className="avatar-stack">
              <span>S</span>
              <span>H</span>
              <span>P</span>
            </div>

            <span>Everything you need. One account.</span>
          </div>
        </div>

        {/* RIGHT AUTH CARD */}
        <div className="card-scene">
          <div
            className={`flip-card ${
              isRegister && !showOtp ? "register-mode" : ""
            }`}
          >
            {/* LOGIN CARD */}
            <div className="card-face card-front">
              <div className="card-top">
                <div className="mini-brand">
                  SHOP<span>SPACE.</span>
                </div>

                <div className="secure-badge">● Secure access</div>
              </div>

              {showOtp ? (
                <>
                  <div className="otp-icon">✉</div>

                  <h2 className="card-heading">
                    {otpType === "email"
                      ? "Verify your email"
                      : "Login verification"}
                  </h2>

                  <p className="card-description">
                    We sent a 6-digit verification code to
                    <br />
                    <span className="otp-email">{otpEmail}</span>
                  </p>

                  {message.text && (
                    <div
                      className={`message ${message.type}`}
                      role="status"
                    >
                      {message.text}
                    </div>
                  )}

                  <form
                    className="auth-form"
                    onSubmit={handleVerifyOtp}
                  >
                    <div className="field">
                      <label htmlFor="auth-otp">6-digit OTP</label>

                      <input
                        id="auth-otp"
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                      />
                    </div>

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? "Verifying..." : "Verify OTP →"}
                    </button>
                  </form>

                  {otpType === "email" && (
                    <p className="switch-text">
                      Didn't receive the code?
                      <button
                        className="switch-button"
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    </p>
                  )}

                  <button
                    className="switch-button back-link"
                    type="button"
                    onClick={backFromOtp}
                    disabled={loading}
                  >
                    ← Back
                  </button>

                  <div className="card-footer">
                    SHOPSPACE · SECURE VERIFICATION
                  </div>
                </>
              ) : (
                <>
                  <h2 className="card-heading">Welcome back!</h2>

                  <p className="card-description">
                    Sign in to discover new favorites and manage
                    your orders.
                  </p>

                  {message.text && !isRegister && (
                    <div
                      className={`message ${message.type}`}
                      role="status"
                    >
                      {message.text}
                    </div>
                  )}

                  <form className="auth-form" onSubmit={handleLogin}>
                    <div className="field">
                      <label htmlFor="login-email">
                        Email address
                      </label>

                      <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="login-password">
                        Password
                      </label>

                      <div className="input-wrap">
                        <input
                          id="login-password"
                          className="password-input"
                          type={
                            showLoginPassword ? "text" : "password"
                          }
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          required
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                        >
                          {showLoginPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In →"}
                    </button>
                  </form>

                  <p className="switch-text">
                    New to Shopspace?
                    <button
                      type="button"
                      className="switch-button"
                      onClick={() => switchForm(true)}
                    >
                      Create an account
                    </button>
                  </p>

                  <div className="card-footer">
                    SHOPSPACE · SHOP WITH CONFIDENCE
                  </div>
                </>
              )}
            </div>

            {/* REGISTER CARD */}
            <div className="card-face card-back">
              <div className="card-top">
                <div className="mini-brand">
                  SHOP<span>SPACE.</span>
                </div>

                <div className="secure-badge">✦ Join us</div>
              </div>

              <h2 className="card-heading">Join Shopspace</h2>

              <p className="card-description">
                Create your account and make every shopping
                experience easier.
              </p>

              {message.text && isRegister && !showOtp && (
                <div
                  className={`message ${message.type}`}
                  role="status"
                >
                  {message.text}
                </div>
              )}

              <form className="auth-form" onSubmit={handleRegister}>
                <div className="field">
                  <label htmlFor="register-name">Full name</label>

                  <input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="register-email">
                    Email address
                  </label>

                  <input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="register-phone">
                    Phone number
                  </label>

                  <input
                    id="register-phone"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    required
                    value={registerData.phone}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="register-address">
                    Delivery address
                  </label>

                  <textarea
                    id="register-address"
                    placeholder="Enter your delivery address"
                    autoComplete="street-address"
                    required
                    value={registerData.address}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="register-password">
                    Password
                  </label>

                  <div className="input-wrap">
                    <input
                      id="register-password"
                      className="password-input"
                      type={
                        showRegisterPassword ? "text" : "password"
                      }
                      placeholder="Create a password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowRegisterPassword(
                          !showRegisterPassword
                        )
                      }
                    >
                      {showRegisterPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </form>

              <p className="switch-text">
                Already a member?
                <button
                  type="button"
                  className="switch-button"
                  onClick={() => switchForm(false)}
                >
                  Sign in
                </button>
              </p>

              <div className="card-footer">
                SHOPSPACE · YOUR NEXT FAVORITE
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
