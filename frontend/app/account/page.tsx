"use client";

import { FormEvent, useEffect, useState } from "react";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import PawLoader from "../components/PawLoader";
import { apiFetch } from "../lib/api";
import {
  getAuthToken,
  getAuthUser,
  setAuthSession,
  type AuthUser,
} from "../lib/auth";

export default function AccountPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
          <section className="panel panel-spaced">
            {error && <p className="error">{error}</p>}
            {success && (
              <p style={{ color: "#1f5c4a", fontWeight: 700 }}>{success}</p>
            )}

            <div className="grid-list">
              <form className="form-grid" onSubmit={onProfileSubmit}>
                <h2>Profile details</h2>
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
                <div className="field-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={isPetCaregiver}
                      onChange={(e) => setIsPetCaregiver(e.target.checked)}
                    />
                    Pet caregiver
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={isVeterinarian}
                      onChange={(e) => setIsVeterinarian(e.target.checked)}
                    />
                    Veterinarian
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

              <form className="form-grid" onSubmit={onPasswordSubmit}>
                <h2>Security</h2>
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

            {user && (
              <p className="subtext">
                Logged in as {user.first_name || user.email} · role:{" "}
                {(user.role || "user").toUpperCase()}
              </p>
            )}
          </section>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
