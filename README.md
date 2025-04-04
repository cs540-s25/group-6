# 🧑‍💻 Group 6's team project

<img width="1000" alt="Screenshot 2025-04-04 at 11 01 08 AM" src="https://github.com/user-attachments/assets/94177b36-03a2-4b0d-b1c5-15d14d7fef3f" />

### How to deploy on your local machine

1. Enter your Google email address for `YOUR_MAIL_USERNAME` and the app password created from here for `YOUR_MAIL_PASSWORD`.

```
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'YOUR_MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'YOUR_MAIL_PASSWORD')
```

2. Run the Flask backend.

```
cd backend/
python app.py
```

3. Run the JS frontend.

```
cd frontend/
npm start
```

## 1️⃣ Project Proposal
- Project Overview
> ReSource is a comprehensive platform designed to address resource inequality by connecting those with surplus resources to those in need. The platform will be developed in a phased approach, initially focusing on food redistribution to combat hunger, followed by book sharing to improve access to educational materials, with potential future expansions to furniture redistribution and financial contributions. By leveraging technology and community engagement, ReSource creates an efficient ecosystem for resource redistribution, reducing waste while addressing fundamental needs.
- Problem Statement
> Our society faces significant paradoxes of abundance and scarcity existing simultaneously. While millions struggle with food insecurity, approximately one-third of all food produced globally is wasted. Similarly, educational inequality persists partly due to uneven access to learning materials, while many households have books that are no longer needed or used. ReSource seeks to bridge these gaps by creating infrastructure that efficiently redistributes surplus resources to those who need them most.

### Intended Users
- For Food Sharing System (Phase 1):
  - (1) Food Providers:
    - Restaurants and cafes with surplus prepared meals / Grocery stores with excess inventory / Farmers with surplus produce / Food manufacturers with overstock / Individuals with extra food from events or personal storage / Catering services with leftover prepared meals
  - (2) Food Recipients:
    - Food-insecure individuals and families Community centers serving vulnerable populations / Students facing food insecurity / Elderly individuals on fixed incomes / Shelter and transitional housing residents / Low-income neighborhoods with limited food access.
- (3) Facilitators:
  - Non-profit organizations focused on hunger relief /  Community kitchens and food banks / Volunteer delivery networks / Social service agencies
- For Book Sharing System (Phase 2):
  - (1) Book Donors:
    - Students who have completed courses / Families whose children have outgrown certain books / Individuals looking to downsize their collections / Schools updating their libraries / Book clubs with finished selections
  - (2) Book Recipients:
    - Students at all educational levels / Self-learners with limited resources / Libraries in underserved communities / Educational programs with limited budgets / Literacy organizations

### Tech Stack
- Frontend
  - React.js: For building a responsive and interactive user interface
  - HTML/CSS: For structure and styling
  - Material UI or Bootstrap: For design components and responsive layouts
- Backend
  - Flask: Python-based backend framework for API development
  - SQLAlchemy: ORM for database interactions
- Database
  - PostgreSQL: Robust relational database for storing user data, resource listings, and transactions
- Storage
  - Google Cloud Storage: For storing images of food items, books, and other media
- Authentication
  - JWT (JSON Web Tokens): For secure user authentication and authorization
- Geolocation
  - Google Maps API: For location-based services, pickup/delivery coordination
- Version Control & Collaboration
  - Git: For version control and team collaboration
- Deployment
  - Google Cloud Platform: For application hosting and infrastructure management
  - Docker: For containerization to ensure consistent development and deployment environments

### Development Phases and Functionality
- Phase 1: Food Sharing System
  - User Management
    - Registration and profile creation for all user types / Role-based access and permissions / JWT-based authentication / User dashboards customized by role
  - Food Listing
    - Interface for posting surplus food with details: Food type and quantity / Preparation/expiration dates / Allergen information / Pickup location and availability window / Photo upload capability / Browsing and searching / functionality by location and food type / Real-time availability updates
  - Matching and Reservation
    - System for recipients to reserve available food / Notification system for time-sensitive items / Confirmation process for both providers and recipients
  - Logistics
    - Volunteer rider registration and scheduling / Pickup and delivery coordination / Delivery route optimization
  - Quality Assurance
    - Rating and feedback system / Food safety guidelines and compliance / User verification process
  - Impact Tracking
    - Metrics for food saved and distributed / Success stories and testimonials / Basic analytics dashboard
- Phase 2: Book Sharing System
  - Book Listing
    - Interface for donors to post available books with details: Title, author, publisher / Condition assessment / Genre/subject classification / Educational level relevance / Pickup/delivery options / Simple post creation for users to list books they no longer need
  - Book Discovery
    - Search and browse functionality / Filtering by subject, level, and location / Wishlist creation for needed books
  - Connection System
    - Direct messaging between donors and recipients / Arrangement of exchange logistics / Confirmation of successful transfers
  - Tracking
    - System for recording successful book donations / Impact metrics based on educational value / Optional categorization by educational level and subject matter (if time permits)
