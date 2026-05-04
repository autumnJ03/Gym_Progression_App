import { createContext, useContext, useState, type ReactNode } from 'react'

export type WeightUnit = 'lbs' | 'kg'

interface WeightUnitContextType {
  unit: WeightUnit
  toggle: () => void
  toDisplay: (lbs: number) => number
  toStorage: (val: number) => number
  unitLabel: string
}

const WeightUnitContext = createContext<WeightUnitContextType>({
  unit: 'lbs',
  toggle: () => {},
  toDisplay: (v) => v,
  toStorage: (v) => v,
  unitLabel: 'lbs',
})

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<WeightUnit>(
    () => (localStorage.getItem('weightUnit') as WeightUnit) ?? 'lbs'
  )

  function toggle() {
    const next: WeightUnit = unit === 'lbs' ? 'kg' : 'lbs'
    localStorage.setItem('weightUnit', next)
    setUnit(next)
  }

  function toDisplay(lbs: number): number {
    if (unit === 'kg') return Math.round(lbs * 0.453592 * 4) / 4
    return lbs
  }

  function toStorage(val: number): number {
    return unit === 'kg' ? val / 0.453592 : val
  }

  return (
    <WeightUnitContext.Provider value={{ unit, toggle, toDisplay, toStorage, unitLabel: unit }}>
      {children}
    </WeightUnitContext.Provider>
  )
}

export function useWeightUnit() {
  return useContext(WeightUnitContext)
}
