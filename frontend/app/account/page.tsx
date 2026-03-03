"use client";

import { ChangeEvent, FormEvent, useEffect, useState, useRef } from "react";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import PawLoader from "../components/PawLoader";
import { Avatar } from "../components/shared/Avatar";
import { apiFetch } from "../lib/api";
import {
  getAuthToken,
  resolveAuthImageUrl,
  setAuthSession,
  type AuthUser,
} from "../lib/auth";

type HomeStat = {
  label: string;
  value: string;
};

type HomeFeature = {
  icon: string;
  title: string;
  description: string;
};

type HomeAIPathway = {
  title: string;
  description: string;
  disclaimer: string;
};

type HomePageContent = {
  badge: string;
  title_prefix: string;
  title_highlight: string;
  description: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  stats: HomeStat[];
  features: HomeFeature[];
  ai_pathway: HomeAIPathway;
};

const parseStatsText = (value: string): HomeStat[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, entry] = line.split("|").map((part) => part.trim());
      return { label: label || "Label", value: entry || "0" };
    });

const parseFeaturesText = (value: string): HomeFeature[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [icon, title, description] = line.split("|").map((part) => part.trim());
      return {
        icon: icon || "Users",
        title: title || "Feature",
        description: description || "Description",
      };
    });

export default function AccountPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [isPetCaregiver, setIsPetCaregiver] = useState(false);
  const [isVeterinarian, setIsVeterinarian] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [homeContent, setHomeContent] = useState<HomePageContent | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [homeBadge, setHomeBadge] = useState("");
  const [homeTitlePrefix, setHomeTitlePrefix] = useState("");
  const [homeTitleHighlight, setHomeTitleHighlight] = useState("");
  const [homeDescription, setHomeDescription] = useState("");
  const [homePrimaryLabel, setHomePrimaryLabel] = useState("");
  const [homePrimaryHref, setHomePrimaryHref] = useState("");
  const [homeSecondaryLabel, setHomeSecondaryLabel] = useState("");
  const [homeSecondaryHref, setHomeSecondaryHref] = useState("");
  const [homeStatsText, setHomeStatsText] = useState("");
  const [homeFeaturesText, setHomeFeaturesText] = useState("");
  const [homeAiTitle, setHomeAiTitle] = useState("");
  const [homeAiDescription, setHomeAiDescription] = useState("");
  const [homeAiDisclaimer, setHomeAiDisclaimer] = useState("");
  const [showHomepageManagement, setShowHomepageManagement] = useState(false);

  const isAdmin = (user?.role || "user").toLowerCase() === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setShowHomepageManagement(false);
      return;
    }
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("petcare_show_homepage_management")
        : null;
    setShowHomepageManagement(saved === "true");
  }, [isAdmin]);

  const applyHomeContent = (payload: HomePageContent) => {
    setHomeContent(payload);
    setHomeBadge(payload.badge || "");
    setHomeTitlePrefix(payload.title_prefix || "");
    setHomeTitleHighlight(payload.title_highlight || "");
    setHomeDescription(payload.description || "");
    setHomePrimaryLabel(payload.primary_cta_label || "");
    setHomePrimaryHref(payload.primary_cta_href || "");
    setHomeSecondaryLabel(payload.secondary_cta_label || "");
    setHomeSecondaryHref(payload.secondary_cta_href || "");
    setHomeStatsText(
      (payload.stats || [])
        .map((entry) => `${entry.label}|${entry.value}`)
        .join("\n"),
    );
    setHomeFeaturesText(
      (payload.features || [])
        .map((feature) => `${feature.icon}|${feature.title}|${feature.description}`)
        .join("\n"),
    );
    setHomeAiTitle(payload.ai_pathway?.title || "");
    setHomeAiDescription(payload.ai_pathway?.description || "");
    setHomeAiDisclaimer(payload.ai_pathway?.disclaimer || "");
  };

  async function loadHomeContent(token: string) {
    setHomeLoading(true);
    try {
      const res = await apiFetch("/homepage-content", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Unable to load homepage content (${res.status})`);
      }
      const payload = (await res.json()) as HomePageContent;
      applyHomeContent(payload);
    } catch (homeError) {
      setError(
        homeError instanceof Error
          ? homeError.message
          : "Failed to load homepage content",
      );
    } finally {
      setHomeLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      const token = getAuthToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const res = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Unable to load account (${res.status})`);
        }
        const payload = (await res.json()) as AuthUser;
        setUser(payload);
        setFirstName(payload.first_name || "");
        setLastName(payload.last_name || "");
        setUsername(payload.username || "");
        setPhone(payload.phone || "");
        setCity(payload.city || "");
        setCountry(payload.country || "");
        setBio(payload.bio || "");
        setSpecializations(payload.specializations || "");
        setIsPetCaregiver(Boolean(payload.is_pet_caregiver));
        setIsVeterinarian(Boolean(payload.is_veterinarian));
        setProfileImage(
          resolveAuthImageUrl(
            payload.profile_image_url || payload.avatar_url || payload.image_url,
          ),
        );

        if ((payload.role || "user").toLowerCase() === "admin") {
          await loadHomeContent(token);
        }
      } catch (accountError) {
        setError(
          accountError instanceof Error
            ? accountError.message
            : "Failed to load account",
        );
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch("/auth/upload-profile-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.detail || `Image upload failed (${res.status})`,
        );
      }

      const updatedUser = (await res.json()) as AuthUser;
      setUser(updatedUser);
      setAuthSession(token, updatedUser);
      setProfileImage(
        resolveAuthImageUrl(
          updatedUser.profile_image_url ||
          updatedUser.avatar_url ||
          updatedUser.image_url,
        ),
      );
      setSuccess("Profile image updated successfully.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed",
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function onProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch("/auth/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
          username: username.trim() || undefined,
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          bio: bio.trim() || undefined,
          specializations: specializations.trim() || undefined,
          is_pet_caregiver: isPetCaregiver,
          is_veterinarian: isVeterinarian,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.detail || `Profile update failed (${res.status})`,
        );
      }

      const updatedUser = (await res.json()) as AuthUser;
      setUser(updatedUser);
      setAuthSession(token, updatedUser);
      setProfileImage(
        resolveAuthImageUrl(
          updatedUser.profile_image_url ||
          updatedUser.avatar_url ||
          updatedUser.image_url,
        ),
      );
      setSuccess("Profile updated successfully.");
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : "Profile update failed",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch("/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.detail || `Password change failed (${res.status})`,
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Password updated successfully.");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Password change failed",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function onHomeContentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    if (!isAdmin) {
      setError("Only admin users can manage homepage content.");
      return;
    }

    setHomeSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: HomePageContent = {
        badge: homeBadge.trim(),
        title_prefix: homeTitlePrefix.trim(),
        title_highlight: homeTitleHighlight.trim(),
        description: homeDescription.trim(),
        primary_cta_label: homePrimaryLabel.trim(),
        primary_cta_href: homePrimaryHref.trim(),
        secondary_cta_label: homeSecondaryLabel.trim(),
        secondary_cta_href: homeSecondaryHref.trim(),
        stats: parseStatsText(homeStatsText),
        features: parseFeaturesText(homeFeaturesText),
        ai_pathway: {
          title: homeAiTitle.trim(),
          description: homeAiDescription.trim(),
          disclaimer: homeAiDisclaimer.trim(),
        },
      };

      const res = await apiFetch("/homepage-content", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const responsePayload = await res.json().catch(() => null);
        throw new Error(
          responsePayload?.detail || `Homepage save failed (${res.status})`,
        );
      }

      const updated = (await res.json()) as HomePageContent;
      applyHomeContent(updated);
      setSuccess("Homepage content updated successfully.");
    } catch (homeSaveError) {
      setError(
        homeSaveError instanceof Error
          ? homeSaveError.message
          : "Failed to update homepage content",
      );
    } finally {
      setHomeSaving(false);
    }
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const profileName = fullName || username || user?.email || "My profile";

  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="community-hero">
          <div className="community-hero-content">
            <div>
              <p className="eyebrow">My profile</p>
              <h1>Manage your pet-care identity and account security.</h1>
              <p className="subtext">
                Keep your profile accurate for better community coordination.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <section
            className="panel panel-spaced"
            style={{ maxWidth: "520px", margin: "0 auto" }}
          >
            <PawLoader label="Loading profile" />
          </section>
        ) : (
          <section className="panel panel-spaced account-shell">
            {error && <p className="error">{error}</p>}
            {success && <p className="account-success">{success}</p>}

            <div className="account-summary">
              <div className="account-summary-main">
                <div className="avatar-upload-wrapper">
                  <Avatar
                    src={profileImage}
                    name={profileName}
                    size="xl"
                    className="ring-2 ring-primary/20 shadow-sm"
                  />
                  <button
                    className="avatar-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    title="Upload profile picture"
                    type="button"
                  >
                    {uploadingImage ? (
                      <span className="upload-spinner"></span>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </div>
                <div>
                  <h2>{profileName}</h2>
                  <p className="subtext">{user?.email}</p>
                  <div className="account-tags">
                    <span className="pill">{(user?.role || "user").toUpperCase()}</span>
                    {isPetCaregiver ? <span className="pill">Pet caregiver</span> : null}
                    {isVeterinarian ? <span className="pill">Veterinarian</span> : null}
                  </div>
                </div>
              </div>
              <p className="subtext">
                Keep your profile complete to make reports, collaborations, and
                community responses more effective.
              </p>
            </div>

            <div className="account-grid">
              <form className="form-grid account-card" onSubmit={onProfileSubmit}>
                <div className="panel-header">
                  <div>
                    <h3>Profile details</h3>
                    <p>Public identity and contact information.</p>
                  </div>
                </div>
                <div className="field-row">
                  <label>
                    First name
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </label>
                </div>
                <div className="field-row">
                  <label>
                    Username
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                </div>
                <div className="field-row">
                  <label>
                    City
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                  <label>
                    Country
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Bio
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                </label>
                <label>
                  Specializations
                  <input
                    value={specializations}
                    onChange={(e) => setSpecializations(e.target.value)}
                    placeholder="Rescue, fostering, nutrition"
                  />
                </label>
                <div className="account-switch-row">
                  <label className="account-switch">
                    <input
                      type="checkbox"
                      checked={isPetCaregiver}
                      onChange={(e) => setIsPetCaregiver(e.target.checked)}
                    />
                    <span>Pet caregiver</span>
                  </label>
                  <label className="account-switch">
                    <input
                      type="checkbox"
                      checked={isVeterinarian}
                      onChange={(e) => setIsVeterinarian(e.target.checked)}
                    />
                    <span>Veterinarian</span>
                  </label>
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <PawLoader label="Saving profile" />
                  ) : (
                    "Save profile"
                  )}
                </button>
              </form>

              <form className="form-grid account-card" onSubmit={onPasswordSubmit}>
                <div className="panel-header">
                  <div>
                    <h3>Security</h3>
                    <p>Update your password regularly to protect your account.</p>
                  </div>
                </div>
                <label>
                  Current password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </label>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <PawLoader label="Updating password" />
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>
            </div>

            {isAdmin && (
              <div className="form-grid account-card">
                <div className="panel-header">
                  <div>
                    <h3>Admin settings</h3>
                    <p>Control access to advanced homepage management tools.</p>
                  </div>
                </div>

                <div className="setting-row">
                  <div>
                    <strong className="setting-title">Homepage management</strong>
                    <p className="subtext">
                      Enable to edit dynamic homepage content from this account page.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`setting-toggle ${showHomepageManagement ? "active" : ""}`}
                    aria-pressed={showHomepageManagement}
                    onClick={() => {
                      const next = !showHomepageManagement;
                      setShowHomepageManagement(next);
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          "petcare_show_homepage_management",
                          String(next),
                        );
                      }
                    }}
                  >
                    <span className="setting-toggle-knob" />
                  </button>
                </div>

                {showHomepageManagement && (
                  <form className="form-grid" onSubmit={onHomeContentSubmit}>
                    {homeLoading && <PawLoader label="Loading homepage content" />}

                    {!homeLoading && (
                      <>
                        <div className="field-row">
                          <label>
                            Badge
                            <input
                              value={homeBadge}
                              onChange={(e) => setHomeBadge(e.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Hero description
                            <input
                              value={homeDescription}
                              onChange={(e) => setHomeDescription(e.target.value)}
                              required
                            />
                          </label>
                        </div>

                        <div className="field-row">
                          <label>
                            Title prefix
                            <input
                              value={homeTitlePrefix}
                              onChange={(e) => setHomeTitlePrefix(e.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Title highlight
                            <input
                              value={homeTitleHighlight}
                              onChange={(e) => setHomeTitleHighlight(e.target.value)}
                              required
                            />
                          </label>
                        </div>

                        <div className="field-row">
                          <label>
                            Primary CTA label
                            <input
                              value={homePrimaryLabel}
                              onChange={(e) => setHomePrimaryLabel(e.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Primary CTA href
                            <input
                              value={homePrimaryHref}
                              onChange={(e) => setHomePrimaryHref(e.target.value)}
                              required
                            />
                          </label>
                        </div>

                        <div className="field-row">
                          <label>
                            Secondary CTA label
                            <input
                              value={homeSecondaryLabel}
                              onChange={(e) => setHomeSecondaryLabel(e.target.value)}
                              required
                            />
                          </label>
                          <label>
                            Secondary CTA href
                            <input
                              value={homeSecondaryHref}
                              onChange={(e) => setHomeSecondaryHref(e.target.value)}
                              required
                            />
                          </label>
                        </div>

                        <label>
                          Stats (one per line: Label|Value)
                          <textarea
                            rows={4}
                            value={homeStatsText}
                            onChange={(e) => setHomeStatsText(e.target.value)}
                          />
                        </label>

                        <label>
                          Features (one per line: Icon|Title|Description)
                          <textarea
                            rows={6}
                            value={homeFeaturesText}
                            onChange={(e) => setHomeFeaturesText(e.target.value)}
                          />
                        </label>

                        <div className="field-row">
                          <label>
                            AI section title
                            <input
                              value={homeAiTitle}
                              onChange={(e) => setHomeAiTitle(e.target.value)}
                              required
                            />
                          </label>
                          <label>
                            AI section description
                            <input
                              value={homeAiDescription}
                              onChange={(e) => setHomeAiDescription(e.target.value)}
                              required
                            />
                          </label>
                        </div>

                        <label>
                          AI disclaimer
                          <textarea
                            rows={2}
                            value={homeAiDisclaimer}
                            onChange={(e) => setHomeAiDisclaimer(e.target.value)}
                            required
                          />
                        </label>

                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={homeSaving}
                        >
                          {homeSaving ? (
                            <PawLoader label="Saving homepage" />
                          ) : (
                            "Save homepage content"
                          )}
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <SiteFooter />

      <style jsx>{`
        .avatar-upload-wrapper {
          position: relative;
          display: inline-block;
        }

        /* Fix account grid heights */
        .account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          align-items: start;
        }

        .account-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .account-card .form-grid {
          flex: 1;
        }

        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid rgba(31, 92, 74, 0.15);
          background: rgba(31, 92, 74, 0.04);
          border-radius: 12px;
          padding: 12px;
        }

        .setting-title {
          display: block;
          color: var(--pine);
          margin-bottom: 4px;
        }

        .setting-toggle {
          width: 52px;
          height: 30px;
          border-radius: 999px;
          border: none;
          background: rgba(31, 92, 74, 0.25);
          padding: 3px;
          display: inline-flex;
          align-items: center;
          transition: background 0.2s ease;
        }

        .setting-toggle.active {
          background: linear-gradient(130deg, #1f5c4a, #2f7a64);
        }

        .setting-toggle-knob {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          transform: translateX(0);
          transition: transform 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }

        .setting-toggle.active .setting-toggle-knob {
          transform: translateX(22px);
        }

        .avatar-upload-btn {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .avatar-upload-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .avatar-upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .avatar-upload-btn svg {
          color: var(--text-secondary);
        }

        .upload-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
