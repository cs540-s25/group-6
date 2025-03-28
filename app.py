# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Mail, Message
import re
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your_default_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resource_sharing.db'
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'your_email@gmail.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'your_app_password')

db = SQLAlchemy(app)
mail = Mail(app)
s = URLSafeTimedSerializer(app.secret_key)

# User and Role models (simplified from resource_db_setup.py)
class Role(db.Model):
    __tablename__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    users = db.relationship('User', back_populates='role')

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, nullable=False, unique=True)
    password_hash = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    major = db.Column(db.String)
    phone_number = db.Column(db.String)
    is_active = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    role = db.relationship("Role", back_populates="users")

@app.route('/')
def entry():
    return render_template('entry.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        data = request.form
        email = data['email']
        if not email.endswith('@emory.edu'):
            flash('Only @emory.edu emails are allowed.')
            return redirect(url_for('signup'))

        if User.query.filter_by(email=email).first():
            flash('Email already registered.')
            return redirect(url_for('signup'))

        hashed_pw = generate_password_hash(data['password'])
        token = s.dumps(email, salt='email-confirm')
        role = Role.query.filter_by(name=data['role']).first()

        user = User(
            email=email,
            password_hash=hashed_pw,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data.get('phone_number'),
            major=data.get('major'),
            verification_token=token,
            role=role
        )
        db.session.add(user)
        db.session.commit()

        confirm_url = url_for('verify_email', token=token, _external=True)
        msg = Message('Verify your email', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f'Click the link to verify your email: {confirm_url}'
        mail.send(msg)

        flash('Verification email sent.')
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/verify/<token>')
def verify_email(token):
    try:
        email = s.loads(token, salt='email-confirm', max_age=3600)
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_active = True
            user.verification_token = None
            db.session.commit()
            flash('Email verified. You can now log in.')
    except Exception as e:
        flash('Verification link expired or invalid.')
    return redirect(url_for('login'))

@app.route('/resend_verification', methods=['GET', 'POST'])
def resend_verification():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user and not user.is_active:
            token = s.dumps(email, salt='email-confirm')
            user.verification_token = token
            db.session.commit()
            confirm_url = url_for('verify_email', token=token, _external=True)
            msg = Message('Verify your email', sender=app.config['MAIL_USERNAME'], recipients=[email])
            msg.body = f'Click the link to verify your email: {confirm_url}'
            mail.send(msg)
            flash('A new verification email has been sent.')
        else:
            flash('Invalid email or account already verified.')
    return render_template('resend_verification.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and user.is_active and check_password_hash(user.password_hash, password):
            session['user_id'] = user.user_id
            flash('Logged in successfully.')
            return redirect(url_for('entry'))
        flash('Invalid credentials or email not verified.')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.')
    return redirect(url_for('login'))

@app.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            token = s.dumps(email, salt='password-reset')
            reset_url = url_for('reset_password', token=token, _external=True)
            msg = Message('Reset Your Password', sender=app.config['MAIL_USERNAME'], recipients=[email])
            msg.body = f'Click the link to reset your password: {reset_url}'
            mail.send(msg)
            flash('A password reset email has been sent.')
        else:
            flash('Email not found.')
    return render_template('reset_password_request.html')

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = s.loads(token, salt='password-reset', max_age=3600)
    except Exception as e:
        flash('The password reset link is invalid or has expired.')
        return redirect(url_for('reset_password_request'))
    if request.method == 'POST':
        new_password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user:
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            flash('Your password has been reset. You can now log in.')
            return redirect(url_for('login'))
    return render_template('reset_password.html')

def setup_roles():
    # Seed roles if not present
    roles = ['undergrad', 'master', 'phd', 'employee', 'professor']
    for r in roles:
        if not Role.query.filter_by(name=r).first():
            db.session.add(Role(name=r))
    db.session.commit()

if __name__ == '__main__':

    with app.app_context():
        db.create_all()
        setup_roles()
    app.run(debug=True)