- Future Phases (If Project Completes Early)
  - Furniture Redistribution
    - Listing system for household items and furniture / Logistics solutions for larger item transportation / Category-based organization of furniture types
  - Financial Contribution System
    - Integration with either Stripe or PayPal API
    - Secure payment gateway for monetary donations
    - Donation tracking and acknowledgment
    - Transparent reporting on fund utilization
    - Recurring donation options
    - Tax receipt generation for eligible contributions

### Risk Management
- If Project Takes More Time Than Anticipated
  - Core Feature Prioritization: Focus first on the essential food sharing functionality / Ensure the basic user management, food listing, and reservation systems are robust / Defer advanced features like analytics and impact tracking to later phases
  - Geographic Limitation:
    - Start with a smaller target area for initial deployment / Validate the system with a limited user base before expanding / Reduce scope of supported food types if necessary
  - Simplified MVP:
    - Reduce complexity in the matching algorithm / Implement manual verification processes initially rather than automated ones / Streamline UI/UX to focus on functionality over aesthetics
  - Feature Postponement:
    - Delay the book sharing system if food sharing implementation takes longer / Move any non-essential components to future releases
- If Project Takes Less Time Than Anticipated
  - Phase Acceleration:
    - Move quickly into the book sharing implementation / Begin preliminary work on furniture sharing capabilities / Develop and integrate the financial contribution system
  - Feature Enhancement:
    - Develop more sophisticated matching algorithms / Implement advanced analytics and reporting / Add additional quality-of-life features for all user types
  - Platform Expansion:
    - Develop mobile applications for iOS and Android / Create APIs for integration with existing community services / Add multi-language support for broader accessibility
  - Community Building:
    - Implement gamification elements to encourage participation / Develop community forums and knowledge sharing / Create educational content about reducing waste

### Conclusion
> ReSource aims to create a sustainable solution to resource inequality through a phased approach that prioritizes food redistribution, followed by book sharing and potentially furniture and financial contributions. The platform's strategic development plan ensures that at least one critical function—food sharing—is fully operational before expanding to additional resources. By focusing initially on addressing food insecurity, ReSource will establish its core infrastructure, user base, and operational processes. This foundation will then support the seamless integration of book sharing, primarily benefiting students and lifelong learners who lack access to educational materials. The technical architecture, built on React, Flask, PostgreSQL, and Google Cloud Platform, provides a robust framework that allows for both current functionality and future expansion. JWT authentication ensures secure user interactions, while the modular design enables the team to adapt to changing timelines and requirements. Through this thoughtfully sequenced approach, ReSource will maximize its impact and sustainability, ensuring that even if development challenges arise, the platform will still deliver meaningful value by reducing waste and addressing critical community needs.

## 2️⃣ Project Proposal

### Phase 1: Food Sharing System

| Task                    | Description                                                            | Priority | Est. Time |
|-------------------------|------------------------------------------------------------------------|----------|-----------|
| Project Setup            | Initialize repository, set up tech stack, configure CI/CD pipeline     | P1       | 5 days    |
| Database Schema Design   | Design and implement database models for users, food items, transactions | P1       | 4 days    |
| User Authentication      | Implement user registration, login, role-based access with JWT         | P1       | 6 days    |
| User Profiles            | Create profile management for different user types (providers, recipients, facilitators) | P1       | 4 days    |
| Food Listing - Core      | Implement basic functionality to post food items with essential details | P1       | 7 days    |
| Food Listing - Enhanced  | Add photo uploads, detailed food information, allergen tagging          | P2       | 5 days    |
| Search & Filter          | Create search and filter functionality for food listings by location and type | P1       | 6 days    |
| Reservation System       | Implement system for recipients to reserve available food              | P1       | 7 days    |
| Notification System       | Create system for alerts on available items and reservation confirmations | P2       | 5 days    |
| Pickup/Delivery Coordination | Implement basic logistics for item pickup/delivery                      | P1       | 8 days    |
| Volunteer Management      | Create registration and scheduling for volunteer delivery riders         | P2       | 6 days    |
| Route Optimization        | Implement delivery route optimization for volunteers                     | P3       | 7 days    |
| Rating System            | Develop rating and feedback system for users                            | P2       | 4 days    |
| Food Safety Guidelines   | Implement food safety compliance checking and guidelines                 | P2       | 3 days    |
| User Verification         | Create verification process for users (esp. providers and organizations) | P2       | 5 days    |
| Basic Analytics           | Implement simple metrics tracking for food saved and distributed        | P3       | 5 days    |
| Mobile Responsiveness     | Ensure platform works well on mobile devices                            | P2       | 6 days    |
| Testing & Bug Fixes       | Comprehensive testing and bug fixing for Phase 1                        | P1       | 10 days   |

