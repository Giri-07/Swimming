from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import csv
import io
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///swimming.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Swimmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.String(50), unique=True, nullable=False)  # Unique athlete ID
    name = db.Column(db.String(100), nullable=False)
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

class PersonalBest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    swimmer_id = db.Column(db.Integer, db.ForeignKey('swimmer.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    best_time = db.Column(db.Float, nullable=False)
    meet_id = db.Column(db.Integer, db.ForeignKey('meet.id'), nullable=False)  # Where PB was set
    date = db.Column(db.String(20), nullable=False)
    season_year = db.Column(db.Integer, nullable=False)  # For season best tracking

@app.route('/swimmers', methods=['POST'])
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

@app.route('/swimmers', methods=['GET'])
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

@app.route('/meets', methods=['POST'])
def add_meet():
    data = request.json
    meet = Meet(**data)
    db.session.add(meet)
    db.session.commit()
    return jsonify({'id': meet.id}), 201

@app.route('/meets', methods=['GET'])
def get_meets():
    meets = Meet.query.all()
    return jsonify([{'id': m.id, 'name': m.name, 'date': m.date, 'location': m.location} for m in meets])

@app.route('/events', methods=['POST'])
def add_event():
    data = request.json
    event = Event(**data)
    db.session.add(event)
    db.session.commit()
    return jsonify({'id': event.id}), 201

@app.route('/events', methods=['GET'])
def get_events():
    events = Event.query.all()
    return jsonify([{'id': e.id, 'name': e.name, 'distance': e.distance, 'stroke': e.stroke} for e in events])

@app.route('/results', methods=['POST'])
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
def get_results():
    results = Result.query.all()
    return jsonify([{'id': r.id, 'swimmer_id': r.swimmer_id, 'event_id': r.event_id, 'meet_id': r.meet_id, 'timing': r.timing, 'rank': r.rank} for r in results])

@app.route('/personal-bests/<int:swimmer_id>', methods=['GET'])
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

@app.route('/register', methods=['POST'])
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

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        return jsonify({
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'swimmer_id': user.swimmer_id
        }), 200
    
    return jsonify({'error': 'Invalid username or password'}), 401

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
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print('Default admin user created: username=admin, password=admin123')
    app.run(debug=True)
