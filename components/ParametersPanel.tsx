/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useState} from 'react';

interface ParametersPanelProps {
  currentLength: number;
  onUpdateHistoryLength: (newLength: number) => void;
  onClosePanel: () => void;
  isStatefulnessEnabled: boolean;
  onSetStatefulness: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}> = ({checked, onChange, id}) => (
  <div 
    className={`relative w-14 h-8 rounded-full transition-all duration-300 cursor-pointer shadow-inner border border-black/5 ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    onClick={() => onChange(!checked)}
  >
    <input 
      type="checkbox" 
      id={id} 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
      className="sr-only" 
    />
    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-all duration-[400ms] cubic-bezier(0.34, 1.56, 0.64, 1) ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
  </div>
);

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  currentLength,
  onUpdateHistoryLength,
  onClosePanel,
  isStatefulnessEnabled,
  onSetStatefulness,
}) => {
  const [localHistoryLengthInput, setLocalHistoryLengthInput] =
    useState<string>(currentLength.toString());
  const [localStatefulnessChecked, setLocalStatefulnessChecked] =
    useState<boolean>(isStatefulnessEnabled);

  useEffect(() => {
    setLocalHistoryLengthInput(currentLength.toString());
  }, [currentLength]);

  useEffect(() => {
    setLocalStatefulnessChecked(isStatefulnessEnabled);
  }, [isStatefulnessEnabled]);

  const handleApplyParameters = () => {
    const newLength = parseInt(localHistoryLengthInput, 10);
    if (!isNaN(newLength) && newLength >= 0 && newLength <= 10) {
      onUpdateHistoryLength(newLength);
    } else {
      alert('Please enter a number between 0 and 10 for history length.');
      setLocalHistoryLengthInput(currentLength.toString());
      return;
    }

    if (localStatefulnessChecked !== isStatefulnessEnabled) {
      onSetStatefulness(localStatefulnessChecked);
    }

    onClosePanel();
  };

  const handleClose = () => {
    setLocalHistoryLengthInput(currentLength.toString());
    setLocalStatefulnessChecked(isStatefulnessEnabled);
    onClosePanel();
  };

  return (
    <div className="h-full flex flex-col p-10 animate-in slide-in-from-bottom-8 duration-500 fade-in">
      
      <div className="max-w-xl mx-auto w-full space-y-10">
        
        <div className="space-y-3 text-center">
           <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Preferences</h2>
           <p className="text-gray-500 text-sm font-medium">Customize your neural interface.</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden">
          
          {/* History Setting */}
          <div className="p-6 border-b border-gray-100/50 flex items-center justify-between hover:bg-white/40 transition-colors">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="maxHistoryLengthInput" className="font-semibold text-gray-800 text-base">
                Context Memory
              </label>
              <span className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Interactions to retain (0-10).
              </span>
            </div>
            <div className="flex items-center bg-gray-100/50 rounded-xl px-1 ring-1 ring-black/5">
              <input
                type="number"
                id="maxHistoryLengthInput"
                value={localHistoryLengthInput}
                onChange={(e) => setLocalHistoryLengthInput(e.target.value)}
                min="0"
                max="10"
                className="w-16 bg-transparent border-none text-center font-mono text-lg focus:ring-0 p-2 text-gray-800"
              />
            </div>
          </div>

          {/* Statefulness Setting */}
          <div className="p-6 flex items-center justify-between hover:bg-white/40 transition-colors">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="statefulnessCheckbox" className="font-semibold text-gray-800 text-base">
                Smart Caching
              </label>
              <span className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Remember generated interface states.
              </span>
            </div>
            <ToggleSwitch 
              id="statefulnessCheckbox"
              checked={localStatefulnessChecked}
              onChange={setLocalStatefulnessChecked}
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleApplyParameters}
            className="flex-1 bg-blue-600/90 backdrop-blur-sm text-white rounded-2xl py-3.5 px-4 font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-sm"
          >
            Apply Changes
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-white/50 backdrop-blur-sm text-gray-700 ring-1 ring-gray-200/50 rounded-2xl py-3.5 px-4 font-semibold hover:bg-white/80 transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};