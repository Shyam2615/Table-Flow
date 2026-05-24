'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

/* ─── geometry helpers ─── */
const getTableDims = (capacity) => ({
  w: Math.min(36 + capacity * 7, 110),
  h: Math.min(26 + capacity * 4, 60),
});

const getChairRadius = (capacity) => {
  if (capacity <= 3) return 5;
  if (capacity <= 6) return 6;
  return 7;
};

const getChairGap = () => 4;

const chairDistribution = (capacity) => {
  if (capacity <= 0) return [0, 0, 0, 0];
  if (capacity === 1) return [0, 0, 0, 0];
  if (capacity === 2) return [1, 0, 1, 0];
  if (capacity === 3) return [1, 1, 1, 0];
  if (capacity === 4) return [1, 1, 1, 1];

  const perSide = Math.floor(capacity / 4);
  const rem = capacity % 4;
  return [
    perSide + (rem > 0 ? 1 : 0), // top
    perSide + (rem > 1 ? 1 : 0), // right
    perSide + (rem > 2 ? 1 : 0), // bottom
    perSide,                       // left
  ];
};

const getTableBounds = (table) => {
  const { w, h } = getTableDims(table.capacity);
  const cr = getChairRadius(table.capacity);
  const gap = getChairGap();
  const margin = cr * 2 + gap + 2;
  return {
    left: table.positionX - w / 2 - margin,
    right: table.positionX + w / 2 + margin,
    top: table.positionY - h / 2 - margin,
    bottom: table.positionY + h / 2 + margin,
  };
};

const isInside = (x, y, bounds) =>
  x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;

