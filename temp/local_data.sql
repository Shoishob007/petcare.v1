--
-- PostgreSQL database dump
--

\restrict ehFrdSZ1C9Hey3t2TLcIf3JyMlCAbCubOGCTFIeBNKFaixpgORKMVdXBQ24k9c3

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: ai_sickness_cases; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.ai_sickness_cases DISABLE TRIGGER ALL;

COPY public.ai_sickness_cases (id, user_id, pet_species, pet_age_months, symptoms, additional_context, suspected_condition, urgency_level, requires_vet_visit, status, source, created_at) FROM stdin;
\.


ALTER TABLE public.ai_sickness_cases ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, email, password, role, first_name, last_name, username, phone, address, city, state, zip_code, country, bio, profile_image_url, is_active, is_verified, is_veterinarian, is_pet_caregiver, professional_license, experience_years, specializations, followers_count, following_count, posts_count, created_at, updated_at, last_login) FROM stdin;
9b36e2fe-7cc8-4df9-892b-8bc89bb9cc2d	alice@example.com	hashed_password	user	Alice	Johnson	alice_loves_dogs	+1-555-0101	123 Oak Street	Portland	OR	97201	USA	Dog lover and pet care enthusiast. Have two golden retrievers.	\N	t	t	f	t	\N	\N	\N	125	87	23	2026-02-11 15:53:10.294757	2026-02-11 15:53:10.294766	\N
0eb83583-947f-4c3a-9100-3076ec6b297c	dr_smith@vetclinic.com	hashed_password	user	Dr. Michael	Smith	dr_smith_dvm	+1-555-0102	456 Elm Avenue	Portland	OR	97202	USA	Licensed veterinarian with 15 years of experience. Emergency care specialist.	\N	t	t	t	f	DVM-OR-2008-12345	15	Emergency medicine, surgery, internal medicine	456	34	67	2026-02-11 15:53:10.301016	2026-02-11 15:53:10.301027	\N
2ba68a2c-3386-4d4b-8804-0d2589760705	groom_paradise@email.com	hashed_password	user	Sarah	Williams	groom_paradise	+1-555-0103	789 Pine Road	Portland	OR	97203	USA	Professional pet groomer. Certified in advanced grooming techniques.	\N	t	t	f	t	\N	8	Dog grooming, cat bathing, nail care	234	56	89	2026-02-11 15:53:10.303891	2026-02-11 15:53:10.303901	\N
26fcd986-5ea4-4a04-8255-d7f3b9009975	bob@example.com	hashed_password	user	Bob	Martinez	cat_dad_bob	+1-555-0104	321 Maple Lane	Portland	OR	97204	USA	Cat enthusiast. Looking for advice on kitten care and behavior.	\N	t	f	f	f	\N	\N	\N	45	123	5	2026-02-11 15:53:10.303909	2026-02-11 15:53:10.303913	\N
10d9df25-458d-4d70-93dd-03c2bc8c98ff	shoishob@gmail.com	$2b$12$nwXH9vgftKcBL.47LHtBCeg8F7BAHhGT5RpPhmHnwOT8PXzkmoCje	user	Shoishob	Ahmed	shoishob707	01405453554	\N	Dhaka	\N	\N	Bangladesh	I foster rescue cats	/uploads/d6ac497133354fe7a6523d753e51ef3f.jpg	t	f	f	t	\N	\N	Nutritions	0	0	0	2026-02-14 12:37:20.115666	2026-03-03 18:54:52.799878	2026-03-03 18:44:23.770003
ff6cad72-c52d-4555-9997-df21fd084557	admin@petcarehub.local	$2b$12$dVAx5aay4OFV3rYkh5xMM.Vx2IJvVV5nVN6iu/Y4ucw/fXBhj.i7S	admin	System	Admin	admin	01405453554	\N	Dhaka	\N	\N	Bangladesh	just like you	/uploads/c6bdc1d5d3034037b8ca635a3b1dd676.jpg	t	t	t	t	\N	\N	Rescue, Fostering	0	0	0	2026-02-14 12:09:51.487945	2026-04-06 14:35:25.975866	2026-04-06 14:35:25.970666
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: pets; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.pets DISABLE TRIGGER ALL;

