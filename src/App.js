import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import SourceContainer from './SourceContainer.js'
import TiledContainer from './TiledContainer.js'


function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function App() {
  const [image, setImage] = useState(null);
  const [windowSize, setWindowSize] = useState(getWindowDimensions());

  useEffect(()=> {
    function handleWindowResize(){
      setWindowSize(getWindowDimensions());
    }
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    }
  }, []);

  return (
    <div class="grid-container">
      <SourceContainer          
        setImage = {setImage}
        size = {windowSize.width/2 - 200}
      />
      <TiledContainer       
        image = {image}
        size = {windowSize.width/2 - 200} 
      />
    </div>
  );
}

export default App;
