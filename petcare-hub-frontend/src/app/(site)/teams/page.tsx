"use client";

import { FormEvent, useEffect, useState } from "react";
import { Clock3, Mail, MapPin, ShieldCheck, Star, User, UserPlus, Users } from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { resolveApiMediaUrl } from "@/lib/media";
import AnimatedState from "@/src/components/AnimatedState";

type CareTeamMember = {
    id: string;
    name: string;
    role: string;
    bio?: string | null;
    location?: string | null;
    contact?: string | null;
    specialties?: string | null;
    availability?: string | null;
    photo_url?: string | null;
};

export default function TeamsPage() {
    const [members, setMembers] = useState<CareTeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [contact, setContact] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [specialties, setSpecialties] = useState("");
    const [availability, setAvailability] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [adding, setAdding] = useState(false);

    async function loadMembers() {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch("/care-team", { cache: "no-store" });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Failed to load care team.");
            }
            const data = (await res.json()) as CareTeamMember[];
            setMembers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load care team.");
        } finally {
            setLoading(false);
        }
    }

    async function addMember(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!name.trim() || !role.trim()) return;

        setAdding(true);
        setError(null);
        try {
            let uploadedPhotoUrl: string | null = null;
            if (photoFile) {
                const token = getAuthToken();
                const formData = new FormData();
                formData.append("file", photoFile);

                const uploadRes = await apiFetch("/care-team/upload-photo", {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const payload = (await uploadRes.json().catch(() => null)) as { detail?: string } | null;
                    throw new Error(payload?.detail || "Failed to upload member photo.");
                }

                const uploadPayload = (await uploadRes.json()) as { photo_url?: string };
                uploadedPhotoUrl = uploadPayload.photo_url || null;
            }

            const res = await apiFetch("/care-team", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    name: name.trim(),
                    role: role.trim(),
                    contact: contact.trim() || null,
                    location: location.trim() || null,
                    bio: bio.trim() || null,
                    specialties: specialties.trim() || null,
                    availability: availability.trim() || null,
                    photo_url: uploadedPhotoUrl,
                }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Failed to add member.");
            }

            setName("");
            setRole("");
            setContact("");
            setLocation("");
            setBio("");
            setSpecialties("");
            setAvailability("");
            setPhotoFile(null);
            await loadMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add member.");
        } finally {
            setAdding(false);
        }
    }

    useEffect(() => {
        loadMembers();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h1 className="font-headline text-4xl lg:text-6xl font-extrabold text-on-surface mb-4">Care Teams</h1>
                    <p className="text-on-surface-variant max-w-xl font-medium text-lg">Assign trusted members and coordinate responsibilities.</p>
                </div>
            </div>

            <form onSubmit={addMember} className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm mb-10">
                <h2 className="font-headline font-bold text-xl mb-4">Add Team Member</h2>
                <div className="grid gap-3 md:grid-cols-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                    />
                    <input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Role"
                        className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                    />
                    <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Contact"
                        className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                        className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        placeholder="Specialties"
                        className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="Availability"
                        className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <label className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface-variant">
                        Upload photo
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-2 block w-full text-sm"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        />
                    </label>
                </div>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio"
                    className="mt-3 w-full h-24 resize-none bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                    type="submit"
                    disabled={adding}
                    className="mt-4 bg-primary text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-60"
                >
                    {adding ? "Adding..." : "Add Member"} <UserPlus className="w-4 h-4" />
                </button>
                <p className="text-xs text-on-surface-variant mt-2">Adding members currently requires admin role.</p>
            </form>

            {error ? <p className="text-sm text-error font-semibold mb-4">{error}</p> : null}
            {loading ? (
                <AnimatedState
                    title="Loading care team"
                    message="Syncing member roster and responsibilities."
                    emoji="👥"
                    compact
                />
            ) : null}

            <div className="grid md:grid-cols-2 gap-6">
                {members.map((member) => (
                    <article key={member.id} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm">
                        <div className="flex items-start gap-3">
                            {member.photo_url ? (
                                <img src={resolveApiMediaUrl(member.photo_url)} alt={member.name} className="h-14 w-14 rounded-xl object-cover border border-outline-variant/20" />
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg">{member.name}</h3>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">{member.role}</p>
                            </div>
                        </div>
                        {member.bio ? <p className="text-sm text-on-surface-variant mt-3">{member.bio}</p> : null}
                        <div className="mt-4 space-y-1 text-sm text-on-surface-variant">
                            {member.contact ? <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {member.contact}</p> : null}
                            {member.location ? <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {member.location}</p> : null}
                            {member.specialties ? <p className="flex items-center gap-2"><Star className="w-4 h-4" /> {member.specialties}</p> : null}
                            {member.availability ? <p className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> {member.availability}</p> : null}
                        </div>
                    </article>
                ))}
            </div>

            {!loading && members.length === 0 ? (
                <AnimatedState
                    title="No team members yet"
                    message="Add your first caregiver to start role-based coordination."
                    emoji="🧑‍⚕️"
                    tone="calm"
                />
            ) : null}
        </div>
    );
}