COPY public.pets (id, owner_id, name, species, breed, age, weight, color, microchip_id, last_vet_visit, vaccinated, neutered_spayed, blood_type, bio, profile_image_url, is_active, created_at, updated_at) FROM stdin;
7f9fd740-3ae8-483f-939d-4794bdd9c95b	9b36e2fe-7cc8-4df9-892b-8bc89bb9cc2d	Max	Dog	Golden Retriever	36	32 kg	Golden	Golden-12345-67890	\N	t	t	DEA 1.1 positive	Friendly and energetic. Loves fetch and swimming.	\N	t	2026-02-11 15:53:10.325399	2026-02-11 15:53:10.325406
5ffac37e-18e3-4c43-8931-11bce8c70460	9b36e2fe-7cc8-4df9-892b-8bc89bb9cc2d	Bella	Dog	Golden Retriever	24	28 kg	Light Golden	Golden-98765-43210	\N	t	t	DEA 1.1 positive	Gentle and calm. Great with kids.	\N	t	2026-02-11 15:53:10.32541	2026-02-11 15:53:10.325413
7c5420de-d209-4cc0-961b-272257baead1	26fcd986-5ea4-4a04-8255-d7f3b9009975	Whiskers	Cat	Persian	48	4.5 kg	White	Cat-11111-22222	\N	t	t	Type B	Shy but affectionate. Enjoys quiet environments.	\N	t	2026-02-11 15:53:10.325416	2026-02-11 15:53:10.325418
\.


ALTER TABLE public.pets ENABLE TRIGGER ALL;

--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.appointments DISABLE TRIGGER ALL;

COPY public.appointments (id, pet_id, title, description, appointment_type, status, appointment_date, duration_minutes, provider_name, provider_phone, location, notes, reminder_sent, created_at, updated_at) FROM stdin;
cea37c80-c73f-4af9-939f-0ea94d8c0779	7f9fd740-3ae8-483f-939d-4794bdd9c95b	Dental Cleaning	Professional dental cleaning and check for cavities	vet	scheduled	2026-02-25 21:53:10.354101	60	Dr. Michael Smith	+1-555-0102	Portland Veterinary Clinic	Bring vaccination records	f	2026-02-11 15:53:10.360339	2026-02-11 15:53:10.360349
4a6d3ce4-1f58-40b9-bce8-fc880f4246dd	5ffac37e-18e3-4c43-8931-11bce8c70460	Grooming Session	Full body grooming with nail trim	grooming	scheduled	2026-02-18 21:53:10.35581	120	Sarah Williams	+1-555-0103	Groom Paradise Salon	Request hypoallergenic shampoo	f	2026-02-11 15:53:10.360356	2026-02-11 15:53:10.36036
\.


ALTER TABLE public.appointments ENABLE TRIGGER ALL;

--
-- Data for Name: care_team_members; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.care_team_members DISABLE TRIGGER ALL;

COPY public.care_team_members (id, name, role, bio, specialties, availability, location, contact, photo_url, created_at) FROM stdin;
ca84f01b-20e7-437d-8746-771af9cbe2bd	Dr. Tessa Morgan	Lead Veterinarian	Specializes in emergency triage and preventive care.	Emergency care, internal medicine	Mon-Fri, 8am-4pm	Downtown Clinic	tessa@petcarehub.local	https://images.pexels.com/photos/5355869/pexels-photo-5355869.jpeg?auto=compress&cs=tinysrgb&w=800	2026-02-11 11:55:34.534276
087a8858-4c6e-45e4-803f-2a70fffde4ec	Luis Ortega	Community Care Coordinator	Connects pet parents with local resources and fosters.	Foster coordination, intake support	Daily, 10am-6pm	Community Hub	luis@petcarehub.local	https://images.pexels.com/photos/845457/pexels-photo-845457.jpeg?auto=compress&cs=tinysrgb&w=800	2026-02-11 11:55:34.53433
b2cc6def-7281-4bcd-9c1b-d7f73daec665	Amina Walsh	Behavior Specialist	Helps reduce stress and anxiety for pets in transition.	Behavior coaching, enrichment plans	Tue-Sat, 12pm-7pm	East Side Studio	amina@petcarehub.local	https://images.pexels.com/photos/5327904/pexels-photo-5327904.jpeg?auto=compress&cs=tinysrgb&w=800	2026-02-11 11:55:34.534361
\.