### Phase 2: Book Sharing System

| Task                    | Description                                                            | Priority | Est. Time |
|-------------------------|------------------------------------------------------------------------|----------|-----------|
| Book Database Models     | Design and implement database models for books                          | P1       | 3 days    |
| Book Listing Interface   | Create interface for donors to post available books with details        | P1       | 6 days    |
| Book Condition Assessment| Implement system for evaluating and reporting book condition            | P2       | 4 days    |
| Book Classification      | Create genre/subject and educational level classification system        | P2       | 5 days    |
| Book Search & Browse     | Implement search and browse functionality for books                     | P1       | 6 days    |
| Wishlist Creation        | Enable recipients to create wishlists for needed books                  | P2       | 4 days    |
| Messaging System         | Implement direct messaging between donors and recipients                | P1       | 7 days    |
| Exchange Logistics       | Create system for arranging book exchanges                              | P1       | 5 days    |
| Transfer Confirmation    | Implement confirmation of successful book transfers                     | P1       | 3 days    |
| Book Impact Tracking     | Develop metrics for book donations and educational impacts              | P3       | 5 days    |
| Book Categorization       | Add educational level and subject matter categorization                  | P3       | 6 days    |
| Integration Testing       | Ensure book system integrates properly with existing platform            | P1       | 7 days    |
| Final Testing & Deployment| Complete testing and deployment of full platform                         | P1       | 8 days    |

### Optional Expansion (If Time Permits)

| Task                     | Description                                                              | Priority | Est. Time |
|--------------------------|--------------------------------------------------------------------------|----------|-----------|
| Furniture Listing System  | Create infrastructure for furniture redistribution                        | P3       | 10 days   |
| Large Item Logistics      | Implement specialized logistics for furniture transport                   | P3       | 8 days    |
| Financial Donation Integration | Integrate with payment gateway (Stripe/PayPal)                         | P3       | 7 days    |
| Donation Tracking         | Create system for tracking and acknowledging financial contributions     | P3       | 5 days    |
| Reporting System          | Implement transparent reporting on fund utilization                      | P3       | 6 days    |
| Mobile Applications       | Develop native mobile apps for iOS and Android                           | P3       | 15 days   |
| Community Forums          | Build community forums for knowledge sharing                             | P3       | 8 days    |
| Gamification Elements     | Implement badges, points, and other engagement features                  | P3       | 7 days    |

## 3️⃣ Team Charters
```
✔️ Communication Norms: 

a) Will your team have regular team meetings? When and where will your team meet?
Regular meetings: Every Monday and Wednesday at 8:30AM via Zoom/in person

b) How will you communicate as a team? (face-to-face, using video conferencing, etc.)
Primary: Slack for daily updates and discord for quick questions.

c) What are the norms for responding to virtual communication?  (e.g., respond to emails within 24 hours, etc.)
Acknowledge messages within 12 hours
 
✔️ Operating Guidelines:

a) How will your team make decisions? 
Consensus for decisions

b) What are your team’s expectations regarding team member performance and contribution quality?  
Complete assigned tasks by deadlines

c) What are your team’s expectations regarding cooperation and attitudes? 
Respect diverse perspectives

d) What are your team's expectations regarding meeting attendance, punctuality, and participation?
Notify the team in advance if unable to attend, and share progress updates in meetings even if absent

e) What precautions will you take to avoid a situation where one or two people are doing an outsized amount of the team’s work?
Weekly check-ins to redistribute tasks if someone is overloaded

f) How will you handle different expectations around when to start on assignments (i.e. some team members procrastinate more than others)?
Break tasks into smaller subtasks with interim deadlines
 
✔️ Conflict Management:

a) What strategies will your team will use to resolve differences of opinions among members? 
Discuss issues openly in meetings

b) What strategies will your team use to deal with non-responsive or underperforming members?
Reassign tasks or provide peer support.

c) How will your team handle unexpected issues (e.g. family emergencies, illnesses, etc.)? 
Adjust deadlines collaboratively for valid reasons
 
✔️ Outside Commitments: 

a) Are there any outside commitments (family, job, personal) that could impact an individual's ability to work on this team project?
Team members should inform the group of major conflicts in advance.

Indicate full team agreement on these decisions: All team members must indicate their agreement by typing their names at the bottom of this document.
Nayoung Choi, Harry Jeon, Atharva Negi, Bohan Wang
```

