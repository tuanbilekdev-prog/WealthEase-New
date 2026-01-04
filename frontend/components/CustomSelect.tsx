'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Option {
    value: string
    label: string
    icon?: string
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    dropUp?: boolean // Force drop up direction
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    dropUp = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-light-primary focus:outline-none transition-colors"
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.icon && <span>{selectedOption.icon}</span>}
                    <span className={!selectedOption ? 'text-gray-400' : ''}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
            </button>

            {isOpen && (
                <div
                    className={`absolute z-50 w-full rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-[#1E1E1E] shadow-xl overflow-hidden ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
                        }`}
                >
                    <ul className="max-h-60 overflow-auto">
                        {options.map((option) => (
                            <li key={option.value}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${value === option.value
                                            ? 'bg-light-primary/10 text-light-primary dark:text-light-primary font-medium'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {option.icon && <span>{option.icon}</span>}
                                    {option.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
