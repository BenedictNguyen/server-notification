// background.js
console.log('🚀 Telerad Notification Background Service started');

// API endpoint (sử dụng server Python bạn đã tạo)
const API_ENDPOINT = 'https://telerad-notification-api.onrender.com/send-email';

// Lắng nghe tin nhắn từ content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  
  if (request.action === 'newCaseDetected') {
    console.log('📬 Nhận được thông báo ca mới:', request);
    
    // Lấy email từ storage
    chrome.storage.sync.get(['doctorEmail'], function(result) {
      if (result.doctorEmail) {
        sendEmailNotification(result.doctorEmail, request.newCases);
      } else {
        console.warn('⚠️ Chưa cấu hình email!');
        showNotification('Chưa cấu hình email', 'Vui lòng mở extension và cài đặt email nhận thông báo');
      }
    });
  }
  
  if (request.action === 'sendTestEmail') {
    sendEmailNotification(request.email, 0, true).then(result => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'restartAlarm') {
    console.log('⏰ Restart alarm với interval:', request.interval);
    // Setup alarm if needed
  }
});

// Hàm gửi email
async function sendEmailNotification(doctorEmail, newCases = 1, isTest = false) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        doctor_email: doctorEmail,
        is_test: isTest
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Email đã được gửi!');
      
      if (!isTest) {
        showNotification(
          '📧 Có ca mới!',
          `Có ${newCases} ca mới cần đọc. Email đã được gửi đến ${doctorEmail}`
        );
      }
      
      return { success: true };
    } else {
      console.error('❌ Lỗi gửi email:', data.error);
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.error('❌ Lỗi kết nối:', error);
    return { success: false, error: error.message };
  }
}

// Hiển thị notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: title,
    message: message,
    priority: 2
  });
}