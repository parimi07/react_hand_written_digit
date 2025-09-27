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

  // --- MOUSE EVENT HANDLERS (for Desktop) ---
  const startDrawingMouse = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const drawMouse = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  // --- TOUCH EVENT HANDLERS (for Mobile) ---
  const startDrawingTouch = (event) => {
    const touch = event.touches[0];
    const { clientX, clientY } = touch;
    const rect = canvasRef.current.getBoundingClientRect();
    contextRef.current.beginPath();
    contextRef.current.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const drawTouch = (event) => {
    if (!isDrawing) return;
    const touch = event.touches[0];
    const { clientX, clientY } = touch;
    const rect = canvasRef.current.getBoundingClientRect();
    contextRef.current.lineTo(clientX - rect.left, clientY - rect.top);
    contextRef.current.stroke();
    // Prevents the page from scrolling while drawing on the canvas
    event.preventDefault(); 
  };

  // --- SHARED EVENT HANDLER ---
  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
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
        // Mouse events for desktop
        onMouseDown={startDrawingMouse}
        onMouseUp={finishDrawing}
        onMouseMove={drawMouse}
        onMouseLeave={finishDrawing}
        // Touch events for mobile
        onTouchStart={startDrawingTouch}
        onTouchEnd={finishDrawing}
        onTouchMove={drawTouch}
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

