import os
from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from dotenv import load_dotenv
from twilio.rest import Client
import datetime
from functools import wraps
import jwt
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configure MySQL
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'swagatham_foundation')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

mysql = MySQL(app)

# Initialize Twilio client
twilio_client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

# OTP Storage (in-memory for simplicity)
otp_store = {}

# Helper Functions
def generate_otp():
    return str(int(datetime.datetime.now().timestamp() % 1000000)).zfill(6)

def generate_token(phone):
    return jwt.encode({'phone': phone, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)}, 
                     app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['phone']
        except:
            return jsonify({'success': False, 'error': 'Token is invalid'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# API Endpoints
@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json()
        phone_number = data.get('phoneNumber')
        
        if not phone_number or not phone_number.isdigit() or len(phone_number) != 10:
            return jsonify({
                'success': False,
                'error': 'Invalid Indian phone number (10 digits)'
            }), 400
        
        # Generate and store OTP (expires in 5 minutes)
        otp = generate_otp()
        otp_store[phone_number] = {
            'otp': otp,
            'expires_at': datetime.datetime.now() + datetime.timedelta(minutes=5)
        }
        
        # Send OTP via Twilio
        message = twilio_client.messages.create(
            body=f'Your OTP for Swagatham Foundation is: {otp}',
            from_=os.getenv('TWILIO_PHONE_NUMBER'),
            to=f'+91{phone_number}'
        )
        
        return jsonify({
            'success': True,
            'message': 'OTP sent successfully'
        })
        
    except Exception as e:
        print(f"Error sending OTP: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to send OTP. Please try again.'
        }), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        phone_number = data.get('phoneNumber')
        otp = data.get('otp')
        
        if not phone_number or not otp:
            return jsonify({
                'success': False,
                'error': 'Phone number and OTP are required'
            }), 400
        
        # Check if OTP exists
        stored_otp = otp_store.get(phone_number)
        if not stored_otp:
            return jsonify({
                'success': False,
                'error': 'OTP expired or not requested'
            }), 400
        
        # Check expiration
        if datetime.datetime.now() > stored_otp['expires_at']:
            del otp_store[phone_number]
            return jsonify({
                'success': False,
                'error': 'OTP expired'
            }), 400
        
        # Verify OTP
        if stored_otp['otp'] == otp:
            del otp_store[phone_number]
            
            cur = mysql.connection.cursor()
            
            # Check if user exists and get profile status
            cur.execute("""
                SELECT id, COALESCE(profile_complete, FALSE) as profile_complete 
                FROM users 
                WHERE phone = %s
            """, (phone_number,))
            user = cur.fetchone()
            
            if not user:
                # Create new user if doesn't exist
                cur.execute("""
                    INSERT INTO users (phone, profile_complete) 
                    VALUES (%s, FALSE)
                """, (phone_number,))
                mysql.connection.commit()
                profile_complete = False
            else:
                profile_complete = bool(user['profile_complete'])
            
            # Generate JWT token
            token = generate_token(phone_number)
            
            return jsonify({
                'success': True,
                'message': 'OTP verified successfully',
                'token': token,
                'profileComplete': profile_complete
            })
        
        return jsonify({
            'success': False,
            'error': 'Invalid OTP'
        }), 400
        
    except Exception as e:
        print(f"Error verifying OTP: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        cur = mysql.connection.cursor()
        
        # Get user details
        cur.execute("""
            SELECT id, phone, name, email, dob, gender, address, profile_complete 
            FROM users WHERE phone = %s
        """, (current_user,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get family members
        cur.execute("""
            SELECT name, relation, gender, dob 
            FROM family_members 
            WHERE user_id = %s
        """, (user['id'],))
        family_members = cur.fetchall()
        
        # Get donation history
        cur.execute("""
            SELECT amount, payment_id, donation_type as type, 
                   tax_exemption, donation_date as date
            FROM donations 
            WHERE user_id = %s
            ORDER BY donation_date DESC
        """, (user['id'],))
        donations = cur.fetchall()
        
        return jsonify({
            'success': True,
            'user': {
                'name': user['name'],
                'email': user['email'],
                'phone': user['phone'],
                'dob': str(user['dob']) if user['dob'] else None,
                'gender': user['gender'],
                'address': user['address'],
                'familyMembers': family_members,
                'donations': donations,
                'profileComplete': user['profile_complete']
            }
        })
        
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error retrieving profile'
        }), 500

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'dob', 'gender', 'address', 'familyMembers']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        if not isinstance(data['familyMembers'], list) or len(data['familyMembers']) == 0:
            return jsonify({
                'success': False,
                'error': 'At least one family member is required'
            }), 400
        
        cur = mysql.connection.cursor()
        
        # Get user ID
        cur.execute("SELECT id FROM users WHERE phone = %s", (current_user,))
        user = cur.fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Update user details
        cur.execute("""
            UPDATE users 
            SET name = %s, email = %s, dob = %s, gender = %s, 
                address = %s, profile_complete = TRUE 
            WHERE id = %s
        """, (
            data['name'],
            data['email'],
            data['dob'],
            data['gender'],
            data['address'],
            user_id
        ))
        
        # Delete existing family members
        cur.execute("DELETE FROM family_members WHERE user_id = %s", (user_id,))
        
        # Add new family members
        for member in data['familyMembers']:
            cur.execute("""
                INSERT INTO family_members 
                (user_id, name, relation, gender, dob) 
                VALUES (%s, %s, %s, %s, %s)
            """, (
                user_id,
                member['name'],
                member['relation'],
                member.get('gender'),
                member.get('dob')
            ))
        
        mysql.connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        mysql.connection.rollback()
        print(f"Error updating profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error updating profile'
        }), 500

@app.route('/api/donate', methods=['POST'])
@token_required
def record_donation(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['amount', 'paymentId', 'donationType', 'taxExemption']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        cur = mysql.connection.cursor()
        
        # Get user ID
        cur.execute("SELECT id FROM users WHERE phone = %s", (current_user,))
        user = cur.fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user_id = user['id']
        
        # Record donation
        cur.execute("""
            INSERT INTO donations 
            (user_id, amount, payment_id, donation_type, tax_exemption) 
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            data['amount'],
            data['paymentId'],
            data['donationType'],
            data['taxExemption']
        ))
        
        mysql.connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Donation recorded successfully'
        })
        
    except Exception as e:
        mysql.connection.rollback()
        print(f"Error recording donation: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error recording donation'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)