ALTER TABLE public.care_team_members ENABLE TRIGGER ALL;

--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.chat_rooms DISABLE TRIGGER ALL;

COPY public.chat_rooms (id, name, is_group, created_by_id, created_at, updated_at) FROM stdin;
a8356e9f-b460-46bc-b54d-aa9716e226cf	\N	f	ff6cad72-c52d-4555-9997-df21fd084557	2026-02-16 11:26:47.880883	2026-03-03 09:09:22.940367
ab5788d2-bb00-41e1-a691-1a618cc1c8a3	\N	f	10d9df25-458d-4d70-93dd-03c2bc8c98ff	2026-02-22 17:17:19.434882	2026-02-22 17:17:26.837892
18db61fa-44ee-47f3-a7e4-6aa37254142c	Test Group	t	10d9df25-458d-4d70-93dd-03c2bc8c98ff	2026-03-03 18:37:41.182706	2026-03-03 18:37:52.583774
\.


ALTER TABLE public.chat_rooms ENABLE TRIGGER ALL;

--
-- Data for Name: chat_member_requests; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.chat_member_requests DISABLE TRIGGER ALL;

COPY public.chat_member_requests (id, room_id, requester_id, target_user_id, status, requested_at, reviewed_at, reviewed_by_id) FROM stdin;
\.


ALTER TABLE public.chat_member_requests ENABLE TRIGGER ALL;

--
-- Data for Name: chat_members; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.chat_members DISABLE TRIGGER ALL;

COPY public.chat_members (id, room_id, user_id, role, joined_at, last_read_at) FROM stdin;
f44ec2c1-2289-4fc8-9052-a81e45701abd	ab5788d2-bb00-41e1-a691-1a618cc1c8a3	10d9df25-458d-4d70-93dd-03c2bc8c98ff	member	2026-02-22 17:17:19.443098	2026-02-22 17:26:18.922023
1e66f945-1b19-4aff-937c-68bfe68259f1	ab5788d2-bb00-41e1-a691-1a618cc1c8a3	26fcd986-5ea4-4a04-8255-d7f3b9009975	member	2026-02-22 17:17:19.443152	2026-02-22 17:17:19.439393
1d7bbd2e-9b27-441f-b2b7-893a224335f8	a8356e9f-b460-46bc-b54d-aa9716e226cf	10d9df25-458d-4d70-93dd-03c2bc8c98ff	member	2026-02-16 11:26:47.883197	2026-03-03 18:37:14.570564
e210277d-7b4f-49e3-b9e5-0f34a1235344	18db61fa-44ee-47f3-a7e4-6aa37254142c	9b36e2fe-7cc8-4df9-892b-8bc89bb9cc2d	member	2026-03-03 18:37:41.207994	2026-03-03 18:37:41.203977
e7343881-9df8-4e89-ac9b-f95b6d0d3f59	18db61fa-44ee-47f3-a7e4-6aa37254142c	0eb83583-947f-4c3a-9100-3076ec6b297c	member	2026-03-03 18:37:41.208024	2026-03-03 18:37:41.204141
20ab0ec1-0e2e-4ab7-8998-3bb2a37677be	18db61fa-44ee-47f3-a7e4-6aa37254142c	2ba68a2c-3386-4d4b-8804-0d2589760705	member	2026-03-03 18:37:41.208053	2026-03-03 18:37:41.204236
e7770ed4-6fa0-4e83-b458-465911ae5e93	18db61fa-44ee-47f3-a7e4-6aa37254142c	26fcd986-5ea4-4a04-8255-d7f3b9009975	member	2026-03-03 18:37:41.208079	2026-03-03 18:37:41.204322
8b8d20aa-b1bc-4358-9844-78b73de2c981	18db61fa-44ee-47f3-a7e4-6aa37254142c	10d9df25-458d-4d70-93dd-03c2bc8c98ff	admin	2026-03-03 18:37:41.207945	2026-03-03 18:54:00.812928
115c41fe-edf8-48a0-b62f-1548145f870e	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	member	2026-02-16 11:26:47.883185	2026-03-15 09:51:57.673039
343bcd10-951d-484e-9cb0-8381bb86aaac	18db61fa-44ee-47f3-a7e4-6aa37254142c	ff6cad72-c52d-4555-9997-df21fd084557	member	2026-03-03 18:37:41.208105	2026-03-15 10:00:43.237188
\.


