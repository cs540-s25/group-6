# 🧑‍💻 Group 6's team project

## Project Proposal
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

