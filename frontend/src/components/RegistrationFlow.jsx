import React, { useState, useRef } from "react";
import { useUser } from "../context/UserContext";
import {
  validatePassword,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../utils/passwordValidator";

export default function RegistrationFlow() {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: null,
    avatarPreview: null,
    partnerCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const fileInputRef = useRef(null);

  if (user) return null;

  // Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");

    if (name === "password") {
      setPasswordStrength(validatePassword(value));
    }
  };

  // Upload & validate avatar
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width !== img.height) {
          setError(
            `Image must be 1:1 ratio (square). Current: ${img.width}x${img.height}`
          );
          setFormData((prev) => ({
            ...prev,
            avatar: null,
            avatarPreview: null,
          }));
          return;
        }

        setFormData((prev) => ({
          ...prev,
          avatar: event.target.result,
          avatarPreview: event.target.result,
        }));
        setError("");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, avatar: null, avatarPreview: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Step validations
  const handleStep1 = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setStep(2);
  };

  const handleStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError("Please enter and confirm your password");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasLetter || !hasNumber) {
      setError("Password must contain at least one letter and one number");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setStep(3);
  };

  const handleStep3 = () => setStep(4);

  // === New unified registration ===
  const handleRegisterAndGroup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key":
              import.meta.env.VITE_API_KEY || "purple-secret-key-samra-2025",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            avatar: formData.avatar,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // ✅ Backend auto-creates group
      setFormData((prev) => ({
        ...prev,
        generatedCode: data.groupCode,
        userId: data._id,
        groupName: data.groupName,
      }));

      setError("✅ Group created automatically!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === Join with partner code ===
  const handleJoinWithCode = async () => {
    setError("");
    if (!formData.partnerCode.trim()) {
      setError("Please enter a partner code");
      return;
    }
    setLoading(true);
    try {
      // Register user first
      const registerRes = await fetch(
        import.meta.env.VITE_API_URL + "/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key":
              import.meta.env.VITE_API_KEY || "purple-secret-key-samra-2025",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            avatar: formData.avatar,
            groupCode: formData.partnerCode.trim(), // 👈 VERY IMPORTANT
          }),
        }
      );
      const userData = await registerRes.json();
      if (!registerRes.ok)
        throw new Error(userData.error || "Registration failed");

      // Join group
      const joinRes = await fetch(
        import.meta.env.VITE_API_URL + `/api/users/join-group/${userData._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key":
              import.meta.env.VITE_API_KEY || "purple-secret-key-samra-2025",
          },
          body: JSON.stringify({ groupCode: formData.partnerCode }),
        }
      );
      const joinData = await joinRes.json();
      if (!joinRes.ok) throw new Error(joinData.error || "Invalid group code");

      setFormData((prev) => ({
        ...prev,
        userId: userData._id,
        joinedGroup: joinData.groupName,
      }));
      setError("✅ Joined existing group!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.generatedCode);
    setError("Code copied to clipboard ✅");
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key":
              import.meta.env.VITE_API_KEY || "purple-secret-key-samra-2025",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("purpleUser", JSON.stringify(data));
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content register-modal registration-flow">
        {/* STEP 1: Basic info */}
        {step === 1 && (
          <>
            <div className="modal-header">
              <h2>💜 Welcome to Purple Player</h2>
              <p>Step 1 of 4: Tell us who you are</p>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStep1();
              }}
              className="modal-form"
            >
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Samra"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Next →
              </button>
            </form>
          </>
        )}

        {/* STEP 2: Password */}
        {step === 2 && (
          <>
            <div className="modal-header">
              <h2>🔐 Create Password</h2>
              <p>Step 2 of 4: Secure your account</p>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStep2();
              }}
              className="modal-form"
            >
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter strong password"
                  required
                />
              </div>
              {passwordStrength && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(
                          passwordStrength.score
                        ),
                      }}
                    ></div>
                  </div>
                  <div
                    className="strength-label"
                    style={{
                      color: getPasswordStrengthColor(passwordStrength.score),
                    }}
                  >
                    {getPasswordStrengthLabel(passwordStrength.score)}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Next →
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 3: Avatar */}
        {step === 3 && (
          <>
            <div className="modal-header">
              <h2>📷 Profile Photo</h2>
              <p>Step 3 of 4: Add your photo (optional)</p>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStep3();
              }}
              className="modal-form"
            >
              <div className="form-group">
                <label>Profile Photo (1:1 ratio)</label>
                <div className="photo-upload-section">
                  {formData.avatarPreview ? (
                    <div className="photo-preview">
                      <img src={formData.avatarPreview} alt="Profile preview" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={handleRemovePhoto}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-area">
                      <div className="upload-icon">📷</div>
                      <p>Click to upload a 1:1 square photo</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="photo-input"
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.avatarPreview
                      ? "📷 Change Photo"
                      : "📷 Upload Photo"}
                  </button>
                </div>
              </div>
              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(2)}
                >
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Next →
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 4: Group creation / join */}
        {step === 4 && (
          <>
            <div className="modal-header">
              <h2>🔗 Group Connection</h2>
              <p>Step 4 of 4: Connect with your partner</p>
            </div>
            {error && <div className="modal-error">{error}</div>}

            {formData.generatedCode ? (
              <div className="group-code-display">
                <div className="code-box">
                  <div className="code-label">Your Unique Group Code:</div>
                  <div className="code-value">{formData.generatedCode}</div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={copyToClipboard}
                  >
                    📋 Copy Code
                  </button>
                </div>
                <p className="code-instruction">
                  Share this code with your partner to join your group.
                </p>
              </div>
            ) : formData.userId ? (
              <div className="group-code-display">
                <div className="code-box">
                  <p>✅ You’ve successfully joined a group!</p>
                </div>
              </div>
            ) : (
              <div className="group-code-choice">
                <div className="choice-card code-create">
                  <div className="choice-icon">✨</div>
                  <div className="choice-title">Create New Group</div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRegisterAndGroup}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "✨ Create Group"}
                  </button>
                </div>
                <div className="or-divider">OR</div>
                <div className="choice-card code-join">
                  <div className="choice-icon">🔓</div>
                  <div className="choice-title">Join Group</div>
                  <input
                    type="text"
                    placeholder="Enter 16-character code"
                    value={formData.partnerCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        partnerCode: e.target.value.toUpperCase(),
                      }))
                    }
                    maxLength="16"
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleJoinWithCode}
                    disabled={loading || !formData.partnerCode.trim()}
                  >
                    {loading ? "Joining..." : "🔓 Join Group"}
                  </button>
                </div>
              </div>
            )}

            <div className="form-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                ← Back
              </button>
              {(formData.generatedCode || formData.userId) && (
                <button
                  className="btn btn-primary"
                  onClick={handleCompleteRegistration}
                  disabled={loading}
                >
                  {loading ? "Completing..." : "✅ Complete Registration"}
                </button>
              )}
            </div>
          </>
        )}
        <p className="modal-footer">
          ✨ Your privacy is important. Data is saved securely.
        </p>
      </div>
    </div>
  );
}