ALTER TABLE public.chat_members ENABLE TRIGGER ALL;

--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages DISABLE TRIGGER ALL;

COPY public.chat_messages (id, room_id, sender_id, message_type, content, file_url, file_name, location_lat, location_lng, location_label, created_at, updated_at) FROM stdin;
607bb5c1-1911-4040-ae35-23e2a74751d6	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	text	Hello Shoishob!	\N	\N	\N	\N	\N	2026-02-16 11:27:11.051305	2026-02-16 11:27:11.051311
978f1893-dc3e-4624-911b-7abe07982689	a8356e9f-b460-46bc-b54d-aa9716e226cf	10d9df25-458d-4d70-93dd-03c2bc8c98ff	text	Hi. Checkout my new cat!	\N	\N	\N	\N	\N	2026-02-16 11:28:11.303425	2026-02-16 11:28:11.303431
e51f44d5-9e6d-4adc-9f32-827956f03d95	a8356e9f-b460-46bc-b54d-aa9716e226cf	10d9df25-458d-4d70-93dd-03c2bc8c98ff	image	\N	/uploads/2019d1647d0f4b49a5625f7c82256e1b.jpg	minimalismcat-1728765637221-4873.jpg	\N	\N	\N	2026-02-16 11:28:19.797937	2026-02-16 11:28:19.797943
40ddc123-1662-4edf-a92e-e190b952c4e3	a8356e9f-b460-46bc-b54d-aa9716e226cf	10d9df25-458d-4d70-93dd-03c2bc8c98ff	text	How is it?	\N	\N	\N	\N	\N	2026-02-16 11:28:29.21568	2026-02-16 11:28:29.215687
b8dd6084-77de-4292-8de1-5e2ae94924f6	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	text	Whoaa!	\N	\N	\N	\N	\N	2026-02-16 11:29:20.203525	2026-02-16 11:29:20.203528
30df24ff-ec43-4e12-9c3c-38eaa143017f	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	location	\N	\N	\N	23.749868	90.34812	Shared location (23.749868, 90.34812)	2026-02-16 11:31:45.108789	2026-02-16 11:31:45.108793
4ae84b82-4d74-487c-a936-8bdfecc25549	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	text	hhh	\N	\N	\N	\N	\N	2026-02-16 11:41:40.305291	2026-02-16 11:41:40.305294
34456d15-1d56-4df0-89bf-1bbe02b69881	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	text	hhh	\N	\N	\N	\N	\N	2026-02-16 11:41:44.022198	2026-02-16 11:41:44.022203
1c236436-62df-48c0-acfa-ffcb30348a2d	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	text	Hello	\N	\N	\N	\N	\N	2026-02-22 16:53:51.72451	2026-02-22 16:53:51.724516
dc1d1e86-e883-43a6-8a57-1bf4b9d833fa	ab5788d2-bb00-41e1-a691-1a618cc1c8a3	10d9df25-458d-4d70-93dd-03c2bc8c98ff	text	How are you doing?	\N	\N	\N	\N	\N	2026-02-22 17:17:26.849059	2026-02-22 17:17:26.849069
92fcf3e1-c0cd-454c-9d63-3cbcd4724a03	a8356e9f-b460-46bc-b54d-aa9716e226cf	ff6cad72-c52d-4555-9997-df21fd084557	location	this is my current location	\N	\N	23.804078	90.355801	this is my current location	2026-03-03 09:09:22.947111	2026-03-03 09:09:22.947116
b8b04610-c515-4bef-8d26-44b1c7aaa48f	18db61fa-44ee-47f3-a7e4-6aa37254142c	10d9df25-458d-4d70-93dd-03c2bc8c98ff	text	Hello everyone ❤️	\N	\N	\N	\N	\N	2026-03-03 18:37:52.593803	2026-03-03 18:37:52.593817
\.


ALTER TABLE public.chat_messages ENABLE TRIGGER ALL;

--
-- Data for Name: community_posts; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.community_posts DISABLE TRIGGER ALL;

