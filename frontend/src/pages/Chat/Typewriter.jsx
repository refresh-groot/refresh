import React, { useEffect, useState } from 'react'

const Typewriter = ({text, speed = 30, onUpdate}) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if(!text) return;
        setDisplayText('');
        let index = 0;
        const intervalId = setInterval(() => {
                if(index < text.length){
                    index++;
                    setDisplayText(text.slice(0, index));
                }
                else{
                    clearInterval(intervalId);
                }
            },speed);
        return () => clearInterval(intervalId);
    }, [text, speed]);

    useEffect (() => {
        if(onUpdate) {
            onUpdate();
        }
    }, [displayText, onUpdate]);
  return (
    <span><br/>
    {displayText.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {line}
            {i !== displayText.split('\n').length -1 && <br/>}
        </React.Fragment>
    ))}
    </span>
  )
}

export default Typewriter