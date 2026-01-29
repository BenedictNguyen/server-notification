// background.js
console.log('🚀 Telerad Notification Background Service started');

// API endpoint (sử dụng server Python bạn đã tạo)
const API_ENDPOINT = 'https://server-notification-7dfu.onrender.com';

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
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'restartAlarm') {
    console.log('⏰ Restart alarm với interval:', request.interval);
    // Setup alarm if needed
  }
});

// Hàm gửi email với retry logic
async function sendEmailNotification(doctorEmail, newCases = 1, isTest = false, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    console.log(`🔄 Đang gửi request đến ${API_ENDPOINT}...`);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        doctor_email: doctorEmail,
        is_test: isTest
      }),
      mode: 'cors'
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
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
    console.error(`❌ Lỗi kết nối (lần ${retryCount + 1}):`, error);
    
    // Retry nếu là lỗi network và chưa hết retry
    if (retryCount < MAX_RETRIES && error.message.includes('Failed to fetch')) {
      console.log(`🔄 Thử lại sau 2 giây... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendEmailNotification(doctorEmail, newCases, isTest, retryCount + 1);
    }
    
    // Hiển thị thông báo lỗi nếu hết retry
    if (isTest) {
      let errorMessage = 'Không thể kết nối server';
      if (error.message.includes('CORS')) {
        errorMessage = 'Lỗi CORS - Server có thể đang khởi động';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Server đang sleep - Vui lòng thử lại sau 30 giây';
      }
      
      showNotification('❌ Lỗi gửi email', errorMessage);
    }
    
    return { success: false, error: error.message };
  }
}

// Hiển thị notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    title: title,
    message: message,
    priority: 2
  });
}