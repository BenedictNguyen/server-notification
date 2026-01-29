// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const doctorEmailInput = document.getElementById('doctorEmail');
  const checkIntervalInput = document.getElementById('checkInterval');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['doctorEmail', 'checkInterval'], function(result) {
    if (result.doctorEmail) {
      doctorEmailInput.value = result.doctorEmail;
    }
    if (result.checkInterval) {
      checkIntervalInput.value = result.checkInterval;
    }
  });

  // Save settings
  saveBtn.addEventListener('click', function() {
    const email = doctorEmailInput.value.trim();
    const interval = parseInt(checkIntervalInput.value);

    if (!email || !email.includes('@')) {
      showStatus('Vui lòng nhập email hợp lệ!', 'error');
      return;
    }

    if (interval < 10 || interval > 300) {
      showStatus('Khoảng thời gian phải từ 10-300 giây!', 'error');
      return;
    }

    chrome.storage.sync.set({
      doctorEmail: email,
      checkInterval: interval
    }, function() {
      showStatus('✅ Đã lưu cài đặt!', 'success');
      
      // Restart alarm
      chrome.runtime.sendMessage({
        action: 'restartAlarm',
        interval: interval
      });
    });
  });

  // Test email
  testBtn.addEventListener('click', function() {
    const email = doctorEmailInput.value.trim();
    
    if (!email || !email.includes('@')) {
      showStatus('Vui lòng nhập email hợp lệ!', 'error');
      return;
    }

    showStatus('Đang gửi email test...', 'success');
    
    chrome.runtime.sendMessage({
      action: 'sendTestEmail',
      email: email
    }, function(response) {
      if (response && response.success) {
        showStatus('✅ Đã gửi email test! Kiểm tra inbox.', 'success');
      } else {
        showStatus('❌ Lỗi: ' + (response ? response.error : 'Unknown'), 'error');
      }
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
});