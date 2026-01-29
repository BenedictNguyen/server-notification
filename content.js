// content.js - Chạy trên trang telerad.caresnova.ai
console.log('🔍 Telerad Notification Extension đã khởi động');

let lastCaseCount = 0;

// Hàm đếm số ca
function countCases() {
  // Tìm số ca trong bảng - TÙY CHỈNH SELECTOR NÀY
  const caseRows = document.querySelectorAll('table tbody tr');
  const caseCount = caseRows.length;
  
  // Hoặc nếu có text "No data available"
  const noData = document.querySelector('td:contains("No data available")');
  if (noData) {
    return 0;
  }
  
  return caseCount;
}

// Kiểm tra có ca mới không
function checkForNewCases() {
  const currentCount = countCases();
  
  console.log(`📊 Số ca hiện tại: ${currentCount}, Trước đó: ${lastCaseCount}`);
  
  if (lastCaseCount > 0 && currentCount > lastCaseCount) {
    const newCases = currentCount - lastCaseCount;
    console.log(`🆕 Phát hiện ${newCases} ca mới!`);
    
    // Gửi thông báo đến background script
    chrome.runtime.sendMessage({
      action: 'newCaseDetected',
      newCases: newCases,
      totalCases: currentCount
    });
  }
  
  lastCaseCount = currentCount;
}

// Khởi tạo
function init() {
  lastCaseCount = countCases();
  console.log(`🎯 Bắt đầu theo dõi. Số ca ban đầu: ${lastCaseCount}`);
  
  // Kiểm tra định kỳ
  chrome.storage.sync.get(['checkInterval'], function(result) {
    const interval = (result.checkInterval || 30) * 1000;
    
    setInterval(checkForNewCases, interval);
  });
  
  // Theo dõi thay đổi DOM
  const observer = new MutationObserver(function(mutations) {
    checkForNewCases();
  });
  
  const targetNode = document.querySelector('table tbody') || document.body;
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
}

// Chờ trang load xong
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}