"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PawLoader from "../components/PawLoader";
import { apiFetch } from "../lib/api";
import { setAuthSession } from "../lib/auth";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [isPetCaregiver, setIsPetCaregiver] = useState(false);
  const [isVeterinarian, setIsVeterinarian] = useState(false);
  const [specializations, setSpecializations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          bio: bio.trim() || undefined,
          is_pet_caregiver: isPetCaregiver,
          is_veterinarian: isVeterinarian,
          specializations: specializations.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.detail || `Registration failed (${res.status})`,
        );
      }

      const data = await res.json();
      setAuthSession(data.access_token, data.user);
      window.location.href = "/feed";
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell page-shell">
      <section className="auth-card">
        <aside className="auth-visual">
          <p className="eyebrow">Create account</p>
          <h1>Build your pet care identity.</h1>
          <p>
            Share meaningful updates and connect with neighbors, caregivers, and
            veterinary professionals.
          </p>
          <ul className="feature-list">
            <li>Pet-focused profile and contact basics</li>
            <li>Caregiver and veterinarian role signals</li>
            <li>Secure login with role-aware permissions</li>
          </ul>
        </aside>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-title">
            <h2>Register</h2>
            <p>Tell the community who you are.</p>
          </div>

          <div className="auth-grid-2">
            <label>
              First name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
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

          <div className="auth-grid-2">
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="pawlover123"
              />
            </label>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>
          </div>

          <div className="auth-grid-2">
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>

          <div className="auth-grid-2">
            <label>
              City
              <input value={city} onChange={(e) => setCity(e.target.value)} />
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
            Pet care bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="I foster rescue cats and help with weekend transport."
            />
          </label>

          <div className="auth-grid-2">
            <label>
              <input
                type="checkbox"
                checked={isPetCaregiver}
                onChange={(e) => setIsPetCaregiver(e.target.checked)}
              />
              I am a pet caregiver
            </label>
            <label>
              <input
                type="checkbox"
                checked={isVeterinarian}
                onChange={(e) => setIsVeterinarian(e.target.checked)}
              />
              I am a veterinarian
            </label>
          </div>

          <label>
            Specializations
            <input
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              placeholder="Rescue care, behavior support, nutrition"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <PawLoader label="Creating account" />
            ) : (
              "Create account"
            )}
          </button>

          <p className="auth-switch">
            Already registered? <Link href="/login">Login instead</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
