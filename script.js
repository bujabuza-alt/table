/* script.js */
var curStore = "ryuma_covent"; 
var curDate = new Date().toISOString().split('T')[0];
var isMergeMode = false;
var mergeSelection = [];

// [1 & 2번 문제 해결] 테이블 배정 및 날짜 격리 저장
function sT(id, tno) {
    if(!id || !curStore || !curDate) return;
    
    // 수정된 경로: reservations 뒤에 반드시 날짜(curDate)를 포함
    var path = 'stores/' + curStore + '/reservations/' + curDate + '/' + id;
    
    firebase.database().ref(path).update({
        tableNo: tno,
        status: '배정완료',
        uAt: firebase.database.ServerValue.TIMESTAMP
    }).then(function() {
        showToast(tno + "번 테이블 배정 완료");
        if(typeof loadData === 'function') loadData(); // 데이터 재로드
    });
}

// [3 & 4번 문제 해결] 테이블 뷰 직접 선택 및 묶기 모드
function tC(tid) {
    if (isMergeMode) {
        // 4번: 테이블 뷰에서 직접 클릭하여 선택
        var idx = mergeSelection.indexOf(tid);
        var el = document.querySelector('.tc[data-id="'+tid+'"]');
        if (idx > -1) {
            mergeSelection.splice(idx, 1);
            if(el) el.classList.remove('selecting');
        } else {
            mergeSelection.push(tid);
            if(el) el.classList.add('selecting');
        }
        return; 
    }
    // 일반 클릭 시 모달 열기 등 기존 로직
    openAssignModal(tid);
}

// 테이블 묶기 확정 실행
function executeMerge() {
    if (mergeSelection.length < 2) return alert("2개 이상 선택하세요.");
    
    var masterId = mergeSelection[0];
    firebase.database().ref('stores/' + curStore + '/layout/mergedGroups/' + masterId).set({
        all: mergeSelection,
        color: 'var(--indigo)'
    }).then(function() {
        showToast("테이블이 그룹으로 묶였습니다.");
        location.reload();
    });
}

/* ... 기존 나머지 JS 함수들 (loadData, renderTables 등) ... */