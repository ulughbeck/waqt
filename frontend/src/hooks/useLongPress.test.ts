import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLongPress } from './useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger onLongPress after threshold', () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const handlers = useLongPress(onLongPress, onClick, 500);

    // Simulate Mouse Down
    handlers.onMouseDown({} as MouseEvent);

    // Advance time but not enough
    vi.advanceTimersByTime(400);
    expect(onLongPress).not.toHaveBeenCalled();

    // Advance past threshold
    vi.advanceTimersByTime(100);
    expect(onLongPress).toHaveBeenCalled();
  });

  it('should cancel onLongPress if released early', () => {
    const onLongPress = vi.fn();
    const handlers = useLongPress(onLongPress, undefined, 500);

    handlers.onMouseDown({} as MouseEvent);
    vi.advanceTimersByTime(400);
    handlers.onMouseUp();

    vi.advanceTimersByTime(200);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should block onClick if long press occurred', () => {
     const onLongPress = vi.fn();
     const onClick = vi.fn();
     const handlers = useLongPress(onLongPress, onClick, 500);
     const preventDefault = vi.fn();
     const stopPropagation = vi.fn();
     const mockEvent = { preventDefault, stopPropagation };

     // Start press
     handlers.onMouseDown({} as MouseEvent);
     
     // Trigger long press
     vi.advanceTimersByTime(500);
     expect(onLongPress).toHaveBeenCalled();

     // Release
     handlers.onMouseUp();

     // Click happens immediately after release
     handlers.onClick(mockEvent);

     // onClick should NOT be called
     expect(onClick).not.toHaveBeenCalled();
     // Should have prevented default/propagation
     expect(preventDefault).toHaveBeenCalled();
     expect(stopPropagation).toHaveBeenCalled();
  });

  it('should allow onClick if long press did NOT occur', () => {
     const onLongPress = vi.fn();
     const onClick = vi.fn();
     const handlers = useLongPress(onLongPress, onClick, 500);
     const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

     // Start press
     handlers.onMouseDown({} as MouseEvent);
     
     // Release BEFORE threshold
     vi.advanceTimersByTime(200);
     handlers.onMouseUp();

     // Click happens
     handlers.onClick(mockEvent);

     // onClick SHOULD be called
     expect(onClick).toHaveBeenCalledWith(mockEvent);
     expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should ignore synthetic mouse events after a touch long press', () => {
     const onLongPress = vi.fn();
     const onClick = vi.fn();
     const handlers = useLongPress(onLongPress, onClick, 500);
     const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

     // Touch long press
     handlers.onTouchStart({} as TouchEvent);
     vi.advanceTimersByTime(500);
     expect(onLongPress).toHaveBeenCalled();
     handlers.onTouchEnd();

     // Synthetic mouse events should be ignored
     handlers.onMouseDown({} as MouseEvent);
     handlers.onMouseUp();
     handlers.onClick(mockEvent);

     expect(onClick).not.toHaveBeenCalled();
     expect(mockEvent.preventDefault).toHaveBeenCalled();
     expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
});
