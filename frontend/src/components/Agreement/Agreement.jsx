import React from 'react';
import './Agreement.css';

const Agreement = ({ agreements, allAgreed, onAgreement, onAllAgree }) => {
    return (
    <div className="agreement-section">
        <div className="agreement-all">
        <input 
        type="checkbox" 
        id="allAgree"
        checked={allAgreed}
        onChange={onAllAgree}
        />
        <label htmlFor="allAgree">전체 동의</label>
    </div>
    <div className="agreement-divider" />
    <div className="agreement-item">
        <input 
        type="checkbox"
        id="terms"
        checked={agreements.terms}
        onChange={() => onAgreement('terms')}
        />
        <label htmlFor="terms">[필수] 이용약관 동의</label>
    </div>
    <div className="agreement-item">
        <input 
        type="checkbox"
        id="privacy"
        checked={agreements.privacy}
        onChange={() => onAgreement('privacy')}
        />
        <label htmlFor="privacy">[필수] 개인정보 처리방침 동의</label>
    </div>
    <div className="agreement-item">
        <input 
        type="checkbox"
        id="aiData"
        checked={agreements.aiData}
        onChange={() => onAgreement('aiData')}
        />
        <label htmlFor="aiData">[선택] AI 학습 목적 데이터 활용 동의</label>
    </div>
    </div>
);
};

export default Agreement;