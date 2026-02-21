from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_mail import Mail, Message
import csv
import io
import random
import string
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import config

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this-in-production'  # Change this!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
jwt = JWTManager(app)

# MySQL Configuration from config.py
app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = config.SQLALCHEMY_TRACK_MODIFICATIONS
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = config.SQLALCHEMY_ENGINE_OPTIONS

# Email Configuration (update in config.py with your Gmail credentials)
app.config['MAIL_SERVER'] = getattr(config, 'MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = getattr(config, 'MAIL_PORT', 587)
app.config['MAIL_USE_TLS'] = getattr(config, 'MAIL_USE_TLS', True)
app.config['MAIL_USERNAME'] = getattr(config, 'MAIL_USERNAME', None)
app.config['MAIL_PASSWORD'] = getattr(config, 'MAIL_PASSWORD', None)
app.config['MAIL_DEFAULT_SENDER'] = getattr(config, 'MAIL_USERNAME', 'noreply@aquatics.com')

db = SQLAlchemy(app)
mail = Mail(app)

class Swimmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.String(50), unique=True, nullable=False)  # Unique athlete ID
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # Full name (computed)
    date_of_birth = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    father_name = db.Column(db.String(100), nullable=True)
    father_mobile = db.Column(db.String(20), nullable=True)
    mother_name = db.Column(db.String(100), nullable=True)
    mother_mobile = db.Column(db.String(20), nullable=True)
    ksa_id = db.Column(db.String(50), nullable=True)
    sfi_id = db.Column(db.String(50), nullable=True)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    classification = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(50), nullable=True)
    club = db.Column(db.String(100), nullable=True)

