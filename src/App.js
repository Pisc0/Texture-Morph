import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import SourceContainer from './SourceContainer.js'
import TiledContainer from './TiledContainer.js'

// This function retrieves the dimensions of the window.
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

  // Handles window resize
  useEffect(()=> {
    function handleWindowResize(){
      // Update the window size state with the new dimensions.
      setWindowSize(getWindowDimensions());
    }
    // Add the event listener for window resize events.
    window.addEventListener('resize', handleWindowResize);

    // Clean up by removing the event listener when the component is unmounted.
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
