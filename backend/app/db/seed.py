from app.db.session import SessionLocal
from app.models.care_team import CareTeamMember
from app.models.community_posts import CommunityPost
from app.models.sicknesses import Sickness


def seed_data() -> None:
    db = SessionLocal()
    try:
        if not db.query(Sickness).first():
            db.add_all(
                [
                    Sickness(
                        name="Parvovirus",
                        species="Dog",
                        summary="Highly contagious viral illness affecting the GI tract.",
                        symptoms="Vomiting, severe diarrhea, lethargy, loss of appetite.",
                        remedies="Immediate veterinary care, fluids, isolation, supportive meds.",
                        severity="Critical",
                    ),
                    Sickness(
                        name="Feline Upper Respiratory Infection",
                        species="Cat",
                        summary="Common respiratory condition often caused by viruses.",
                        symptoms="Sneezing, nasal discharge, watery eyes, cough.",
                        remedies="Hydration, warm environment, vet-prescribed meds.",
                        severity="Moderate",
                    ),
                    Sickness(
                        name="Skin Allergies",
                        species="Dog",
                        summary="Allergic reactions triggered by food or environment.",
                        symptoms="Itching, redness, hot spots, hair loss.",
                        remedies="Allergy testing, medicated baths, diet adjustments.",
                        severity="Variable",
                    ),
                ]
            )

        if not db.query(CareTeamMember).first():
            db.add_all(
                [
                    CareTeamMember(
                        name="Dr. Tessa Morgan",
                        role="Lead Veterinarian",
                        bio="Specializes in emergency triage and preventive care.",
                        specialties="Emergency care, internal medicine",
                        availability="Mon-Fri, 8am-4pm",
                        location="Downtown Clinic",
                        contact="tessa@petcarehub.local",
                        photo_url="https://images.pexels.com/photos/5355869/pexels-photo-5355869.jpeg?auto=compress&cs=tinysrgb&w=800",
                    ),
                    CareTeamMember(
                        name="Luis Ortega",
                        role="Community Care Coordinator",
                        bio="Connects pet parents with local resources and fosters.",
                        specialties="Foster coordination, intake support",
                        availability="Daily, 10am-6pm",
                        location="Community Hub",
                        contact="luis@petcarehub.local",
                        photo_url="https://images.pexels.com/photos/845457/pexels-photo-845457.jpeg?auto=compress&cs=tinysrgb&w=800",
                    ),
                    CareTeamMember(
                        name="Amina Walsh",
                        role="Behavior Specialist",
                        bio="Helps reduce stress and anxiety for pets in transition.",
                        specialties="Behavior coaching, enrichment plans",
                        availability="Tue-Sat, 12pm-7pm",
                        location="East Side Studio",
                        contact="amina@petcarehub.local",
                        photo_url="https://images.pexels.com/photos/5327904/pexels-photo-5327904.jpeg?auto=compress&cs=tinysrgb&w=800",
                    ),
                ]
            )

        if not db.query(CommunityPost).first():
            db.add_all(
                [
                    CommunityPost(
                        title="Neighborhood reminder: keep collars updated",
                        body="A quick check of ID tags makes reunions faster. Share your tips!",
                        category="Tip",
                        author_name="PetCare Hub",
                        image_url="https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=900",
                    ),
                    CommunityPost(
                        title="Volunteer walkers needed this weekend",
                        body="We have three foster pups needing short walks. Reply if you can help.",
                        category="Volunteer",
                        author_name="Care Team",
                        image_url="https://images.pexels.com/photos/1420405/pexels-photo-1420405.jpeg?auto=compress&cs=tinysrgb&w=900",
                    ),
                ]
            )

        db.commit()
    finally:
        db.close()
