import React, { useRef, useEffect } from 'react';

/**
 * RichTextEditor Component
 * Supports:
 * - Headline tags: H1, H2, H3, H4, H5, H6, P
 * - Inline formatting: Bold, Italic, Underline
 * - Links: Insert/edit Link, Unlink
 */
export const RichTextEditor = ({
  value = '',
  onChange = () => {},
  placeholder = 'Write content here...',
  minHeight = '120px',
  label = '',
  description = ''
}) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  // Sync incoming value to innerHTML when not actively typing
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  // Helper to execute commands with selection retention
  const execCmd = (command, val = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleBlockChange = (e) => {
    const tag = e.target.value;
    if (!tag) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    // formatBlock requires <tag> on some browsers or tag on others
    try {
      document.execCommand('formatBlock', false, `<${tag}>`);
    } catch {
      document.execCommand('formatBlock', false, tag);
    }
    handleInput();
  };

  const handleLink = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const currentSelection = window.getSelection();
    const hasSelection = currentSelection && !currentSelection.isCollapsed;
    
    const url = window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
    if (url && url.trim() !== '' && url !== 'https://') {
      if (!hasSelection) {
        // If nothing was selected, insert the link text
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
      } else {
        document.execCommand('createLink', false, url);
      }
      handleInput();
    }
  };

  const handleUnlink = () => {
    execCmd('unlink');
  };

  const toolbarBtnStyle = {
    background: '#ffffff',
    border: '1px solid #e0d8d3',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#2c2320',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    minWidth: '28px',
    height: '28px',
    lineHeight: 1
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#2c2320' }}>
            {label}
          </label>
          {description && (
            <span style={{ fontSize: '11px', color: '#9c8e85' }}>
              {description}
            </span>
          )}
        </div>
      )}

      {/* Container with Toolbar & Editor */}
      <div
        style={{
          border: '1px solid #e0d8d3',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'border-color 0.15s ease'
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#ff6b4a')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e0d8d3')}
      >
        {/* Formatting Toolbar */}
        <div
          style={{
            background: '#faf6f3',
            borderBottom: '1px solid #ede5df',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px'
          }}
        >
          {/* Headings & Paragraph Selector */}
          <select
            aria-label="Format Headline / Paragraph"
            defaultValue=""
            onChange={(e) => {
              handleBlockChange(e);
              e.target.value = '';
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1px solid #e0d8d3',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#2c2320',
              cursor: 'pointer',
              height: '28px'
            }}
          >
            <option value="" disabled>Formatting (H1-H6, P)</option>
            <option value="p">Paragraph (P)</option>
            <option value="h1">Heading 1 (H1)</option>
            <option value="h2">Heading 2 (H2)</option>
            <option value="h3">Heading 3 (H3)</option>
            <option value="h4">Heading 4 (H4)</option>
            <option value="h5">Heading 5 (H5)</option>
            <option value="h6">Heading 6 (H6)</option>
          </select>

          {/* Quick Headline Buttons */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              title="Heading 1"
              onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h1>'); }}
              style={toolbarBtnStyle}
            >
              H1
            </button>
            <button
              type="button"
              title="Heading 2"
              onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
              style={toolbarBtnStyle}
            >
              H2
            </button>
            <button
              type="button"
              title="Heading 3"
              onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h3>'); }}
              style={toolbarBtnStyle}
            >
              H3
            </button>
            <button
              type="button"
              title="Paragraph"
              onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<p>'); }}
              style={{ ...toolbarBtnStyle, fontWeight: 800 }}
            >
              P
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: '#e0d8d3', margin: '0 2px' }} />

          {/* Inline Style Buttons */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              title="Bold (Ctrl+B)"
              onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }}
              style={{ ...toolbarBtnStyle, fontWeight: 900 }}
            >
              B
            </button>
            <button
              type="button"
              title="Italic (Ctrl+I)"
              onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }}
              style={{ ...toolbarBtnStyle, fontStyle: 'italic', fontFamily: 'serif' }}
            >
              I
            </button>
            <button
              type="button"
              title="Underline (Ctrl+U)"
              onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }}
              style={{ ...toolbarBtnStyle, textDecoration: 'underline' }}
            >
              U
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: '#e0d8d3', margin: '0 2px' }} />

          {/* Link Buttons */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              title="Insert Link"
              onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
              style={{ ...toolbarBtnStyle, color: '#ff6b4a' }}
            >
              🔗 Link
            </button>
            <button
              type="button"
              title="Remove Link"
              onMouseDown={(e) => { e.preventDefault(); handleUnlink(); }}
              style={{ ...toolbarBtnStyle, fontSize: '11px', color: '#888' }}
            >
              Unlink
            </button>
          </div>

        </div>

        {/* Editable Content Area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          style={{
            minHeight,
            padding: '12px 14px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#2c2320',
            outline: 'none',
            overflowY: 'auto',
            maxHeight: '260px'
          }}
        />
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a89f99;
          cursor: text;
        }
        [contenteditable] h1 { font-size: 20px; font-weight: 800; margin: 8px 0 4px; color: #2c2320; }
        [contenteditable] h2 { font-size: 17px; font-weight: 800; margin: 7px 0 4px; color: #2c2320; }
        [contenteditable] h3 { font-size: 15px; font-weight: 700; margin: 6px 0 3px; color: #2c2320; }
        [contenteditable] h4 { font-size: 14px; font-weight: 700; margin: 5px 0 2px; color: #2c2320; }
        [contenteditable] h5 { font-size: 13px; font-weight: 700; margin: 4px 0 2px; color: #2c2320; }
        [contenteditable] h6 { font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 4px 0 2px; color: #6b5d56; }
        [contenteditable] p { margin: 0 0 6px; }
        [contenteditable] a { color: #ff6b4a; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