class Meet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(100), nullable=True)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    distance = db.Column(db.Integer, nullable=False)
    stroke = db.Column(db.String(50), nullable=False)

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    swimmer_id = db.Column(db.Integer, db.ForeignKey('swimmer.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    meet_id = db.Column(db.Integer, db.ForeignKey('meet.id'), nullable=False)
    timing = db.Column(db.Float, nullable=False)
    rank = db.Column(db.Integer, nullable=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' or 'swimmer'
    swimmer_id = db.Column(db.Integer, db.ForeignKey('swimmer.id'), nullable=True)
    email_verified = db.Column(db.Boolean, default=False)

class PersonalBest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    swimmer_id = db.Column(db.Integer, db.ForeignKey('swimmer.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    best_time = db.Column(db.Float, nullable=False)
    meet_id = db.Column(db.Integer, db.ForeignKey('meet.id'), nullable=False)  # Where PB was set
    date = db.Column(db.String(20), nullable=False)
    season_year = db.Column(db.Integer, nullable=False)  # For season best tracking

class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    swimmer_id = db.Column(db.Integer, db.ForeignKey('swimmer.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    meet_id = db.Column(db.Integer, db.ForeignKey('meet.id'), nullable=False)
    entry_time = db.Column(db.Float, nullable=True)  # Seed time / Previous best time
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected', 'withdrawn'
    entry_date = db.Column(db.String(20), nullable=False)  # When they registered
    heat = db.Column(db.Integer, nullable=True)  # Assigned heat number
    lane = db.Column(db.Integer, nullable=True)  # Assigned lane number

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(20), nullable=False)  # 'reset' or 'verification'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_used = db.Column(db.Boolean, default=False)

@app.route('/swimmers', methods=['GET'])
@jwt_required()
def get_swimmers():
    swimmers = Swimmer.query.all()
    return jsonify([{
        'id': s.id,
        'athlete_id': s.athlete_id,
        'name': s.name,
        'age': s.age,
        'gender': s.gender,
        'classification': s.classification,
        'country': s.country,
        'club': s.club
    } for s in swimmers])

@app.route('/swimmers', methods=['POST'])
@jwt_required()
def add_swimmer():
    data = request.json
    # Auto-generate athlete_id if not provided
    if 'athlete_id' not in data:
        # Generate format: COUNTRY-YEAR-NUMBER (e.g., IND-2026-001)
        count = Swimmer.query.count() + 1
        data['athlete_id'] = f"ATH-2026-{count:04d}"
    
    swimmer = Swimmer(**data)
    db.session.add(swimmer)
    db.session.commit()
    return jsonify({'id': swimmer.id, 'athlete_id': swimmer.athlete_id}), 201

@app.route('/meets', methods=['POST'])
@jwt_required()
def add_meet():
    data = request.json
    meet = Meet(**data)
    db.session.add(meet)
    db.session.commit()
    return jsonify({'id': meet.id}), 201

@app.route('/meets', methods=['GET'])
@jwt_required()
def get_meets():
    meets = Meet.query.all()
    return jsonify([{'id': m.id, 'name': m.name, 'date': m.date, 'location': m.location} for m in meets])

@app.route('/events', methods=['POST'])
@jwt_required()
def add_event():
    data = request.json
    event = Event(**data)
    db.session.add(event)
    db.session.commit()
    return jsonify({'id': event.id}), 201

@app.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    events = Event.query.all()
    return jsonify([{'id': e.id, 'name': e.name, 'distance': e.distance, 'stroke': e.stroke} for e in events])

@app.route('/results', methods=['POST'])
@jwt_required()
def add_result():
    data = request.json
    result = Result(**data)
    db.session.add(result)
    db.session.commit()
    
    # Calculate rank based on timing for the same event and meet
    # First, rank by classification if available
    swimmer = Swimmer.query.get(result.swimmer_id)
    
    # Get all results for this event and meet
    all_results = Result.query.filter_by(event_id=result.event_id, meet_id=result.meet_id).all()
    
    # Group by classification and assign ranks
    classification_groups = {}
    for r in all_results:
        s = Swimmer.query.get(r.swimmer_id)
        classification = s.classification or 'Open'
        if classification not in classification_groups:
            classification_groups[classification] = []
        classification_groups[classification].append(r)
    
    # Assign ranks within each classification
    for classification, results_list in classification_groups.items():
        sorted_results = sorted(results_list, key=lambda x: x.timing)
        for idx, r in enumerate(sorted_results):
            r.rank = idx + 1
    
    db.session.commit()
    
    # Update Personal Best
    meet = Meet.query.get(result.meet_id)
    pb = PersonalBest.query.filter_by(swimmer_id=result.swimmer_id, event_id=result.event_id).first()
    
    if pb:
        if result.timing < pb.best_time:
            pb.best_time = result.timing
            pb.meet_id = result.meet_id
            pb.date = meet.date
            pb.season_year = int(meet.date.split('-')[0]) if meet.date else 2026
    else:
        pb = PersonalBest(
            swimmer_id=result.swimmer_id,
            event_id=result.event_id,
            best_time=result.timing,
            meet_id=result.meet_id,
            date=meet.date,
            season_year=int(meet.date.split('-')[0]) if meet.date else 2026
        )
        db.session.add(pb)
    
    db.session.commit()
    
    return jsonify({'id': result.id, 'is_pb': result.timing == pb.best_time}), 201

@app.route('/results', methods=['GET'])
@jwt_required()
def get_results():
    results = Result.query.all()
    return jsonify([{'id': r.id, 'swimmer_id': r.swimmer_id, 'event_id': r.event_id, 'meet_id': r.meet_id, 'timing': r.timing, 'rank': r.rank} for r in results])

@app.route('/personal-bests/<int:swimmer_id>', methods=['GET'])
@jwt_required()
def get_personal_bests(swimmer_id):
    pbs = PersonalBest.query.filter_by(swimmer_id=swimmer_id).all()
    return jsonify([{
        'id': pb.id,
        'event_id': pb.event_id,
        'best_time': pb.best_time,
        'meet_id': pb.meet_id,
        'date': pb.date,
        'season_year': pb.season_year
    } for pb in pbs])

@app.route('/performance-history/<int:swimmer_id>/<int:event_id>', methods=['GET'])
@jwt_required()
def get_performance_history(swimmer_id, event_id):
    results = Result.query.filter_by(swimmer_id=swimmer_id, event_id=event_id).all()
    history = []
    for r in results:
        meet = Meet.query.get(r.meet_id)
        history.append({
            'timing': r.timing,
            'rank': r.rank,
            'meet_name': meet.name,
            'meet_date': meet.date
        })
    return jsonify(sorted(history, key=lambda x: x['meet_date']))

@app.route('/rankings/<int:event_id>', methods=['GET'])
@jwt_required()
def get_rankings(event_id):
    # Get best time for each swimmer in this event
    swimmers = Swimmer.query.all()
    rankings = []
    
    for swimmer in swimmers:
        pb = PersonalBest.query.filter_by(swimmer_id=swimmer.id, event_id=event_id).first()
        if pb:
            rankings.append({
                'athlete_id': swimmer.athlete_id,
                'name': swimmer.name,
                'classification': swimmer.classification,
                'best_time': pb.best_time,
                'country': swimmer.country,
                'club': swimmer.club
            })
    
    # Sort by classification and then by time
    rankings_by_class = {}
    for r in rankings:
        classification = r['classification'] or 'Open'
        if classification not in rankings_by_class:
            rankings_by_class[classification] = []
        rankings_by_class[classification].append(r)
    
    # Assign ranks within each classification
    result = {}
    for classification, class_rankings in rankings_by_class.items():
        sorted_rankings = sorted(class_rankings, key=lambda x: x['best_time'])
        for idx, r in enumerate(sorted_rankings):
            r['rank'] = idx + 1
        result[classification] = sorted_rankings
    
    return jsonify(result)

# Entry Management Endpoints
@app.route('/entries', methods=['POST'])
@jwt_required()
def add_entry():
    """Swimmer registers for an event"""
    data = request.json
    from datetime import datetime
    
    # Check if already entered
    existing = Entry.query.filter_by(
        swimmer_id=data['swimmer_id'],
        event_id=data['event_id'],
        meet_id=data['meet_id']
    ).first()
    
    if existing:
        return jsonify({'error': 'Already registered for this event'}), 400
    
    entry = Entry(
        swimmer_id=data['swimmer_id'],
        event_id=data['event_id'],
        meet_id=data['meet_id'],
        entry_time=data.get('entry_time'),
        status='pending',
        entry_date=datetime.now().strftime('%Y-%m-%d')
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'id': entry.id, 'status': entry.status}), 201

@app.route('/entries', methods=['GET'])
@jwt_required()
def get_entries():
    """Get all entries (admin view)"""
    meet_id = request.args.get('meet_id')
    swimmer_id = request.args.get('swimmer_id')
    
    query = Entry.query
    if meet_id:
        query = query.filter_by(meet_id=int(meet_id))
    if swimmer_id:
        query = query.filter_by(swimmer_id=int(swimmer_id))
    
    entries = query.all()
    result = []
    for e in entries:
        swimmer = Swimmer.query.get(e.swimmer_id)
        event = Event.query.get(e.event_id)
        meet = Meet.query.get(e.meet_id)
        result.append({
            'id': e.id,
            'swimmer_id': e.swimmer_id,
            'swimmer_name': swimmer.name if swimmer else 'Unknown',
            'athlete_id': swimmer.athlete_id if swimmer else '',
            'event_id': e.event_id,
            'event_name': event.name if event else 'Unknown',
            'meet_id': e.meet_id,
            'meet_name': meet.name if meet else 'Unknown',
            'entry_time': e.entry_time,
            'status': e.status,
            'entry_date': e.entry_date,
            'heat': e.heat,
            'lane': e.lane
        })
    return jsonify(result)

@app.route('/entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    """Update entry status (admin approves/rejects)"""
    entry = Entry.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    data = request.json
    if 'status' in data:
        entry.status = data['status']
    if 'heat' in data:
        entry.heat = data['heat']
    if 'lane' in data:
        entry.lane = data['lane']
    
    db.session.commit()
    return jsonify({'id': entry.id, 'status': entry.status}), 200

@app.route('/entries/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    """Withdraw entry"""
    entry = Entry.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry withdrawn'}), 200

@app.route('/register', methods=['POST'])
@jwt_required()
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(
        username=data['username'],
        password_hash=generate_password_hash(data['password']),
        role=data['role'],
        swimmer_id=data.get('swimmer_id')
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'id': user.id, 'username': user.username, 'role': user.role}), 201

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    
    # Check if email already exists
    if Swimmer.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['email']).first():
        return jsonify({'error': 'Username already exists'}), 400

    # Check duplicate by First Name + Last Name + Date of Birth
    existing = Swimmer.query.filter_by(
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        date_of_birth=data['date_of_birth']
    ).first()
    if existing:
        return jsonify({
            'error': f'A swimmer with this name and date of birth is already registered. '
                     f'Name: {existing.first_name} {existing.last_name}, Email: {existing.email}',
            'redirect_email': existing.email
        }), 400
    
    # Auto-generate athlete_id
    count = Swimmer.query.count() + 1
    athlete_id = f"ATH-2026-{count:04d}"
    
    # Calculate age from date of birth
    try:
        dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d')
        today = datetime.now()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except:
        age = 0
    
    # Create swimmer record
    full_name = f"{data['first_name']} {data['last_name']}"
    swimmer = Swimmer(
        athlete_id=athlete_id,
        first_name=data['first_name'],
        last_name=data['last_name'],
        name=full_name,
        date_of_birth=data['date_of_birth'],
        email=data['email'],
        father_name=data.get('father_name'),
        father_mobile=data.get('father_mobile'),
        mother_name=data.get('mother_name'),
        mother_mobile=data.get('mother_mobile'),
        ksa_id=data.get('ksa_id'),
        sfi_id=data.get('sfi_id'),
        age=age,
        gender=data.get('gender', 'Not specified'),
        classification=data.get('classification'),
        country=data.get('country'),
        club=data.get('club')
    )
    db.session.add(swimmer)
    db.session.flush()  # Get swimmer.id before committing
    
    # Create user account (username is email, password is default, email not verified yet)
    user = User(
        username=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='swimmer',
        swimmer_id=swimmer.id,
        email_verified=False
    )
    db.session.add(user)
    db.session.commit()
    
    # Generate a 6-digit OTP for email verification
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Invalidate any previous unused OTPs for this email
    OTP.query.filter_by(email=data['email'], purpose='verification', is_used=False).delete()
    
    # Save new OTP
    otp = OTP(
        email=data['email'],
        code=otp_code,
        purpose='verification',
        created_at=datetime.utcnow(),
        is_used=False
    )
    db.session.add(otp)
    db.session.commit()
    
    # Try to send email; fall back to console log if mail not configured
    try:
        if app.config.get('MAIL_USERNAME'):
            msg = Message(
                subject='Aquatics — Email Verification',
                recipients=[data['email']],
                html=f"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
                            background:#f0f4ff;border-radius:12px;">
                  <h2 style="color:#001f4d;">🏊 Welcome to Aquatics!</h2>
                  <p style="color:#444;">Thank you for registering. Please verify your email using the OTP below.
                     It expires in <strong>10 minutes</strong>.</p>
                  <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;
                              text-align:center;padding:24px;background:#fff;
                              border-radius:10px;color:#003580;margin:20px 0;">
                    {otp_code}
                  </div>
                  <p style="color:#888;font-size:0.88rem;">
                    Your Athlete ID: <strong>{athlete_id}</strong>
                  </p>
                </div>
                """
            )
            mail.send(msg)
            print(f'[INFO] Verification OTP sent to {data["email"]}')
        else:
            # Mail not configured — print to console for development
            print(f'[DEV] Verification OTP for {data["email"]}: {otp_code}')
    except Exception as e:
        print(f'[ERROR] Failed to send email: {e}')
        print(f'[DEV] Verification OTP for {data["email"]}: {otp_code}')
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'swimmer_id': swimmer.id,
        'athlete_id': athlete_id,
        'message': 'Account created! Please verify your email with the OTP sent to your email address.'
    }), 201

@app.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.json
    email = data.get('email', '').strip()
    otp_code = data.get('otp', '').strip()

    if not email or not otp_code:
        return jsonify({'error': 'Email and OTP are required.'}), 400

    # Find the OTP record
    otp = OTP.query.filter_by(
        email=email, code=otp_code, purpose='verification', is_used=False
    ).order_by(OTP.created_at.desc()).first()

    if not otp:
        return jsonify({'error': 'Invalid or expired OTP.'}), 400

    # Check expiry (10 minutes)
    age = (datetime.utcnow() - otp.created_at).total_seconds()
    if age > 600:
        return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

    # Find the user and mark email as verified
    user = User.query.filter_by(username=email).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.email_verified = True
    otp.is_used = True
    db.session.commit()

    return jsonify({'message': 'Email verified successfully! You can now log in.'}), 200

@app.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.json
    email = data.get('email', '').strip()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    # Find user by email
    user = User.query.filter_by(username=email).first()
    if not user:
        # Return success to prevent email enumeration
        return jsonify({'message': 'If that email is registered, a verification OTP will be sent.'}), 200

    # Check if already verified
    if user.email_verified:
        return jsonify({'error': 'Email is already verified. Please login.'}), 400

    # Generate a 6-digit OTP for email verification
    otp_code = ''.join(random.choices(string.digits, k=6))

    # Invalidate any previous unused OTPs for this email
    OTP.query.filter_by(email=email, purpose='verification', is_used=False).delete()

    # Save new OTP
    otp = OTP(
        email=email,
        code=otp_code,
        purpose='verification',
        created_at=datetime.utcnow(),
        is_used=False
    )
    db.session.add(otp)
    db.session.commit()

    # Get swimmer details for athlete ID
    swimmer = Swimmer.query.filter_by(email=email).first()
    athlete_id = swimmer.athlete_id if swimmer else 'N/A'

    # Try to send email; fall back to console log if mail not configured
    try:
        if app.config.get('MAIL_USERNAME'):
            msg = Message(
                subject='Aquatics — Email Verification',
                recipients=[email],
                html=f"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
                            background:#f0f4ff;border-radius:12px;">
                  <h2 style="color:#001f4d;">🏊 Welcome to Aquatics!</h2>
                  <p style="color:#444;">Please verify your email using the OTP below.
                     It expires in <strong>10 minutes</strong>.</p>
                  <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;
                              text-align:center;padding:24px;background:#fff;
                              border-radius:10px;color:#003580;margin:20px 0;">
                    {otp_code}
                  </div>
                  <p style="color:#888;font-size:0.88rem;">
                    Your Athlete ID: <strong>{athlete_id}</strong>
                  </p>
                </div>
                """
            )
            mail.send(msg)
            print(f'[INFO] Verification OTP resent to {email}')
        else:
            # Mail not configured — print to console for development
            print(f'[DEV] Verification OTP for {email}: {otp_code}')
    except Exception as e:
        print(f'[ERROR] Failed to send email: {e}')
        print(f'[DEV] Verification OTP for {email}: {otp_code}')

    return jsonify({'message': 'Verification OTP sent to your email address.'}), 200

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email', '').strip().lower()

    # Find user by email (swimmers use email as username)
    user = User.query.filter_by(username=email).first()
    # Also allow admin to use their username
    if not user:
        user = User.query.filter_by(username=data.get('email', '').strip()).first()

    if not user:
        # Return success anyway to prevent email enumeration
        return jsonify({'message': 'If that email is registered, you will receive an OTP.'}), 200

    # Generate a 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))

    # Invalidate any previous unused OTPs for this email
    OTP.query.filter_by(email=user.username, purpose='reset', is_used=False).delete()

    # Save new OTP
    otp = OTP(
        email=user.username,
        code=otp_code,
        purpose='reset',
        created_at=datetime.utcnow(),
        is_used=False
    )
    db.session.add(otp)
    db.session.commit()

    # Try to send email; fall back to console log if mail not configured
    try:
        if app.config.get('MAIL_USERNAME'):
            msg = Message(
                subject='Aquatics — Password Reset OTP',
                recipients=[user.username],
                html=f"""
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
                            background:#f0f4ff;border-radius:12px;">
                  <h2 style="color:#001f4d;">🏊 Aquatics Password Reset</h2>
                  <p style="color:#444;">Use the OTP below to reset your password.
                     It expires in <strong>10 minutes</strong>.</p>
                  <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;
                              text-align:center;padding:24px;background:#fff;
                              border-radius:10px;color:#003580;margin:20px 0;">
                    {otp_code}
                  </div>
                  <p style="color:#888;font-size:0.88rem;">
                    If you did not request this, ignore this email.
                  </p>
                </div>
                """
            )
            mail.send(msg)
            print(f'[INFO] Password reset OTP sent to {user.username}')
        else:
            # Mail not configured — print to console for development
            print(f'[DEV] Password reset OTP for {user.username}: {otp_code}')
    except Exception as e:
        print(f'[ERROR] Failed to send email: {e}')
        print(f'[DEV] Password reset OTP for {user.username}: {otp_code}')

    return jsonify({'message': 'If that email is registered, you will receive an OTP.'}), 200


@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email', '').strip()
    otp_code = data.get('otp', '').strip()
    new_password = data.get('new_password', '')

    if not email or not otp_code or not new_password:
        return jsonify({'error': 'Email, OTP, and new password are required.'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    # Find the OTP record
    otp = OTP.query.filter_by(
        email=email, code=otp_code, purpose='reset', is_used=False
    ).order_by(OTP.created_at.desc()).first()

    if not otp:
        return jsonify({'error': 'Invalid or expired OTP.'}), 400

    # Check expiry (10 minutes)
    age = (datetime.utcnow() - otp.created_at).total_seconds()
    if age > 600:
        return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

    # Find the user and update password
    user = User.query.filter_by(username=email).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.password_hash = generate_password_hash(new_password)
    otp.is_used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        # Check if email is verified (skip for admin)
        if user.role != 'admin' and not user.email_verified:
            return jsonify({'error': 'Please verify your email before logging in. Check your inbox for the verification OTP.'}), 403
        
        # Create JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'swimmer_id': user.swimmer_id
        }), 200
    
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': new_access_token}), 200

@app.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user:
        return jsonify({
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'swimmer_id': user.swimmer_id
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/upload-results', methods=['POST'])
def upload_results():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Read CSV file
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_reader = csv.DictReader(stream)
    
    results_added = 0
    for row in csv_reader:
        # Assuming CSV has columns: swimmer_name, event_name, meet_name, timing
        swimmer = Swimmer.query.filter_by(name=row.get('swimmer_name')).first()
        event = Event.query.filter_by(name=row.get('event_name')).first()
        meet = Meet.query.filter_by(name=row.get('meet_name')).first()
        
        if swimmer and event and meet:
            result = Result(
                swimmer_id=swimmer.id,
                event_id=event.id,
                meet_id=meet.id,
                timing=float(row.get('timing', 0))
            )
            db.session.add(result)
            results_added += 1
    
    db.session.commit()
    
    # Recalculate all ranks
    all_results = Result.query.all()
    event_meet_groups = {}
    for r in all_results:
        key = f"{r.event_id}_{r.meet_id}"
        if key not in event_meet_groups:
            event_meet_groups[key] = []
        event_meet_groups[key].append(r)
    
    for group in event_meet_groups.values():
        sorted_results = sorted(group, key=lambda x: x.timing)
        for idx, r in enumerate(sorted_results):
            r.rank = idx + 1
    
    db.session.commit()
    
    return jsonify({'message': f'{results_added} results added successfully'}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Create default admin user if not exists
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                email_verified=True
            )
            db.session.add(admin)
            db.session.commit()
            print('Default admin user created: username=admin, password=admin123')
    app.run(debug=True)
