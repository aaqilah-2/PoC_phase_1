import { useState } from 'react';
import { Tooltip } from './DialogComponents';
import type { ViewMode } from '../../data/entities';

interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  availableOperators?: string[];
  currentOperator?: string;
  onOperatorChange?: (operatorId: string) => void;
}

export function ViewModeSwitcher({
  currentMode,
  onModeChange,
  availableOperators = [],
  currentOperator,
  onOperatorChange
}: ViewModeSwitcherProps) {
  const [showOperatorSelect, setShowOperatorSelect] = useState(false);
  
  // Toggle view mode
  const toggleMode = () => {
    const newMode: ViewMode = currentMode === 'SUPERVISOR' ? 'OPERATOR' : 'SUPERVISOR';
    onModeChange(newMode);
    
    // If switching to operator mode and we have available operators but none selected,
    // automatically open the operator selector
    if (newMode === 'OPERATOR' && availableOperators.length > 0 && !currentOperator) {
      setShowOperatorSelect(true);
    }
  };
  
  // Select an operator
  const selectOperator = (operatorId: string) => {
    if (onOperatorChange) {
      onOperatorChange(operatorId);
    }
    setShowOperatorSelect(false);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Tooltip 
          content={`Switch to ${currentMode === 'SUPERVISOR' ? 'Operator' : 'Supervisor'} View`}
          position="bottom"
        >
          <button
            onClick={toggleMode}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${
              currentMode === 'SUPERVISOR'
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            <span className="text-sm">
              {currentMode === 'SUPERVISOR' ? 'Supervisor View' : 'Operator View'}
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </Tooltip>
        
        {/* Only show operator selector button when in operator mode */}
        {currentMode === 'OPERATOR' && availableOperators.length > 0 && (
          <Tooltip 
            content="Select Operator"
            position="bottom"
          >
            <button
              onClick={() => setShowOperatorSelect(!showOperatorSelect)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center gap-2 text-gray-300"
            >
              <span className="text-sm">
                {currentOperator || 'Select Operator'}
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
      
      {/* Operator selection dropdown */}
      {showOperatorSelect && availableOperators.length > 0 && (
        <div className="absolute mt-1 right-0 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
          <div className="py-1">
            {availableOperators.map(operator => (
              <button
                key={operator}
                onClick={() => selectOperator(operator)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  currentOperator === operator
                    ? 'bg-blue-900 text-blue-200'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {operator}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
