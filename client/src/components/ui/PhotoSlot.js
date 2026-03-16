import React, { useRef } from 'react';

export default function PhotoSlot({ label, timing, required, photoUrl, onUpload, onDelete, loading, note, canEdit }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    if (!loading && canEdit && !photoUrl) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="photo-slot">
      {photoUrl ? (
        <div className="photo-slot-preview">
          <img src={photoUrl} alt={label} className="photo-slot-image" />
          {canEdit && onDelete && (
            <button type="button" className="photo-slot-delete" onClick={onDelete} aria-label="Delete photo">
              &times;
            </button>
          )}
        </div>
      ) : (
        <div
          className={'photo-slot-empty' + (canEdit ? ' photo-slot-clickable' : '')}
          onClick={handleClick}
          role={canEdit ? 'button' : undefined}
          tabIndex={canEdit ? 0 : undefined}
        >
          {loading ? (
            <div className="photo-slot-spinner" />
          ) : (
            <>
              <span className="photo-slot-icon">{'\u{1F4F7}'}</span>
              <span className="photo-slot-label">{label}</span>
              {timing && <span className="photo-slot-timing">{timing}</span>}
              {required && <span className="photo-slot-required">Required</span>}
              {note && <span className="photo-slot-note">{note}</span>}
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
