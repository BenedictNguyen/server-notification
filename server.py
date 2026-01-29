# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)  # Allow requests from extension

# CẤU HÌNH
CONFIG = {
    'EMAIL_USER': 'nguyenducan1172003@gmail.com',
    'EMAIL_PASSWORD': 'ywig njav depy kagr',
    'SYSTEM_URL': 'https://telerad.caresnova.ai/work-list'
}

@app.route('/send-email', methods=['POST'])
def send_email():
    try:
        data = request.json
        doctor_email = data.get('doctor_email')
        is_test = data.get('is_test', False)
        
        if not doctor_email:
            return jsonify({'success': False, 'error': 'Missing doctor_email'}), 400
        
        # Tạo email
        message = MIMEMultipart()
        message['From'] = CONFIG['EMAIL_USER']
        message['To'] = doctor_email
        
        if is_test:
            message['Subject'] = '🧪 TEST - Thông báo Telerad'
            html = '''
            <div style="font-family: Arial; padding: 20px;">
                <h2>🧪 Email Test</h2>
                <p>Đây là email test từ Telerad Extension.</p>
                <p>Nếu nhận được email này, hệ thống đã hoạt động tốt!</p>
            </div>
            '''
        else:
            message['Subject'] = '🏥 Có ca cần đọc'
            html = f'''
            <div style="font-family: Arial; padding: 20px;">
                <h2>Có ca cần đọc</h2>
                <p>Vui lòng vào hệ thống để xem ca mới.</p>
                <p>
                    <a href="{CONFIG['SYSTEM_URL']}" 
                       style="background: #00897b; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Xem ca ngay
                    </a>
                </p>
            </div>
            '''
        
        message.attach(MIMEText(html, 'html'))
        
        # Gửi email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(CONFIG['EMAIL_USER'], CONFIG['EMAIL_PASSWORD'])
            server.send_message(message)
        
        print(f'✅ Sent email to: {doctor_email}')
        return jsonify({'success': True})
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)