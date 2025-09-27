import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState('-');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = 'white';
    context.lineWidth = 20;
    contextRef.current = context;
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setPrediction('-');
  };

  const predictDigit = async () => {
    setIsLoading(true);
    setPrediction('...');
    const canvas = canvasRef.current;
    const imageDataURL = canvas.toDataURL('image/png');

    try {
      // This line uses the live backend URL when deployed on Render
      const apiUrl = `${process.env.REACT_APP_API_URL}/predict`;
      
      const response = await axios.post(apiUrl, {
        image: imageDataURL,
      });
      setPrediction(response.data.digit);
    } catch (error) {
      console.error('Error predicting digit:', error);
      setPrediction('Error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container">
      <h1>Handwritten Digit Recognizer</h1>
      <p>Draw a digit (0-9) in the box below.</p>
      <canvas
        ref={canvasRef}
        width="280"
        height="280"
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
      />
      <div className="buttons">
        <button onClick={predictDigit} disabled={isLoading}>
          {isLoading ? 'Predicting...' : 'Predict'}
        </button>
        <button onClick={clearCanvas}>Clear</button>
      </div>
      <h2>Prediction: <span id="result">{prediction}</span></h2>
    </div>
  );
}

export default App;