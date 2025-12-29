import { useCallback, useState } from 'react';
//로그인 onChange함수를 옮김으로써 UI와 로직의 분리
  const useInput = (initialForm) => {
    const [form, setForm] = useState(initialForm);

  const onChange = useCallback((e) => {
    const{name, value} = e.target;
    setForm (prev => ({...prev, [name]: value}));
  }, []);

  const reset = useCallback(() => setForm(initialForm), [initialForm]);

  return [form, onChange, reset, setForm];
};
export default useInput;