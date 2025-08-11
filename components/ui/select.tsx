'use client'

import * as React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
}

export function Select({ label, children, ...props }: SelectProps) {
  return (
    <div className="flex items-center gap-2">
      {label ? <label className="text-sm text-neutral-600">{label}</label> : null}
      <select {...props} className={`border rounded-md text-sm px-2 py-1 ${props.className ?? ''}`}>
        {children}
      </select>
    </div>
  )
}


