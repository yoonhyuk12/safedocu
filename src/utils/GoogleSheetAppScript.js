const SPREADSHEET_ID = "1gD3NdW58zUMQaGIofGHq3EZShFHsk09WDdrx5scOwOY";
const SHEET_NAME = "점검결과";

/**
 * GET 요청을 처리합니다.
 */
function doGet(e) {
  return HtmlService.createHtmlOutput('안전서류 점검시스템이 정상 작동 중입니다.')
    .setTitle('안전서류 점검시스템');
}

/**
 * POST 요청을 처리합니다.
 */
function doPost(e) {
  try {
    Logger.log("요청 수신됨");
    
    // 모든 파라미터 로깅
    Logger.log("받은 파라미터:");
    for (var key in e.parameter) {
      Logger.log(key + ": " + e.parameter[key]);
    }
    
    // 스프레드시트와 시트 가져오기
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error("시트를 찾을 수 없습니다: " + SHEET_NAME);
    }
    
    // 헤더 가져오기
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("헤더: " + headers.join(", "));
    
    // 현재 시간
    const timestamp = new Date();
    
    // 날짜와 시간을 포맷팅 (한국 시간 기준)
    const formattedTimestamp = Utilities.formatDate(timestamp, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    Logger.log("포맷팅된 제출시간: " + formattedTimestamp);
    
    // 데이터 행 초기화 - 모든 값을 빈 문자열로 설정
    const rowData = Array(headers.length).fill("");
    
    // 기본 필드 매핑 (인덱스 0부터 시작)
    rowData[0] = formattedTimestamp;  // 제출시간
    
    // 헤더에서 각 필드의 인덱스 찾기
    const findColumnIndex = (headerName) => {
      return headers.findIndex(header => header === headerName);
    };
    
    // 기본 정보 매핑 (고정된 필드)
    const baseFieldMappings = {
      "공사상태": e.parameter.constructionStatus || "",
      "공사비규모": e.parameter.constructionCost || "",
      "특수공사1여부": e.parameter.hasSpecialConstruction1 || "",
      "특수공사2여부": e.parameter.hasSpecialConstruction2 || "",
      "본부": e.parameter.headquarters || "",
      "지사": e.parameter.branch || "",
      "점검날짜": e.parameter.inspectionDate || "",
      "점검자명": e.parameter.inspectorName || "",
      "프로젝트명": e.parameter.projectName || "",
      "점검자소속": e.parameter.inspectorAffiliation || ""
    };
    
    // 기본 필드 매핑 채우기
    for (const [headerName, value] of Object.entries(baseFieldMappings)) {
      const colIndex = findColumnIndex(headerName);
      if (colIndex !== -1) {
        rowData[colIndex] = value;
        Logger.log(`${headerName} 값 ${value} 저장 (${colIndex}번 인덱스)`);
      } else {
        Logger.log(`헤더 ${headerName}을 찾을 수 없습니다`);
      }
    }
    
    // 모든 체크리스트 항목 처리 (동적 필드)
    for (const key in e.parameter) {
      // 기본 필드가 아닌 경우 체크리스트 항목으로 간주
      if (!Object.keys(baseFieldMappings).includes(key)) {
        // 기본 필드(constructionStatus, hasSpecialConstruction1 등)와 일치하지 않는 모든 키는 체크리스트 항목으로 간주
        const value = e.parameter[key] || "";
        
        // 정확한 헤더 이름 찾기 시도
        let headerName = key;
        let colIndex = findColumnIndex(headerName);
        
        // 정확한 이름으로 찾지 못한 경우, 구글 시트 제목행에서 가장 유사한 헤더 찾기
        if (colIndex === -1) {
          // 키 정규화 - 공백, 특수문자 제거하여 비교
          const normalizeString = (str) => {
            return str.replace(/[\s\.\(\)\/\-]/g, '').toLowerCase();
          };
          
          const normalizedKey = normalizeString(key);
          
          // 가장 유사한 헤더 찾기
          for (let i = 0; i < headers.length; i++) {
            const normalizedHeader = normalizeString(headers[i]);
            if (normalizedHeader === normalizedKey || 
                normalizedHeader.includes(normalizedKey) || 
                normalizedKey.includes(normalizedHeader)) {
              colIndex = i;
              headerName = headers[i];
              break;
            }
          }
        }
        
        if (colIndex !== -1) {
          rowData[colIndex] = value;
          Logger.log(`체크리스트 항목 ${key} -> ${headerName} 값 ${value} 저장 (${colIndex}번 인덱스)`);
        } else {
          Logger.log(`체크리스트 항목 헤더 ${key}에 매칭되는 헤더를 찾을 수 없습니다`);
        }
      }
    }
    
    // 전체 행 데이터 확인 로깅
    Logger.log("저장된 전체 데이터:");
    for (let i = 0; i < rowData.length; i++) {
      if (rowData[i] !== "") {
        Logger.log(`${i}번 인덱스 (${headers[i] || '헤더없음'}): ${rowData[i]}`);
      }
    }
    
    // A열에 값이 있는 마지막 행 찾기
    let lastRowWithData = 1; // 헤더 행은 항상 있음
    const range = sheet.getRange("A2:A"); // A열의 모든 데이터 (헤더 제외)
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] !== "") {
        lastRowWithData = i + 2; // 인덱스는 0부터 시작, 헤더가 1행이므로 +2
      }
    }
    
    Logger.log("A열에 데이터가 있는 마지막 행: " + lastRowWithData);
    
    // 데이터를 마지막 데이터 행 다음에 추가
    const targetRow = lastRowWithData + 1;
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    Logger.log(`${targetRow}행에 데이터 추가 완료`);
    
    // 마지막으로 추가된 행의 스타일 설정
    if (targetRow % 2 === 0) {
      sheet.getRange(targetRow, 1, 1, rowData.length).setBackground('#f9f9f9');
    }
    
    // 성공 응답 (창 닫기 버튼 스크립트 수정)
    const htmlResponse = HtmlService.createHtmlOutput(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>제출 완료</title>
          <script>
            // 브라우저가 팝업 닫기를 차단했는지 확인
            let closingBlocked = false;
            
            // 창 닫기 함수들
            function autoCloseWindow() {
              try {
                // 방법 1: 직접 닫기
                window.close();
                
                // 1초 후 닫혔는지 확인
                setTimeout(function() {
                  if (!window.closed) {
                    closingBlocked = true;
                    document.getElementById('closeMessage').style.display = 'none';
                    document.getElementById('manualCloseMessage').style.display = 'block';
                    document.getElementById('closeButton').style.display = 'block';
                  }
                }, 1000);
              } catch (e) {
                closingBlocked = true;
                document.getElementById('closeMessage').style.display = 'none';
                document.getElementById('manualCloseMessage').style.display = 'block';
                document.getElementById('closeButton').style.display = 'block';
              }
            }
            
            function closeWindow() {
              try {
                // 여러 방법으로 닫기 시도
                window.opener = null;
                window.open('', '_self');
                window.close();
                
                // 리디렉션 시도
                window.location.href = 'about:blank';
                
                // 마지막 수단으로 알림
                setTimeout(function() {
                  alert('브라우저 보안 정책으로 인해 창을 자동으로 닫을 수 없습니다. 이 창을 직접 닫아주세요.');
                }, 1000);
              } catch (e) {
                alert('이 창을 직접 닫아주세요.');
              }
            }
            
            // 페이지 로드 시 실행
            window.onload = function() {
              // 창 자동 닫기 시도
              autoCloseWindow();
              
              // 부모 창에 성공 메시지 전송
              try {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'formSubmitComplete', 
                    success: true,
                    message: '데이터가 성공적으로 저장되었습니다.'
                  }, '*');
                }
              } catch (e) {
                console.log("부모 창 통신 실패:", e);
              }
            }
          </script>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .message {
              text-align: center;
              padding: 30px;
              border-radius: 8px;
              background-color: white;
              box-shadow: 0 4px 15px rgba(0,0,0,0.15);
              max-width: 400px;
              width: 90%;
            }
            .success {
              color: #2e7d32;
              font-size: 24px;
              margin-bottom: 15px;
            }
            .content {
              margin-bottom: 20px;
              font-size: 16px;
              line-height: 1.5;
            }
            .close-btn {
              background-color: #4CAF50;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
              width: 100%;
              display: none;
              transition: background-color 0.3s;
            }
            .close-btn:hover {
              background-color: #45a049;
            }
            #manualCloseMessage {
              display: none;
              color: #d32f2f;
              font-weight: bold;
              margin-top: 15px;
            }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: inline-block;
              stroke-width: 2;
              stroke: #fff;
              stroke-miterlimit: 10;
              box-shadow: inset 0px 0px 0px #4CAF50;
              animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
              position: relative;
              margin-bottom: 20px;
              background: #4CAF50;
            }
            .checkmark__circle {
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              stroke-width: 2;
              stroke-miterlimit: 10;
              stroke: #4CAF50;
              fill: none;
              animation: stroke .6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: stroke .3s cubic-bezier(0.65, 0, 0.45, 1) .8s forwards;
            }
            @keyframes stroke {
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
            @keyframes fill {
              100% { box-shadow: inset 0px 0px 0px 30px #4CAF50; }
            }
          </style>
        </head>
        <body>
          <div class="message">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2 class="success">제출 완료</h2>
            <p class="content" id="closeMessage">데이터가 성공적으로 저장되었습니다.<br>이 창은 자동으로 닫힐 예정입니다.</p>
            <p class="content" id="manualCloseMessage">브라우저 보안 정책으로 인해 창을 자동으로 닫을 수 없습니다.<br>아래 버튼을 클릭하거나 창을 직접 닫아주세요.</p>
            <button class="close-btn" id="closeButton" onclick="closeWindow()">창 닫기</button>
          </div>
        </body>
      </html>
    `);
    
    return htmlResponse.setTitle('제출 완료')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
  } catch (error) {
    // 오류 로깅
    Logger.log("오류 발생: " + error.message);
    Logger.log("오류 스택: " + (error.stack || "스택 정보 없음"));
    
    // 오류 응답 (창 닫기 버튼 스크립트 수정)
    const htmlResponse = HtmlService.createHtmlOutput(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>오류 발생</title>
          <script>
            // 창 닫기 함수들
            function autoCloseWindow() {
              // 브라우저 창 닫기 시도 (여러 방법)
              var closeAttempts = [
                function() { window.close(); },
                function() { window.open('', '_self').close(); },
                function() { window.open('', '_self', ''); window.close(); },
                function() { window.open('about:blank', '_self'); window.close(); }
              ];
              
              // 모든 방법 시도
              for (var i = 0; i < closeAttempts.length; i++) {
                try {
                  closeAttempts[i]();
                  // 창이 닫혔는지 확인
                  if (window.closed) break;
                } catch (e) {
                  console.log("창 닫기 방법 " + i + " 실패: ", e);
                }
              }
              
              // 모든 방법 실패 시 사용자에게 안내
              setTimeout(function() {
                document.getElementById('closeStatus').innerHTML = 
                  '<strong style="color:red">자동으로 창을 닫지 못했습니다.</strong><br>위의 "창 닫기" 버튼을 클릭하거나 창을 직접 닫아주세요.';
              }, 1000);
            }
            
            function closeWindow() {
              try {
                // 방법 1
                window.opener = null;
                window.open('', '_self');
                window.close();
                
                // 방법 2
                setTimeout(function() {
                  window.location.href = 'about:blank';
                  setTimeout(function() {
                    window.close();
                  }, 300);
                }, 300);
                
                // 방법 3
                setTimeout(function() {
                  self.close();
                }, 600);
                
                // 방법 4
                setTimeout(function() {
                  window.top.close();
                }, 900);
              } catch (e) {
                alert('창을 직접 닫아주세요.');
              }
            }
            
            // 페이지 로드 시 실행
            window.onload = function() {
              // 창 자동 닫기 시도
              setTimeout(autoCloseWindow, 2000);
              
              // 부모 창에 메시지 전송 (부모 창에서 닫기 시도를 위함)
              try {
                if (window.opener) {
                  window.opener.postMessage('closePopup', '*');
                }
              } catch (e) {
                console.log("부모 창 통신 실패:", e);
              }
            }
          </script>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .message {
              text-align: center;
              padding: 20px;
              border-radius: 5px;
              background-color: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 400px;
              width: 90%;
            }
            .error {
              color: #c62828;
            }
            .close-btn {
              background-color: #f44336;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
              width: 100%;
            }
            .close-btn:hover {
              background-color: #d32f2f;
            }
            #closeStatus {
              margin-top: 15px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2 class="error">오류 발생</h2>
            <p>데이터 저장 중 오류가 발생했습니다: ${error.message}</p>
            <p>이 창은 자동으로 닫히도록 시도합니다.</p>
            <button class="close-btn" onclick="closeWindow()">창 닫기</button>
            <div id="closeStatus"></div>
          </div>
        </body>
      </html>
    `);
    
    return htmlResponse.setTitle('오류').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }
}
