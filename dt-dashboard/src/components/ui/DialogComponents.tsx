import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Stop clicks inside the modal from propagating to overlay
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Get width based on size prop
  const getWidthClass = (): string => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-lg';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      default: return 'max-w-lg';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className="fixed inset-0 overflow-y-auto"
        onClick={onClose}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className={`${getWidthClass()} w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700`}
            onClick={handleModalClick}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-blue-300">{title}</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-200"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  maxWidth?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = '200px'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeout = useRef<number | null>(null);
  const childrenRef = useRef<HTMLDivElement>(null);
  
  const showTooltip = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    
    timeout.current = window.setTimeout(() => {
      if (childrenRef.current) {
        const rect = childrenRef.current.getBoundingClientRect();
        
        // Calculate position based on the position prop
        let x = 0;
        let y = 0;
        
        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - 8;
            break;
          case 'right':
            x = rect.right + 8;
            y = rect.top + rect.height / 2;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + 8;
            break;
          case 'left':
            x = rect.left - 8;
            y = rect.top + rect.height / 2;
            break;
        }
        
        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };
  
  const hideTooltip = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    setIsVisible(false);
  };
  
  // Get tooltip position classes
  const getPositionClasses = (): string => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1';
      case 'right':
        return 'top-1/2 left-full transform -translate-y-1/2 translate-x-2 ml-1';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1';
      case 'left':
        return 'top-1/2 right-full transform -translate-y-1/2 -translate-x-2 mr-1';
    }
  };
  
  // Get tooltip arrow classes
  const getArrowClasses = (): string => {
    switch (position) {
      case 'top':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-gray-900 border-l-transparent border-r-transparent';
      case 'right':
        return 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent';
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-gray-900 border-l-transparent border-r-transparent';
      case 'left':
        return 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent';
    }
  };
  
  return (
    <>
      <div
        ref={childrenRef}
        className="inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          className={`fixed z-50 ${getPositionClasses()}`}
          style={{ 
            left: position === 'left' || position === 'right' ? undefined : `${coords.x}px`,
            top: position === 'top' || position === 'bottom' ? undefined : `${coords.y}px`,
            right: position === 'left' ? `calc(100% - ${coords.x}px)` : undefined,
            bottom: position === 'top' ? `calc(100% - ${coords.y}px)` : undefined,
            maxWidth
          }}
          onMouseEnter={hideTooltip}
        >
          <div className="bg-gray-900 text-white rounded px-2.5 py-1.5 text-xs shadow-lg border border-gray-700">
            {content}
            <div
              className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
            ></div>
          </div>
        </div>
      )}
    </>
  );
}

interface HelpButtonProps {
  helpContent: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export function HelpButton({ helpContent, position = 'top' }: HelpButtonProps) {
  return (
    <Tooltip content={helpContent} position={position}>
      <button className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200 flex items-center justify-center text-xs font-semibold">
        ?
      </button>
    </Tooltip>
  );
}

// Confirm modal dialog (simplified version)
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'warning' | 'error';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info'
}: ConfirmDialogProps) {
  const getTypeClasses = (): { button: string; icon: ReactNode } => {
    switch (type) {
      case 'warning':
        return {
          button: 'bg-amber-600 hover:bg-amber-500',
          icon: (
            <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'error':
        return {
          button: 'bg-red-600 hover:bg-red-500',
          icon: (
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      default:
        return {
          button: 'bg-blue-600 hover:bg-blue-500',
          icon: (
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };
  
  const typeClasses = getTypeClasses();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 mr-4">
          {typeClasses.icon}
        </div>
        <div className="text-sm text-gray-300">
          {message}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-4">
        <button
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 rounded"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          className={`px-4 py-2 text-sm text-white rounded ${typeClasses.button}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