COPY public.community_posts (id, title, body, category, author_id, author_name, author_avatar, reaction_count, comment_count, share_count, view_count, is_pinned, is_verified, status, tags, location, image_url, featured, featured_at, created_at, updated_at) FROM stdin;
1b4ec1aa-f5d4-4a18-984e-382e7186d02b	Neighborhood reminder: keep collars updated	A quick check of ID tags makes reunions faster. Share your tips!	Tip	\N	PetCare Hub	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=900	\N	\N	2026-02-11 11:55:34.548185	2026-02-13 15:08:12.251291
a56a9a6c-b645-4c9d-a10d-d466a638cfa6	Volunteer walkers needed this weekend	We have three foster pups needing short walks. Reply if you can help.	Volunteer	\N	Care Team	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	https://images.pexels.com/photos/1420405/pexels-photo-1420405.jpeg?auto=compress&cs=tinysrgb&w=900	\N	\N	2026-02-11 11:55:34.548228	2026-02-13 15:07:11.540457
\.


ALTER TABLE public.community_posts ENABLE TRIGGER ALL;

--
-- Data for Name: community_post_comments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.community_post_comments DISABLE TRIGGER ALL;

COPY public.community_post_comments (id, post_id, user_id, parent_id, author_name, body, created_at) FROM stdin;
9167af00-f807-4b78-b2a6-ce2ae6f65b7c	a56a9a6c-b645-4c9d-a10d-d466a638cfa6	\N	\N	\N	Hello There!	2026-02-11 17:24:40.400484
34d4f92b-0d33-47d9-9b34-60af8c1a4c52	1b4ec1aa-f5d4-4a18-984e-382e7186d02b	\N	\N	\N	Hola!	2026-02-11 18:29:44.98511
\.


ALTER TABLE public.community_post_comments ENABLE TRIGGER ALL;

--
-- Data for Name: community_post_images; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.community_post_images DISABLE TRIGGER ALL;

COPY public.community_post_images (id, post_id, file_name, created_at) FROM stdin;
9571860f-cb4a-49c3-802d-7c53220edfdc	a56a9a6c-b645-4c9d-a10d-d466a638cfa6	886e01a22d0541f4971493ff85c290c2.jpeg	2026-02-11 16:21:03.24904
9d446cbf-fb9a-44bd-81d3-12876d98ac8b	1b4ec1aa-f5d4-4a18-984e-382e7186d02b	39fe91f2fa9c43fe9df3bdde5abcfea2.jpg	2026-02-14 12:19:35.849279
\.


ALTER TABLE public.community_post_images ENABLE TRIGGER ALL;

--
-- Data for Name: community_post_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.community_post_reactions DISABLE TRIGGER ALL;

COPY public.community_post_reactions (id, post_id, user_id, created_at) FROM stdin;
\.


ALTER TABLE public.community_post_reactions ENABLE TRIGGER ALL;

--
-- Data for Name: home_page_content; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.home_page_content DISABLE TRIGGER ALL;

COPY public.home_page_content (id, content_json, updated_by_user_id, created_at, updated_at) FROM stdin;
1	{"badge":"✨ Neighborhood Pet Safety","title_prefix":"Your Pet Community,","title_highlight":"Connected & Safe","description":"Report sightings instantly. Connect with veterinarians and pet professionals. Keep your pets safe and your community informed—all in one platform designed for pet lovers.","primary_cta_label":"Create Your First Post","primary_cta_href":"/feed#updates-board","secondary_cta_label":"Explore Community Feed","secondary_cta_href":"/feed","stats":[{"label":"Active Users","value":"1,847+"},{"label":"Pets Helped","value":"1,234+"},{"label":"Reports Posted","value":"5,678+"},{"label":"Communities","value":"12+"}],"features":[{"icon":"Shield","title":"Lost & Found Reports","description":"Create detailed reports with photos, location, and pet details to help bring pets home safely."},{"icon":"Heart","title":"Health & Wellness","description":"Share health concerns, get professional vet advice, and track your pet's medical history."},{"icon":"Users","title":"Care Community","description":"Connect with local pet professionals, groomers, trainers, and fellow pet enthusiasts."},{"icon":"MessageSquare","title":"Real-time Feed","description":"Comment, react, and get instant notifications when there's activity on your posts."},{"icon":"Zap","title":"Smart Alerts","description":"Set location-based alerts to stay informed about pet incidents in your neighborhood."},{"icon":"Users","title":"Professional Network","description":"Find verified veterinarians, groomers, trainers, and pet sitters in your area."}],"ai_pathway":{"title":"AI Readiness for Sickness Insights","description":"We prepare structured symptom and case data so future AI models can assist triage and condition detection at scale.","disclaimer":"AI suggestions are assistive only and do not replace a licensed veterinarian diagnosis."}}	ff6cad72-c52d-4555-9997-df21fd084557	2026-03-03 18:50:18.001618	2026-03-03 18:59:11.559444
\.


