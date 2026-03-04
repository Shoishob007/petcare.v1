"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import Dropdown from "../components/Dropdown";
import MainNav from "../components/MainNav";
import PawLoader from "../components/PawLoader";
import SiteFooter from "../components/SiteFooter";
import { getAuthToken, getAuthUser } from "../lib/auth";

type CareTeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  specialties?: string | null;
  availability?: string | null;
  location?: string | null;
  contact?: string | null;
  photo_url?: string | null;
  created_at: string;
};

const API_BASE = "http://127.0.0.1:8000/api/v1";

const AVATAR_OPTIONS = [
  {
    label: "Lead vet",
    value:
      "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Care coordinator",
    value:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Behavior specialist",
    value:
      "https://images.pexels.com/photos/5327904/pexels-photo-5327904.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Volunteer lead",
    value:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function CareTeamsPage() {
  const [members, setMembers] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [avatarChoice, setAvatarChoice] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<CareTeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSpecialties, setEditSpecialties] = useState("");
  const [editAvailability, setEditAvailability] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editAvatarChoice, setEditAvatarChoice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    setIsAdmin((user?.role || "").toLowerCase() === "admin");
  }, []);

  function requireAdminToken() {
    const token = getAuthToken();
    if (!token) {
      setError("Please login as admin.");
      window.location.href = "/login";
      return null;
    }
    if (!isAdmin) {
      setError("Admin role required for this action.");
      return null;
    }
    return token;
  }

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/care-team`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load care team (${res.status})`);
      }
      const data = (await res.json()) as CareTeamMember[];
      setMembers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (avatarChoice) {
      setPhotoUrl(avatarChoice);
    }
  }, [avatarChoice]);

  useEffect(() => {
    if (editAvatarChoice) {
      setEditPhotoUrl(editAvatarChoice);
    }
  }, [editAvatarChoice]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = requireAdminToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/care-team`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          bio: bio.trim() || undefined,
          specialties: specialties.trim() || undefined,
          availability: availability.trim() || undefined,
          location: location.trim() || undefined,
          contact: contact.trim() || undefined,
          photo_url: photoUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to create member (${res.status})`);
      }
      const created = (await res.json()) as CareTeamMember;
      setMembers((prev) => [created, ...prev]);
      setName("");
      setRole("");
      setBio("");
      setSpecialties("");
      setAvailability("");
      setLocation("");
      setContact("");
      setPhotoUrl("");
      setAvatarChoice("");
      setCreateOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(member: CareTeamMember) {
    setActiveMember(member);
    setEditName(member.name);
    setEditRole(member.role);
    setEditBio(member.bio || "");
    setEditSpecialties(member.specialties || "");
    setEditAvailability(member.availability || "");
    setEditLocation(member.location || "");
    setEditContact(member.contact || "");
    setEditPhotoUrl(member.photo_url || "");
    setEditAvatarChoice("");
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeMember) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/care-team/${activeMember.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          role: editRole.trim() || undefined,
          bio: editBio.trim() || undefined,
          specialties: editSpecialties.trim() || undefined,
          availability: editAvailability.trim() || undefined,
          location: editLocation.trim() || undefined,
          contact: editContact.trim() || undefined,
          photo_url: editPhotoUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update member (${res.status})`);
      }
      const updated = (await res.json()) as CareTeamMember;
      setMembers((prev) =>
        prev.map((member) => (member.id === updated.id ? updated : member)),
      );
      setEditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(false);
    }
  }

  function openDelete(member: CareTeamMember) {
    setActiveMember(member);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!activeMember) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/care-team/${activeMember.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to delete member (${res.status})`);
      }
      setMembers((prev) =>
        prev.filter((member) => member.id !== activeMember.id),
      );
      setDeleteOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading(false);
    }
  }

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(members.map((member) => member.role)));
    roles.sort();
    return [{ label: "All roles", value: "all" }].concat(
      roles.map((roleValue) => ({ label: roleValue, value: roleValue })),
    );
  }, [members]);

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) {
        return false;
      }
      if (!normalized) return true;
      const haystack =
        `${member.name} ${member.role} ${member.specialties ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [members, query, roleFilter]);

  const avatarOptions = useMemo(
    () => [{ label: "Select an avatar", value: "" }, ...AVATAR_OPTIONS],
    [],
  );

  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="hero">
          <div className="page-header">
            <p className="eyebrow">Care team</p>
            <h1>Meet the people keeping pets safe, supported, and seen.</h1>
            <p className="subtext">
              Build a trusted care circle with clear roles, availability, and
              contact details.
            </p>
            <div className="hero-actions">
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={!isAdmin}
              >
                Add team member
              </Button>
              <Button variant="ghost" type="button" onClick={fetchMembers}>
                {loading ? (
                  <PawLoader label="Refreshing" size="sm" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </header>

        <section className="panel panel-spaced">
          <div className="panel-header">
            <div>
              <h2>Care operations</h2>
              <p className="subtext">
                Structured workflows and standards for dependable support.
              </p>
            </div>
          </div>
          <div className="grid-list">
            <article className="support-card">
              <h3>Coverage areas</h3>
              <ul className="feature-list">
                <li>Emergency response for urgent reports.</li>
                <li>Foster and volunteer coordination for recovery care.</li>
                <li>Behavior guidance to keep pets calm during transitions.</li>
              </ul>
            </article>
            <article className="support-card">
              <h3>Community standards</h3>
              <ul className="feature-list">
                <li>Share availability to prevent missed handoffs.</li>
                <li>Document specialties so families find the right help.</li>
                <li>Use clear contact details to coordinate quickly.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="panel panel-spaced">
          <div className="panel-header">
            <div>
              <h2>Core team</h2>
              <p className="subtext">{filteredMembers.length} members shown</p>
            </div>
            <div className="feed-filters">
              <Dropdown
                label="Role"
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
              />
              <label className="field">
                Search
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or specialty"
                />
              </label>
            </div>
          </div>
          {loading && members.length === 0 && (
            <PawLoader label="Loading team" size="lg" />
          )}
          {error && <p className="error">{error}</p>}
          <div className="grid-list">
            {filteredMembers.map((member) => (
              <article key={member.id} className="profile-card">
                <div className="profile-card-header">
                  {member.photo_url ? (
                    <img
                      className="avatar"
                      src={member.photo_url}
                      alt={member.name}
                    />
                  ) : (
                    <div className="avatar" />
                  )}
                  <div>
                    <strong>{member.name}</strong>
                    <div className="pill">{member.role}</div>
                  </div>
                </div>
                {member.bio && <p>{member.bio}</p>}
                <div className="profile-meta">
                  {member.specialties && (
                    <span>Specialties: {member.specialties}</span>
                  )}
                  {member.availability && (
                    <span>Availability: {member.availability}</span>
                  )}
                  {member.location && <span>Location: {member.location}</span>}
                  {member.contact && <span>Contact: {member.contact}</span>}
                </div>
                <div className="card-actions">
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => openEdit(member)}
                    disabled={!isAdmin}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => openDelete(member)}
                    disabled={!isAdmin}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <Dialog
        open={createOpen}
        title="Add care team member"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-member-form" disabled={saving}>
              {saving ? <PawLoader label="Saving" size="sm" /> : "Add member"}
            </Button>
          </div>
        }
      >
        <form
          id="create-member-form"
          className="form-grid"
          onSubmit={handleCreate}
        >
          <div className="field-row">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Role
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
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
            Specialties
            <input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Emergency care, behavior coaching"
            />
          </label>
          <div className="field-row">
            <label>
              Availability
              <input
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              />
            </label>
            <label>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
          </div>
          <label>
            Contact
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="email or phone"
            />
          </label>
          <Dropdown
            label="Avatar preset"
            value={avatarChoice}
            onChange={setAvatarChoice}
            options={avatarOptions}
          />
          <label>
            Avatar URL
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
          {photoUrl && <img className="avatar" src={photoUrl} alt="Avatar" />}
          {error && <p className="error">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={editOpen}
        title="Edit care team member"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-member-form"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <PawLoader label="Saving" size="sm" />
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        }
      >
        <form
          id="edit-member-form"
          className="form-grid"
          onSubmit={handleEditSubmit}
        >
          <div className="field-row">
            <label>
              Name
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </label>
            <label>
              Role
              <input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Bio
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
            />
          </label>
          <label>
            Specialties
            <input
              value={editSpecialties}
              onChange={(e) => setEditSpecialties(e.target.value)}
            />
          </label>
          <div className="field-row">
            <label>
              Availability
              <input
                value={editAvailability}
                onChange={(e) => setEditAvailability(e.target.value)}
              />
            </label>
            <label>
              Location
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </label>
          </div>
          <label>
            Contact
            <input
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
            />
          </label>
          <Dropdown
            label="Avatar preset"
            value={editAvatarChoice}
            onChange={setEditAvatarChoice}
            options={avatarOptions}
          />
          <label>
            Avatar URL
            <input
              value={editPhotoUrl}
              onChange={(e) => setEditPhotoUrl(e.target.value)}
            />
          </label>
          {editPhotoUrl && (
            <img className="avatar" src={editPhotoUrl} alt="Avatar" />
          )}
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        title="Delete care team member"
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <PawLoader label="Deleting" size="sm" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to remove this team member?</p>
      </Dialog>

      <SiteFooter />
    </main>
  );
}
