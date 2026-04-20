import React, { useState } from 'react';
import { useBluetooth } from '../../context/BluetoothContext';
import Swal from 'sweetalert2';
import './QuickMenu.css';
import { IoWaterOutline } from "react-icons/io5";
import { FaStop, FaHandPaper, FaWifi } from "react-icons/fa";
import { MdAutorenew, MdTune } from "react-icons/md";
import { BsFileBarGraph } from "react-icons/bs";
import { IoIosSettings } from "react-icons/io";
import { PiPlant } from "react-icons/pi";

const MENU = [{
    icon: <IoWaterOutline />,
    name: '급수제어',
    color: '#3b82f6',
    children: [
    { icon: <IoWaterOutline />, name: '급수', cmd: 'WATER 10' },
    { icon: <FaStop />,  name: '정지', cmd: 'STOP' },
    { icon: <MdAutorenew />, name: '자동모드', cmd: 'MODE:AUTO' },
    { icon: <FaHandPaper />, name: '수동모드', cmd: 'MODE:MANUAL' },
    ],
},
{
    icon: <BsFileBarGraph />,
    name: '상태확인',
    color: '#10b981',
    cmd: 'STATE',
},
{
    icon: <IoIosSettings />,
    name: '기기설정',
    color: '#f59e0b',
    children: [
    { icon: <PiPlant />, name: '식물설정', special: 'plant' },
    { icon: <FaWifi />, name: '와이파이', special: 'wifi' },
    { icon: <MdTune />, name: '펌프보정', cmd: 'CAL 8.5' },
    ],
},
];

const PARENT_RADIUS = 90;
const CHILD_RADIUS = 100;

function getFanPositions(count) {
const total = 160;
const start = 180 + (180 - total) / 2;
return Array.from({ length: count }, (_, i) => {
    const angle = count === 1 ? 270 : start + (total / (count - 1)) * i;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * PARENT_RADIUS,
      y: Math.sin(rad) * CHILD_RADIUS,
    };
});
}

    const QuickMenu = ({ onClose }) => {
    const { sendCommand, deviceName } = useBluetooth();
    const [activeParent, setActiveParent] = useState(null);

    const handleParent = (item, idx) => {
    if (item.cmd) {
        execCommand(item.cmd, item.name);
        return;
    }
    setActiveParent(activeParent === idx ? null : idx);
    };

    const execCommand = async (cmd, name) => {
    if (!sendCommand) {
        Swal.fire('기기 미연결', '먼저 블루투스 기기를 연결해주세요.', 'warning');
        return;
    }
    await sendCommand(cmd);
    Swal.fire({ icon: 'success', title: `${name} 완료`, timer: 1000, showConfirmButton: false });
    onClose();
    };

    const handleChild = async (item) => {
    if (item.special === 'plant') {
        const { value } = await Swal.fire({
        title: '식물 종 입력',
        input: 'text',
        inputPlaceholder: '예: 바질',
        showCancelButton: true,
        confirmButtonText: '전송',
        cancelButtonText: '취소',
        });
        if (value) execCommand(`PLANT-TYPE:${value}`, '식물설정');
        return;
    }
    if (item.special === 'wifi') {
        const { value: ssid } = await Swal.fire({
        title: '와이파이 SSID',
        input: 'text',
        inputPlaceholder: '네트워크 이름',
        showCancelButton: true,
    });
    if (!ssid) return;
    const { value: pw } = await Swal.fire({
        title: '와이파이 비밀번호',
        input: 'password',
        inputPlaceholder: '비밀번호',
        showCancelButton: true,
        });
        if (pw !== undefined) execCommand(`WIFI:${ssid},${pw}`, '와이파이 설정');
        return;
    }
    execCommand(item.cmd, item.name);
    };

    const parentPositions = getFanPositions(MENU.length);
    const childItems = activeParent !== null ? MENU[activeParent].children : [];
    const childPositions = getFanPositions(childItems?.length || 0);

    return (
    <div className="qm-overlay" onClick={() => { setActiveParent(null); onClose(); }}>
      {/* 연결 상태 뱃지 */}
        <div className="qm-badge" onClick={e => e.stopPropagation()}>
        {deviceName
            ? <><span className="qm-dot connected" />  {deviceName}</>
            : <><span className="qm-dot" /> 기기 미연결</>}
        </div>

        <div className="qm-fan" onClick={e => e.stopPropagation()}>
        {/* 1단계 */}
        {MENU.map((item, i) => {
            const { x, y } = parentPositions[i];
            const isActive = activeParent === i;
            const isAnyActive = activeParent !== null;

            if (isAnyActive && !isActive) return null;
            return (
            <button
                key={i}
                className={`qm-item qm-parent ${isActive ? 'active' : ''}`}
                style={{
                '--tx': `${x}px`,
                '--ty': `${y}px`,
                '--accent': item.color,
                animationDelay: `${i * 40}ms`,
                }}
                onClick={() => handleParent(item, i)}
            >
                <span className="qm-icon">{item.icon}</span>
                <span className="qm-label">{item.name}</span>
            </button>
            );
        })}

        {/* 2단계 */}
        {activeParent !== null && childItems.map((item, i) => {
            const { x, y } = childPositions[i];
            return (
            <button
                key={`child-${i}`}
                className="qm-item qm-child"
                style={{
                '--tx': `${x}px`,
                '--ty': `${y}px`,
                animationDelay: `${i * 35}ms`,
                }}
                onClick={() => handleChild(item)}
            >
                <span className="qm-icon">{item.icon}</span>
                <span className="qm-label">{item.name}</span>
            </button>
            );
        })}
        </div>
    </div>
    );
};

export default QuickMenu;