ALTER TABLE public.home_page_content ENABLE TRIGGER ALL;

--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.medical_records DISABLE TRIGGER ALL;

COPY public.medical_records (id, pet_id, record_type, description, veterinarian, clinic_name, medications, record_date, created_at) FROM stdin;
d52280c7-6480-42bc-8592-af1f50f02e3e	7f9fd740-3ae8-483f-939d-4794bdd9c95b	vaccination	Annual rabies and DHPP vaccination	Dr. Michael Smith	Portland Veterinary Clinic	Nobivac DHPP, Nobivac Rabies	2026-01-12 21:53:10.3398	2026-02-11 15:53:10.343369
e29dd1cd-3552-4bf9-adff-a89fde6b4502	7f9fd740-3ae8-483f-939d-4794bdd9c95b	checkup	Annual wellness exam. All vitals normal.	Dr. Michael Smith	Portland Veterinary Clinic	\N	2026-01-17 21:53:10.340001	2026-02-11 15:53:10.343375
3f82c46c-7a87-4631-a381-ee6b30eacf34	7c5420de-d209-4cc0-961b-272257baead1	vaccination	FVRCP vaccination update	Dr. Emily Johnson	Eastside Pet Hospital	FVRCP vaccine	2025-12-13 21:53:10.341125	2026-02-11 15:53:10.343378
\.


ALTER TABLE public.medical_records ENABLE TRIGGER ALL;

--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.reports DISABLE TRIGGER ALL;

COPY public.reports (id, title, description, location, latitude, longitude, category, status, species, breed, urgency, reporter_name, reporter_email, reporter_phone, reaction_count, comment_count, view_count, pet_name, pet_age, pet_color, pet_microchip, is_verified, is_resolved, resolved_at, created_at, updated_at) FROM stdin;
917c56d3-cb13-484f-9c8e-b0476031bb71	Demo Report	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	Dhaka, Bangladesh	\N	\N	Lost	open	Cat	\N	medium	Shoishob Al Baki	\N	\N	9	2	0	\N	\N	\N	\N	f	f	\N	2026-02-11 17:26:19.008914	2026-02-14 12:57:10.091084
\.


ALTER TABLE public.reports ENABLE TRIGGER ALL;

--
-- Data for Name: report_comments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.report_comments DISABLE TRIGGER ALL;

COPY public.report_comments (id, report_id, user_id, parent_id, author_name, body, created_at) FROM stdin;
82d3faf4-131d-4830-b221-49145967ac6d	917c56d3-cb13-484f-9c8e-b0476031bb71	\N	\N	\N	Nice Post Mama!	2026-02-11 17:26:46.685881
b318b9c3-49cd-4ef8-ab5e-c72a4ca35971	917c56d3-cb13-484f-9c8e-b0476031bb71	\N	82d3faf4-131d-4830-b221-49145967ac6d	\N	Demo Reply	2026-02-11 18:28:22.498485
6499a667-f73a-47ef-9142-23283f7061f8	917c56d3-cb13-484f-9c8e-b0476031bb71	\N	\N	\N	Congratulations on your first post <3	2026-02-13 15:05:01.051611
edb0f28a-1052-4a31-a625-5ad1bba22163	917c56d3-cb13-484f-9c8e-b0476031bb71	10d9df25-458d-4d70-93dd-03c2bc8c98ff	\N	Shoishob Ahmed	Test Comment	2026-02-14 12:37:38.751502
f14f287b-ea6c-45b2-ac6d-75679d792255	917c56d3-cb13-484f-9c8e-b0476031bb71	ff6cad72-c52d-4555-9997-df21fd084557	edb0f28a-1052-4a31-a625-5ad1bba22163	System Admin	Test reply from Admin	2026-02-14 12:38:30.522493
\.


