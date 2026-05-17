import React, { useRef, useState, useEffect } from 'react';

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasData, setHasData] = useState(false);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    drawing.current = true;
    e.preventDefault();
  }

  function draw(e) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8';
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  }

  function stopDraw(e) {
    if (!drawing.current) return;
    drawing.current = false;
    setHasData(true);
    if (onChange) onChange(canvasRef.current.toDataURL());
    e.preventDefault();
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasData(false);
    if (onChange) onChange(null);
  }

  // Size canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio || rect.width;
    canvas.height = rect.height * window.devicePixelRatio || rect.height;
  }, []);

  return (
    <div className="sig-pad-wrap">
      <canvas
        ref={canvasRef}
        className={`sig-canvas${drawing.current ? ' active' : ''}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      {!hasData && (
        <div className="sig-placeholder">
          <p>✏️ Tanda tangan di sini</p>
        </div>
      )}
      {hasData && (
        <button className="sig-clear-btn" onClick={clear} type="button">Hapus</button>
      )}
    </div>
  );
}
