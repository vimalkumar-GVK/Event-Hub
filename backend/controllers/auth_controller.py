from flask import request, jsonify
from services.auth_service import authenticate_user, register_new_user, get_user_profile
from middleware.auth import require_auth

def login_user():
    data = request.get_json() if request.is_json else request.form
    username = data.get("username") or data.get("email")
    password = data.get("password")
    
    result, status_code = authenticate_user(username, password)
    
    if status_code == 200:
        token = result.get("access_token")
        
        from flask import make_response
        import datetime
        response = make_response(jsonify(result))
        response.set_cookie(
            'jwt_token', 
            token, 
            httponly=True, 
            samesite='Lax',
            max_age=datetime.timedelta(days=1)
        )
        return response, status_code
        
    return jsonify(result), status_code

def register_user():
    data = request.json
    result, status_code = register_new_user(data)
    return jsonify(result), status_code

@require_auth
def get_current_user():
    user = dict(request.user)
    result, status_code = get_user_profile(user)
    return jsonify(result), status_code

def forgot_password():
    data = request.get_json() if request.is_json else request.form
    phone_number = data.get("phone_number")
    from services.auth_service import srv_forgot_password
    result, status_code = srv_forgot_password(phone_number)
    return jsonify(result), status_code

def verify_otp():
    data = request.get_json() if request.is_json else request.form
    phone_number = data.get("phone_number")
    otp = data.get("otp")
    from services.auth_service import srv_verify_otp
    result, status_code = srv_verify_otp(phone_number, otp)
    return jsonify(result), status_code

def reset_password():
    data = request.get_json() if request.is_json else request.form
    phone_number = data.get("phone_number")
    otp = data.get("otp")
    new_password = data.get("new_password")
    from services.auth_service import srv_reset_password
    result, status_code = srv_reset_password(phone_number, otp, new_password)
    return jsonify(result), status_code