ALTER TABLE public.report_comments ENABLE TRIGGER ALL;

--
-- Data for Name: report_images; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.report_images DISABLE TRIGGER ALL;

COPY public.report_images (id, report_id, file_name, created_at) FROM stdin;
b17a6954-b6a7-46b0-bae1-44296fc87e85	917c56d3-cb13-484f-9c8e-b0476031bb71	f87a524924474757879a3125a1009378.jpeg	2026-02-11 17:26:19.134585
\.


ALTER TABLE public.report_images ENABLE TRIGGER ALL;

--
-- Data for Name: report_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.report_reactions DISABLE TRIGGER ALL;

COPY public.report_reactions (id, report_id, user_id, created_at) FROM stdin;
85060adc-4531-4620-b0ac-6b9842f50d5b	917c56d3-cb13-484f-9c8e-b0476031bb71	ff6cad72-c52d-4555-9997-df21fd084557	2026-02-14 12:38:50.291238
6702ec59-8adc-468b-994b-a9b8c8520ba8	917c56d3-cb13-484f-9c8e-b0476031bb71	10d9df25-458d-4d70-93dd-03c2bc8c98ff	2026-02-14 12:57:10.101586
\.


ALTER TABLE public.report_reactions ENABLE TRIGGER ALL;

--
-- Data for Name: sicknesses; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sicknesses DISABLE TRIGGER ALL;

COPY public.sicknesses (id, name, species, summary, description, symptoms, remedies, prevention, severity, category, contagious, causes, incubation_period, transmission_methods, affected_age_group, typical_treatment_duration, requires_veterinary_care, prognosis, view_count, helpful_count, comment_count, reported_by_id, is_verified, verified_by, created_at, updated_at) FROM stdin;
bfd147e6-002f-4060-8c6c-7774c3db6564	Parvovirus	Dog	Highly contagious viral illness affecting the GI tract.	\N	Vomiting, severe diarrhea, lethargy, loss of appetite.	Immediate veterinary care, fluids, isolation, supportive meds.	\N	Critical	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 11:55:34.551813	\N
a8d4d83d-41d7-4823-8867-fd35b4d6a04d	Feline Upper Respiratory Infection	Cat	Common respiratory condition often caused by viruses.	\N	Sneezing, nasal discharge, watery eyes, cough.	Hydration, warm environment, vet-prescribed meds.	\N	Moderate	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 11:55:34.551855	\N
9443e670-e296-454b-847b-10c416490b59	Skin Allergies	Dog	Allergic reactions triggered by food or environment.	\N	Itching, redness, hot spots, hair loss.	Allergy testing, medicated baths, diet adjustments.	\N	Variable	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 11:55:34.551884	\N
\.


ALTER TABLE public.sicknesses ENABLE TRIGGER ALL;

--
-- Data for Name: sickness_images; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sickness_images DISABLE TRIGGER ALL;

COPY public.sickness_images (id, sickness_id, file_name, created_at) FROM stdin;
81c4d185-47bf-48ea-8d7f-b62489e7e61a	a8d4d83d-41d7-4823-8867-fd35b4d6a04d	2e69146987194106a74a7ae3c2bd5e6d.webp	2026-02-16 10:31:14.325644
cc4d0e79-8f64-4e92-a0ab-3c1f3d23189b	9443e670-e296-454b-847b-10c416490b59	ed2181ee4d294a25b7a8af6be7128cb5.webp	2026-02-16 10:44:45.564805
b771928d-cd48-465a-a39c-ae4b11fdaf97	bfd147e6-002f-4060-8c6c-7774c3db6564	696f8965434a447aaca38e89e1608d53.jpg	2026-02-16 10:45:14.357754
\.


ALTER TABLE public.sickness_images ENABLE TRIGGER ALL;

--
-- Data for Name: user_reports; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.user_reports DISABLE TRIGGER ALL;

COPY public.user_reports (user_id, report_id) FROM stdin;
\.


ALTER TABLE public.user_reports ENABLE TRIGGER ALL;

--
-- Name: ai_sickness_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_sickness_cases_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict ehFrdSZ1C9Hey3t2TLcIf3JyMlCAbCubOGCTFIeBNKFaixpgORKMVdXBQ24k9c3

