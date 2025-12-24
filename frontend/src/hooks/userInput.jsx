import { useState } from 'react';

// 초기값을 받아서 입력 상태를 관리하는 훅 파일 올리기 위한 예시
const useInput = (initialValue) => {
  const [value, setValue] = useState(initialValue);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  return { value, onChange, setValue };
};

export default useInput;