/* ─── drawing ─── */
function drawChair(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawTableWithChairs(ctx, table, isBooked, isSelected) {
  const cx = table.positionX;
  const cy = table.positionY;
  const { w, h } = getTableDims(table.capacity);
  const cr = getChairRadius(table.capacity);
  const gap = getChairGap();
  const dist = chairDistribution(table.capacity);

  const colors = isBooked
    ? { table: '#ef4444', tableBorder: '#dc2626', chair: '#fca5a5', chairBorder: '#ef4444', text: '#fff' }
    : isSelected
    ? { table: '#3b82f6', tableBorder: '#2563eb', chair: '#93c5fd', chairBorder: '#3b82f6', text: '#fff' }
    : { table: '#10b981', tableBorder: '#059669', chair: '#86efac', chairBorder: '#10b981', text: '#fff' };

  /* ── chairs ── */
  const [topC, rightC, bottomC, leftC] = dist;

  // top
  for (let i = 0; i < topC; i++) {
    const x = cx - w / 2 + (i + 1) * w / (topC + 1);
    const y = cy - h / 2 - gap - cr;
    drawChair(ctx, x, y, cr, colors.chair, colors.chairBorder);
  }
  // bottom
  for (let i = 0; i < bottomC; i++) {
    const x = cx - w / 2 + (i + 1) * w / (bottomC + 1);
    const y = cy + h / 2 + gap + cr;
    drawChair(ctx, x, y, cr, colors.chair, colors.chairBorder);
  }
  // left
  for (let i = 0; i < leftC; i++) {
    const x = cx - w / 2 - gap - cr;
    const y = cy - h / 2 + (i + 1) * h / (leftC + 1);
    drawChair(ctx, x, y, cr, colors.chair, colors.chairBorder);
  }
  // right
  for (let i = 0; i < rightC; i++) {
    const x = cx + w / 2 + gap + cr;
    const y = cy - h / 2 + (i + 1) * h / (rightC + 1);
    drawChair(ctx, x, y, cr, colors.chair, colors.chairBorder);
  }

  /* ── table body (rounded rect) ── */
  const r = 6;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
  ctx.fillStyle = colors.table;
  ctx.fill();
  ctx.strokeStyle = colors.tableBorder;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  /* ── table number ── */
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${Math.min(14, 10 + Math.floor(w / 12))}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(table.tableNumber, cx, cy - 4);

  /* ── capacity ── */
  ctx.font = `${Math.min(11, 8 + Math.floor(w / 16))}px Arial`;
  ctx.fillText(`${table.capacity} seats`, cx, cy + 12);
}

/* ─── component ─── */
export default function TableManagement() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [draggedTable, setDraggedTable] = useState(null);
  const [bookedTables, setBookedTables] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [editingLayout, setEditingLayout] = useState(false);
  const [hoveredTable, setHoveredTable] = useState(null);
  const canvasRef = useRef(null);
  const [canvasSize] = useState({ width: 900, height: 650 });

  const drawCanvas = useCallback((ctx, tableList, booked, selected, hovered) => {
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // subtle floor pattern
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.strokeStyle = '#e2e6ec';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= canvasSize.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasSize.height); ctx.stroke();
    }
    for (let y = 0; y <= canvasSize.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSize.width, y); ctx.stroke();
    }

    // wall outline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, canvasSize.width - 8, canvasSize.height - 8);

    tableList.forEach((table) => {
      const isBooked = booked.has(table.tableNumber);
      const isSelected = selected?.tableNumber === table.tableNumber;
      const isHovered = hovered?.tableNumber === table.tableNumber && !isSelected;

      // draw shadow for selected/hovered
      if (isSelected || isHovered) {
        const { w, h } = getTableDims(table.capacity);
        ctx.save();
        ctx.shadowColor = isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = isSelected ? 16 : 10;
        ctx.fillStyle = 'transparent';
        ctx.beginPath();
        ctx.roundRect(table.positionX - w / 2, table.positionY - h / 2, w, h, 6);
        ctx.fill();
        ctx.restore();
      }

      drawTableWithChairs(ctx, table, isBooked, isSelected);
    });
  }, [canvasSize]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      drawCanvas(ctx, tables, bookedTables, selectedTable, hoveredTable);
    }
  }, [tables, bookedTables, selectedTable, hoveredTable, drawCanvas]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        if (cancelled) return;
        setRestaurant(rest);

        const { data: tablesData } = await API.get(
          `/tables/restaurant/${rest._id}?date=${selectedDate}&time=${selectedTime}`
        );
        if (cancelled) return;
        setTables(tablesData.tables || []);
        setBookedTables(new Set(tablesData.bookedTableNumbers || []));
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, selectedDate, selectedTime]);

  const refetchTables = async () => {
    if (!restaurant) return;
    const { data: tablesData } = await API.get(
      `/tables/restaurant/${restaurant._id}?date=${selectedDate}&time=${selectedTime}`
    );
    setTables(tablesData.tables || []);
    setBookedTables(new Set(tablesData.bookedTableNumbers || []));
  };

  const handleUpdateTable = async (tableNumber, updates) => {
    try {
      await API.put(`/tables/${restaurant._id}/${tableNumber}`, updates);
      await refetchTables();
      setSelectedTable(null);
    } catch (error) {
      console.error('Error updating table:', error);
    }
  };

  /* ── hit test ── */
  const tableAtPoint = useCallback((x, y) => {
    // iterate in reverse so topmost (last drawn) is picked first
    for (let i = tables.length - 1; i >= 0; i--) {
      if (isInside(x, y, getTableBounds(tables[i]))) return tables[i];
    }
    return null;
  }, [tables]);

  const getCanvasCoords = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasSize.width / rect.width),
      y: (e.clientY - rect.top) * (canvasSize.height / rect.height),
    };
  }, [canvasSize]);

  const handleCanvasMouseDown = (e) => {
    if (!editingLayout) {
      const { x, y } = getCanvasCoords(e);
      const hit = tableAtPoint(x, y);
      setSelectedTable(hit);
      return;
    }
    const { x, y } = getCanvasCoords(e);
    const hit = tableAtPoint(x, y);
    if (hit) setDraggedTable(hit);
  };

  const handleCanvasMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);

    if (draggedTable && editingLayout) {
      const clampedX = Math.max(40, Math.min(x, canvasSize.width - 40));
      const clampedY = Math.max(40, Math.min(y, canvasSize.height - 40));
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === draggedTable.tableNumber
            ? { ...t, positionX: clampedX, positionY: clampedY }
            : t
        )
      );
      setDraggedTable((prev) => ({
        ...prev,
        positionX: clampedX,
        positionY: clampedY,
      }));
      return;
    }

    // hover
    if (!editingLayout) {
      const hit = tableAtPoint(x, y);
      setHoveredTable(hit);
    } else {
      setHoveredTable(null);
    }
  };

  const handleCanvasMouseUp = async () => {
    if (draggedTable) {
      await handleUpdateTable(draggedTable.tableNumber, {
        positionX: draggedTable.positionX,
        positionY: draggedTable.positionY,
      });
      setDraggedTable(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Table Management</h1>
        <p>Manage restaurant tables and floor layout</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : !restaurant ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          You have not created a restaurant yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Date/Time Filter - Prominent */}
          <div className="tables-filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
                <rect x="2" y="4" width="16" height="14" rx="2" />
                <path d="M2 8h16M6 1v3M14 1v3" />
                <circle cx="10" cy="13" r="1" fill="var(--text-secondary)" />
                <circle cx="13" cy="13" r="1" fill="var(--text-secondary)" />
                <circle cx="10" cy="10" r="1" fill="var(--text-secondary)" />
              </svg>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                Check Availability
              </span>
            </div>

            <div className="tables-filter-section">
              <div style={{ position: 'relative', minWidth: 160 }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bookings-date-input"
                />
                <span className="bookings-date-icon">📅</span>
              </div>

              <div style={{ position: 'relative', minWidth: 140 }}>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bookings-date-input"
                />
                <span className="bookings-date-icon">🕐</span>
              </div>

              <button
                onClick={() => {
                  const now = new Date();
                  const hh = String(now.getHours()).padStart(2, '0');
                  const mm = String(now.getMinutes()).padStart(2, '0');
                  setSelectedDate(now.toISOString().split('T')[0]);
                  setSelectedTime(`${hh}:${mm}`);
                }}
                className="bookings-today-btn"
                style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none' }}
              >
                ◉ Now
              </button>
            </div>

            <div className="tables-legend">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="tables-legend-dot" style={{ background: '#10b981' }}></span> Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="tables-legend-dot" style={{ background: '#ef4444' }}></span> Booked
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="tables-legend-dot" style={{ background: '#3b82f6' }}></span> Selected
              </span>
            </div>
          </div>

          <div className="tables-layout">
            {/* Canvas Area */}
            <div className="tables-canvas-wrap">
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)',
              }}>
                <span>
                  {editingLayout
                    ? '🖱️ Drag tables to reposition them'
                    : '📍 Click a table to select it'}
                </span>
              </div>

              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={() => { handleCanvasMouseUp(); setHoveredTable(null); }}
                style={{
                  background: '#f0f2f5',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: editingLayout ? 'grab' : 'pointer',
                  display: 'block',
                  width: '100%',
                  aspectRatio: `${canvasSize.width}/${canvasSize.height}`,
                }}
              />
            </div>

            {/* Sidebar */}
            <div className="tables-sidebar">
              {/* Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setEditingLayout(!editingLayout); if (!editingLayout) setDraggedTable(null); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: editingLayout ? '#ef4444' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {editingLayout ? '✓ Done Editing' : '✎ Edit Layout'}
                </button>
              </div>

              {/* Table List */}
              <div className="tables-list">
                <label className="tables-list-label">Tables ({tables.length})</label>
                <div className="tables-list-items">
                  {tables.map((table) => (
                    <div
                      key={table.tableNumber}
                      onClick={() => setSelectedTable(table)}
                      style={{
                        padding: '10px 12px',
                        background: selectedTable?.tableNumber === table.tableNumber
                          ? 'var(--primary)'
                          : 'var(--bg)',
                        color: selectedTable?.tableNumber === table.tableNumber ? 'white' : 'inherit',
                        border: `2px solid ${
                          bookedTables.has(table.tableNumber)
                            ? '#ef4444'
                            : selectedTable?.tableNumber === table.tableNumber
                            ? 'var(--primary)'
                            : 'var(--border)'
                        }`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontSize: '0.9rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 20, height: 20, borderRadius: 4,
                          background: bookedTables.has(table.tableNumber) ? '#ef4444' : '#10b981',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                        }}>{table.tableNumber}</span>
                        T{table.tableNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {table.tableName || 'Unnamed'} • {table.capacity} seats
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Panel */}
              {selectedTable && (
                <div className="tables-edit-panel">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
                    Table {selectedTable.tableNumber} — {selectedTable.capacity} seats
                  </label>

                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Table name
                  </label>
                  <input
                    type="text"
                    placeholder="Table name"
                    defaultValue={selectedTable.tableName || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (selectedTable.tableName || '')) {
                        handleUpdateTable(selectedTable.tableNumber, { tableName: e.target.value });
                      }
                    }}
                    className="input"
                    style={{ width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
                  />

                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Capacity (seats)
                  </label>
                  <input
                    type="number"
                    defaultValue={selectedTable.capacity}
                    min="1"
                    max="20"
                    onBlur={(e) => {
                      const newCapacity = parseInt(e.target.value);
                      if (newCapacity && newCapacity !== selectedTable.capacity) {
                        handleUpdateTable(selectedTable.tableNumber, { capacity: newCapacity });
                      }
                    }}
                    className="input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
