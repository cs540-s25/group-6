
# ReSource - Comprehensive Resource Sharing Platform

ReSource is a platform connecting those with surplus resources to those in need within the Emory University community. Initially focusing on food redistribution, it is designed to expand into book sharing, furniture, and financial contributions.

## Table of Contents
- [Features](#features)
- [Backend Architecture](#backend-architecture)
- [Setup Instructions](#setup-instructions)
- [Database and Schema Setup](#database-and-schema-setup)
- [API Documentation](#api-documentation)
- [Connecting to Frontend](#connecting-to-frontend)
- [Development Workflow](#development-workflow)
- [Kanban Board](#kanban-board)
- [Future Enhancements](#future-enhancements)

## Features

### Current Implementation
- **User Registration & Authentication**: Secure signup and login for Emory community members using JWT.
- **Food Listing Management**: Users can post, browse, and search for food items.
- **Real-time Messaging**: Built-in messaging between food providers and recipients.
- **User Profiles**: Each user has a profile showing their listings and basic info.
- **Location-based Functionality**: Interactive map for setting and viewing pickup locations.

## Backend Architecture
- **Flask**: Handles HTTP requests and backend logic
- **SQLAlchemy**: ORM used for database transactions
- **Werkzeug**: Password hashing and authentication support
- **Flask-Mail**: Password recovery via email
- **Flask-CORS**: Enables secure communication with the frontend
- **Flask-SocketIO**: Enables real-time bi-directional communication for features like messaging

## Setup Instructions

### Requirements File
All backend dependencies are listed in `requirements.txt`. Install them using:
```bash
pip install -r requirements.txt
```

Sample content of `requirements.txt`:
```txt
Flask
Flask-CORS
Flask-Mail
Flask-SocketIO
SQLAlchemy
Werkzeug
eventlet
python-dotenv
```

### Environment Configuration

Make enviornment file and name it to `.env` and place it in the root backend directory.

Sample content of `.env` file:
```env


# Flask App Settings
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Optional: Port Configuration
PORT=5001
```
### Prerequisites
- Python 3.x
- pip
- Node.js & npm

### Backend Setup
1. Clone this repository
2. Navigate to the backend directory
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure mail settings in `app.py` using environment variables:
   ```python
   app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'YOUR_MAIL_USERNAME')
   app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'YOUR_MAIL_PASSWORD')
   ```
5. Run the application:
   ```bash
   python app.py
   ```

The server will start on [http://localhost:5001](http://localhost:5001)

> **Note**: If you encounter errors during account creation, try deleting the `__pycache__` and `instance` folders, or change the port number in `app.py` to avoid conflicts.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

Accessible at [http://localhost:3000](http://localhost:3000)

## Database and Schema Setup
- Uses SQLite; no external setup needed
- Schema defined in `app.py` and `resource_db_setup.py`
- To initialize:
   ```python
   with app.app_context():
       db.create_all()
       setup_roles()
   ```
- Load test data:
   Visit [http://localhost:5001/add_test_data](http://localhost:5001/add_test_data)

### Models
- **Role**: Defines user roles
- **User**: Handles login and profiles
- **FoodListing**: Stores food listing details
- **Chat**: Messaging model

## API Documentation
### Authentication Endpoints
- `POST /api/signup`
- `POST /api/login`
- `GET /api/logout`
- `POST /api/reset_password_request`

### User Profile Endpoints
- `GET /api/user/profile`
- `PUT /api/user/profile`

### Food Listing Endpoints
- `GET /api/food_listings`
- `POST /api/food_listings`
- `GET /api/food_listings/<int:food_id>`
- `PUT /api/food_listings/<int:food_id>`
- `DELETE /api/food_listings/<int:food_id>`

### Chat Endpoints
- `GET /api/chat/<int:food_id>`
- `POST /api/chat/send`
- `GET /api/chat-list/<int:user_id>`
- `GET /api/chats/<int:user_id>`

## Connecting to Frontend
- React-based with the following components:
  - `AuthContext` for authentication
  - `apiService.js` for API communication
  - Key Pages: `LoginPage`, `SignupPage`, `MainPage`, `AddFoodItemPage`, `FoodDetailPage`, `ProfilePage`, `ChatPage`, `ChatListPage`

## Development Workflow
- Backend: `python app.py`
- Frontend: `npm start`
- Test Data: `/add_test_data`

## Kanban Board
#### ✅ Sprint 2
<img width="600" src="https://github.com/user-attachments/assets/76437e23-091e-461b-b1d4-4447a639e0d7" />

#### ✅ Sprint 3
<img width="600" src="https://github.com/user-attachments/assets/ea367490-b032-44fa-b365-9d11e53b4d93" />

#### ✅ Sprint 4
<img width="600" src="https://github.com/user-attachments/assets/dd3d42c7-3c3a-4708-83d5-e164f99e0eb4" />

#### ✅ Sprint 5
<img width="600" src="https://github.com/user-attachments/assets/86e2701c-aa41-4aac-9a1d-d16f4546117e" />

## Future Enhancements
### Phase 2: Book Sharing System
- Book listing with subject/level categorization
- Messaging and pickup scheduling

### Additional Features
- Furniture redistribution system
- Volunteer delivery coordination
- Donation system with Stripe/PayPal
- Analytics dashboard
- Mobile apps for iOS/Android
- Multi-language support

## Project Team - Group 6
- Atharva Negi
- Nayoung Choi
- Harry Jeon
- Bohan Wang
- Venkata Anirudh Pillala





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
Atharva Negi, Nayoung Choi, Harry Jeon, Bohan Wang, Venkata Anirudh Pillala
```

