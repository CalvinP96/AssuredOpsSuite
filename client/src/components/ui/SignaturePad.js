import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function SignaturePad({ onSign, existingSig, label, readOnly }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef(null);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDraw = useCallback((e) => {
    if (readOnly) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  }, [readOnly, getPos]);

  const draw = useCallback((e) => {
    if (!drawing || readOnly) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsDirty(true);
  }, [drawing, readOnly, getPos]);

  const endDraw = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    if (isDirty && onSign) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onSign(dataUrl);
      }, 500);
    }
  }, [drawing, isDirty, onSign]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsDirty(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 280;
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  if (existingSig && readOnly) {
    return (
      <div className="signature-pad-container">
        {label && <div className="signature-pad-label">{label}</div>}
        <img src={existingSig} alt="Signature" className="signature-pad-image" />
      </div>
    );
  }

  return (
    <div className="signature-pad-container">
      {label && <div className="signature-pad-label">{label}</div>}
      {existingSig ? (
        <img src={existingSig} alt="Signature" className="signature-pad-image" />
      ) : (
        <canvas
          ref={canvasRef}
          className="signature-pad-canvas"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      )}
      {!readOnly && (
        <button type="button" className="btn btn-sm btn-secondary signature-pad-clear" onClick={clear}>
          Clear
        </button>
      )}
    </div>
  );
}
