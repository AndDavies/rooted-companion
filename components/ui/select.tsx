'use client'

import * as React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
}

export function Select({ label, children, ...props }: SelectProps) {
  return (
    <div className="flex items-center gap-2">
      {label ? <label className="text-sm text-neutral-600">{label}</label> : null}
      <select {...props} className={`h-9 border rounded-md text-sm px-2 ${props.className ?? ''}`}>
        {children}
      </select>
    </div>
  )
}


